import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { PlacedTile, Tile } from '@/lib/game/types';
import { calculateScore, getWordsFromPlacedTiles } from '@/lib/scoring';
import { drawTiles } from '@/lib/game-logic';
import { validatePlayableWord } from '@/lib/server/word-validator';

export const dynamic = 'force-dynamic';

type GameDoc = {
  players: string[];
  playerData: Record<
    string,
    {
      displayName: string;
      score: number;
      avatarId: string;
      photoURL?: string | null;
      avatarPresetId?: string | null;
      avatarPosterUrl?: string | null;
      tiles: Tile[];
      hintUsed?: boolean;
    }
  >;
  board: Record<string, Tile>;
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
};

type MoveValidationResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

const BOARD_SIZE = 15;
const CENTER_KEY = '7-7';

function tileKey(row: number, col: number) {
  return `${row}-${col}`;
}

function normalizePendingTiles(pendingTiles: PlacedTile[]): PlacedTile[] {
  return pendingTiles.map((tile) => ({
    ...tile,
    letter: String(tile.letter || '').toUpperCase(),
  }));
}

function isInsideBoard(row: number, col: number) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  );
}

function isBoardEmpty(board: Record<string, Tile>) {
  return Object.keys(board || {}).length === 0;
}

function hasExistingNeighbor(tile: PlacedTile, board: Record<string, Tile>) {
  const neighbors = [
    tileKey(tile.row - 1, tile.col),
    tileKey(tile.row + 1, tile.col),
    tileKey(tile.row, tile.col - 1),
    tileKey(tile.row, tile.col + 1),
  ];

  return neighbors.some((key) => Boolean(board[key]));
}

function validateMovePlacement(
  pendingTiles: PlacedTile[],
  board: Record<string, Tile>
): MoveValidationResult {
  if (!Array.isArray(pendingTiles) || pendingTiles.length === 0) {
    return { ok: false, error: 'No tiles to play.', status: 400 };
  }

  const seenSquares = new Set<string>();

  for (const tile of pendingTiles) {
    if (!isInsideBoard(tile.row, tile.col)) {
      return { ok: false, error: 'One or more tiles are outside the board.', status: 400 };
    }

    if (!tile.letter || !/^[A-Z]$/.test(tile.letter)) {
      return {
        ok: false,
        error: 'Every played tile must have a single letter selected.',
        status: 400,
      };
    }

    const key = tileKey(tile.row, tile.col);

    if (seenSquares.has(key)) {
      return { ok: false, error: 'Duplicate tile placement detected.', status: 400 };
    }

    if (board[key]) {
      return { ok: false, error: 'Cannot place tiles on already occupied squares.', status: 400 };
    }

    seenSquares.add(key);
  }

  const allSameRow = pendingTiles.every((tile) => tile.row === pendingTiles[0].row);
  const allSameCol = pendingTiles.every((tile) => tile.col === pendingTiles[0].col);

  if (!allSameRow && !allSameCol) {
    return { ok: false, error: 'Tiles must be placed in a single row or column.', status: 400 };
  }

  const firstMove = isBoardEmpty(board);

  if (firstMove && !pendingTiles.some((tile) => tileKey(tile.row, tile.col) === CENTER_KEY)) {
    return { ok: false, error: 'The first word must cover the center star.', status: 400 };
  }

  if (!firstMove && !pendingTiles.some((tile) => hasExistingNeighbor(tile, board))) {
    return {
      ok: false,
      error: 'Your word must connect to at least one tile already on the board.',
      status: 400,
    };
  }

  const pendingKeys = new Set(pendingTiles.map((tile) => tileKey(tile.row, tile.col)));

  if (allSameRow) {
    const row = pendingTiles[0].row;
    const cols = pendingTiles.map((tile) => tile.col);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    for (let col = minCol; col <= maxCol; col += 1) {
      const key = tileKey(row, col);
      if (!pendingKeys.has(key) && !board[key]) {
        return {
          ok: false,
          error: 'Tiles must form one continuous word with no empty gaps.',
          status: 400,
        };
      }
    }
  }

  if (allSameCol) {
    const col = pendingTiles[0].col;
    const rows = pendingTiles.map((tile) => tile.row);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    for (let row = minRow; row <= maxRow; row += 1) {
      const key = tileKey(row, col);
      if (!pendingKeys.has(key) && !board[key]) {
        return {
          ok: false,
          error: 'Tiles must form one continuous word with no empty gaps.',
          status: 400,
        };
      }
    }
  }

  return { ok: true };
}

function removeTilesFromRack(rack: Tile[], placedTiles: PlacedTile[]): Tile[] | null {
  const workingRack = [...rack];

  for (const placed of placedTiles) {
    const index = workingRack.findIndex((tile) => {
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

async function safelyValidateWord(word: string) {
  return validatePlayableWord(word);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const uid = await verifyAuth(request);

  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gameId } = await params;
  const body = await request.json().catch(() => null);
  const pendingTiles = normalizePendingTiles(body?.pendingTiles || []) as PlacedTile[];

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is missing.' }, { status: 400 });
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

  const opponentUid = gameData.players.find((player) => player !== uid);

  if (!opponentUid) {
    return NextResponse.json({ error: 'Opponent information is missing.' }, { status: 400 });
  }

  const placementValidation = validateMovePlacement(pendingTiles, gameData.board || {});

  if (!placementValidation.ok) {
    return NextResponse.json(
      { error: placementValidation.error },
      { status: placementValidation.status || 400 }
    );
  }

  const formedWordsInfo = getWordsFromPlacedTiles(pendingTiles, gameData.board || {});

  if (formedWordsInfo.length === 0) {
    return NextResponse.json(
      { error: 'Tiles must form a word with at least two letters.' },
      { status: 400 }
    );
  }

  for (const wordInfo of formedWordsInfo) {
    const { isValid, reason } = await safelyValidateWord(wordInfo.word);

    if (!isValid) {
      return NextResponse.json(
        { error: `"${wordInfo.word}" is not a valid word. ${reason}` },
        { status: 400 }
      );
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

  const newBoard: Record<string, Tile> = { ...(gameData.board || {}) };

  for (const tile of pendingTiles) {
    newBoard[tileKey(tile.row, tile.col)] = {
      letter: tile.letter,
      score: tile.score,
      isBlank: tile.isBlank,
    };
  }

  const tilesToDrawCount = pendingTiles.length;
  const [newTilesForPlayer, updatedTileBag] = drawTiles(gameData.tileBag || [], tilesToDrawCount);
  const finalPlayerTiles = [...remainingRack, ...newTilesForPlayer];

  const score = calculateScore(pendingTiles, gameData.board || {});
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
