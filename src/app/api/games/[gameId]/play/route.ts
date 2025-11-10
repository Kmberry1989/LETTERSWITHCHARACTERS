import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { PlacedTile, Tile } from '@/lib/game/types';
import { calculateScore, getWordsFromPlacedTiles } from '@/lib/scoring';
import { drawTiles } from '@/lib/game-logic';
import { validateWord } from '@/ai/validate-word';

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

function normalizePendingTiles(pendingTiles: PlacedTile[]): PlacedTile[] {
  return pendingTiles.map(tile => ({
    ...tile,
    letter: tile.letter.toUpperCase(),
  }));
}

function removeTilesFromRack(rack: Tile[], placedTiles: PlacedTile[]): Tile[] | null {
  const workingRack = [...rack];

  for (const placed of placedTiles) {
    const index = workingRack.findIndex(tile => {
      if (tile.isBlank || tile.letter === ' ') {
        return placed.isBlank === true && tile.score === placed.score;
      }
      return tile.letter === placed.letter && tile.score === placed.score;
    });

    if (index === -1) {
      return null;
    }

    workingRack.splice(index, 1);
  }

  return workingRack;
}

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId } = params;
  const body = await request.json();
  const pendingTiles = normalizePendingTiles(body.pendingTiles || []) as PlacedTile[];

  if (!gameId || !Array.isArray(pendingTiles) || pendingTiles.length === 0) {
    return NextResponse.json({ error: 'No tiles to play.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const gameRef = db.collection('games').doc(gameId);
  const gameSnap = await gameRef.get();

  if (!gameSnap.exists) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
  }

  const gameData = gameSnap.data() as GameDoc;

  if (!gameData.players.includes(uid)) {
    return NextResponse.json({ error: 'You are not a participant in this game.' }, { status: 403 });
  }

  if (gameData.currentTurn !== uid) {
    return NextResponse.json({ error: "It's not your turn." }, { status: 409 });
  }

  if (gameData.status !== 'active') {
    return NextResponse.json({ error: 'The game is not currently active.' }, { status: 409 });
  }

  const opponentUid = gameData.players.find(player => player !== uid);
  if (!opponentUid) {
    return NextResponse.json({ error: 'Opponent information is missing.' }, { status: 400 });
  }

  const formedWordsInfo = getWordsFromPlacedTiles(pendingTiles, gameData.board);
  if (formedWordsInfo.length === 0 && pendingTiles.length > 1) {
    return NextResponse.json({ error: 'Tiles must form a single continuous line.' }, { status: 400 });
  }

  for (const wordInfo of formedWordsInfo) {
    const { isValid, reason } = await validateWord({ word: wordInfo.word });
    if (!isValid) {
      return NextResponse.json({ error: `"${wordInfo.word}" is not a valid word. ${reason}` }, { status: 400 });
    }
  }

  const playerData = gameData.playerData[uid];
  if (!playerData) {
    return NextResponse.json({ error: 'Player data missing.' }, { status: 400 });
  }

  const remainingRack = removeTilesFromRack(playerData.tiles, pendingTiles);
  if (!remainingRack) {
    return NextResponse.json({ error: 'Played tiles do not match your rack.' }, { status: 400 });
  }

  const newBoard: Record<string, Tile> = { ...gameData.board };
  pendingTiles.forEach(tile => {
    newBoard[`${tile.row}-${tile.col}`] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
  });

  const tilesToDrawCount = pendingTiles.length;
  const [newTilesForPlayer, updatedTileBag] = drawTiles(gameData.tileBag, tilesToDrawCount);
  const finalPlayerTiles = [...remainingRack, ...newTilesForPlayer];

  const score = calculateScore(pendingTiles, gameData.board);
  const updatedScore = (playerData.score || 0) + score;

  await gameRef.update({
    board: newBoard,
    tileBag: updatedTileBag,
    [`playerData.${uid}.score`]: updatedScore,
    [`playerData.${uid}.tiles`]: finalPlayerTiles,
    currentTurn: opponentUid,
    consecutivePasses: 0,
  });

  return NextResponse.json({ score });
}
