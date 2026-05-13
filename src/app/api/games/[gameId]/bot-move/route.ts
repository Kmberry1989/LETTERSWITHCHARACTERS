import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { PlacedTile, Tile } from '@/lib/game/types';
import { calculateScore } from '@/lib/scoring';
import { drawTiles } from '@/lib/game-logic';
import { generateBotMove } from '@/ai/ai-bot-move';

type GameDoc = {
    players: string[];
    playerData: Record<string, {
        displayName: string;
        score: number;
        avatarId: string;
        photoURL?: string | null;
        tiles: Tile[];
        hintUsed?: boolean;
    }>;
    board: Record<string, Tile>;
    tileBag: Tile[];
    currentTurn: string;
    status: 'active' | 'pending' | 'finished';
    consecutivePasses?: number;
};

// Helper to remove used tiles from bot's rack
function removeTilesFromRack(rack: Tile[], placedTiles: PlacedTile[]): Tile[] | null {
    const workingRack = [...rack];

    for (const placed of placedTiles) {
        const index = workingRack.findIndex(tile => {
            if (tile.isBlank || tile.letter === ' ') {
                return placed.isBlank === true; // Simplified for bot: just check if it's a blank
            }
            return tile.letter === placed.letter;
        });

        if (index === -1) {
            return null;
        }

        workingRack.splice(index, 1);
    }

    return workingRack;
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
    // 1. Verify Request (can be triggered by client or cron, but for now client triggers it)
    // We might want to verify the user triggering it is the *other* player, or just verify the game state.
    // For simplicity, we'll check if it is indeed the bot's turn.

    const { gameId } = params;
    const body = await request.json();
    const difficulty = body.difficulty || 'Medium';

    const db = getAdminFirestore();
    const gameRef = db.collection('games').doc(gameId);
    const gameSnap = await gameRef.get();

    if (!gameSnap.exists) {
        return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const gameData = gameSnap.data() as GameDoc;
    const botUid = 'bitty-botty-001'; // Hardcoded for now

    if (gameData.currentTurn !== botUid) {
        return NextResponse.json({ error: "It's not the bot's turn." }, { status: 409 });
    }

    const botData = gameData.playerData[botUid];
    if (!botData) {
        return NextResponse.json({ error: "Bot is not in this game." }, { status: 400 });
    }

    // 2. Generate Move
    const botTilesString = botData.tiles.map(t => t.letter).join('');
    const boardStateString = JSON.stringify(gameData.board);

    const move = await generateBotMove({
        tiles: botTilesString,
        boardState: boardStateString,
        difficulty: difficulty
    });

    if (!move) {
        // Bot passes if it can't find a move
        // TODO: Implement pass logic
        return NextResponse.json({ message: 'Bot passed.' });
    }

    // 3. Process Move (Convert AI output to PlacedTiles)
    const pendingTiles: PlacedTile[] = [];
    const word = move.word.toUpperCase();
    let currentRow = move.startRow;
    let currentCol = move.startCol;

    for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        const squareKey = `${currentRow}-${currentCol}`;

        // If square is empty, it means we are placing a tile there
        if (!gameData.board[squareKey]) {
            // Find the tile in bot's rack
            const tileInRack = botData.tiles.find(t => t.letter === letter) || botData.tiles.find(t => t.letter === ' ');

            if (tileInRack) {
                pendingTiles.push({
                    letter: letter,
                    score: tileInRack.letter === ' ' ? 0 : tileInRack.score, // Simple score lookup needed if we don't have it
                    row: currentRow,
                    col: currentCol,
                    isBlank: tileInRack.letter === ' '
                });
            }
        }

        if (move.direction === 'horizontal') {
            currentCol++;
        } else {
            currentRow++;
        }
    }

    // 4. Validate & Update Game (Reuse logic similar to play route, or just trust the bot for now)
    // For robustness, we should validate, but for this MVP we'll trust the AI output + basic checks.

    const remainingRack = removeTilesFromRack(botData.tiles, pendingTiles);

    if (!remainingRack) {
        // Fallback: Bot tried to play tiles it doesn't have. Pass turn.
        const opponentUid = gameData.players.find(p => p !== botUid);
        await gameRef.update({
            currentTurn: opponentUid,
            consecutivePasses: (gameData.consecutivePasses || 0) + 1
        });
        return NextResponse.json({ message: 'Bot passed (invalid move).' });
    }


    const newBoard: Record<string, Tile> = { ...gameData.board };
    for (const tile of pendingTiles) {
        const squareKey = `${tile.row}-${tile.col}`;
        newBoard[squareKey] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
    }

    const tilesToDrawCount = pendingTiles.length;
    const [newTilesForBot, updatedTileBag] = drawTiles(gameData.tileBag, tilesToDrawCount);
    const finalBotTiles = [...remainingRack, ...newTilesForBot];

    const score = calculateScore(pendingTiles, gameData.board);
    const updatedScore = (botData.score || 0) + score;
    const opponentUid = gameData.players.find(p => p !== botUid);

    await gameRef.update({
        board: newBoard,
        tileBag: updatedTileBag,
        [`playerData.${botUid}.score`]: updatedScore,
        [`playerData.${botUid}.tiles`]: finalBotTiles,
        currentTurn: opponentUid,
        consecutivePasses: 0,
    });

    return NextResponse.json({ score, word: move.word });
}
