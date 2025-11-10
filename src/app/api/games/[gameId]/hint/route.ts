import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

type GameDoc = {
  players: string[];
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

  await gameRef.update({ [`playerData.${uid}.hintUsed`]: true });

  return NextResponse.json({ success: true });
}
