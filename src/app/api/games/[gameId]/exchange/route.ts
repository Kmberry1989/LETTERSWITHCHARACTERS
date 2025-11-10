import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { Tile } from '@/lib/game/types';
import { drawTiles } from '@/lib/game-logic';

type GameDoc = {
  players: string[];
  playerData: Record<string, { tiles: Tile[] }>;
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
};

function removeTiles(rack: Tile[], tilesToRemove: Tile[]): Tile[] | null {
  const remaining = [...rack];

  for (const tile of tilesToRemove) {
    const index = remaining.findIndex(candidate => {
      if (candidate.isBlank || candidate.letter === ' ') {
        return tile.isBlank === true && candidate.score === tile.score;
      }
      return candidate.letter === tile.letter && candidate.score === tile.score;
    });

    if (index === -1) {
      return null;
    }

    remaining.splice(index, 1);
  }

  return remaining;
}

function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  const tilesToExchange = Array.isArray(body.tiles) ? body.tiles as Tile[] : [];

  if (!gameId || tilesToExchange.length === 0) {
    return NextResponse.json({ error: 'No tiles selected for exchange.' }, { status: 400 });
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

  if (gameData.tileBag.length < 7) {
    return NextResponse.json({ error: 'Not enough tiles left in the bag to exchange.' }, { status: 400 });
  }

  const playerData = gameData.playerData[uid];
  if (!playerData) {
    return NextResponse.json({ error: 'Player data missing.' }, { status: 400 });
  }

  const remainingRack = removeTiles(playerData.tiles, tilesToExchange);
  if (!remainingRack) {
    return NextResponse.json({ error: 'Selected tiles do not match your rack.' }, { status: 400 });
  }

  const [newTiles, tileBagAfterDraw] = drawTiles(gameData.tileBag, tilesToExchange.length);
  const replenishedBag = shuffleTiles([...tileBagAfterDraw, ...tilesToExchange]);
  const finalRack = [...remainingRack, ...newTiles];

  const opponentUid = gameData.players.find(player => player !== uid);

  await gameRef.update({
    tileBag: replenishedBag,
    [`playerData.${uid}.tiles`]: finalRack,
    currentTurn: opponentUid,
    consecutivePasses: 0,
  });

  return NextResponse.json({ exchanged: tilesToExchange.length });
}
