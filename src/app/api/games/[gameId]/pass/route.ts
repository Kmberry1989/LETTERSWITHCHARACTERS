import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

type GameDoc = {
  players: string[];
  playerData: Record<string, { score: number }>;
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
};

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
  if (!gameId) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
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

  const opponentUid = gameData.players.find(player => player !== uid);
  if (!opponentUid) {
    return NextResponse.json({ error: 'Opponent information is missing.' }, { status: 400 });
  }

  const consecutivePasses = (gameData.consecutivePasses || 0) + 1;
  const updatePayload: Record<string, any> = {
    currentTurn: opponentUid,
    consecutivePasses,
  };

  if (consecutivePasses >= 2) {
    updatePayload.status = 'finished';
    const playerScore = gameData.playerData[uid]?.score || 0;
    const opponentScore = gameData.playerData[opponentUid]?.score || 0;
    updatePayload.winner = playerScore > opponentScore ? uid : opponentScore > playerScore ? opponentUid : 'draw';
  }

  await gameRef.update(updatePayload);

  return NextResponse.json({ consecutivePasses, status: updatePayload.status, winner: updatePayload.winner });
}
