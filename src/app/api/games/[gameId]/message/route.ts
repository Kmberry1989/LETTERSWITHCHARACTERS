import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

type GameDoc = {
  players: string[];
  messages?: Array<{
    senderId: string;
    senderName: string;
    text: string;
    timestamp: any;
  }>;
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
  const body = await request.json();
  const text: string = typeof body.text === 'string' ? body.text.trim() : '';
  const senderName: string = typeof body.senderName === 'string' ? body.senderName : 'Anonymous';

  if (!gameId || !text) {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
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

  const newMessage = {
    senderId: uid,
    senderName,
    text,
    timestamp: FieldValue.serverTimestamp(),
  };

  await gameRef.update({
    messages: [...(gameData.messages || []), newMessage],
  });

  return NextResponse.json({ success: true });
}
