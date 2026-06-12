import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, listDocuments, setDocument } from '@/lib/server/document-store';
import { resolveAvatarImage } from '@/lib/avatar-catalog';
import type { UserProfile } from '@/firebase/firestore/use-users';
import type { DirectThread } from '@/lib/direct-threads';
import { buildDirectThreadId, normalizeDirectThreads } from '@/lib/direct-threads';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threads = await listDocuments<DirectThread>('directThreads', {
    orderBy: 'updatedAt',
    direction: 'desc',
    limit: 100,
  });

  const visibleThreads = normalizeDirectThreads(
    threads.filter((thread) => Array.isArray(thread.participantIds) && thread.participantIds.includes(user.uid))
  );

  return NextResponse.json({ threads: visibleThreads });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const recipientUserId = typeof body?.recipientUserId === 'string' ? body.recipientUserId.trim() : '';

  if (!recipientUserId || recipientUserId === user.uid) {
    return NextResponse.json({ error: 'Choose another player.' }, { status: 400 });
  }

  const [senderProfile, recipientProfile] = await Promise.all([
    getDocument<UserProfile>('users', user.uid),
    getDocument<UserProfile>('users', recipientUserId),
  ]);

  if (!senderProfile || !recipientProfile) {
    return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
  }

  const threadId = buildDirectThreadId(user.uid, recipientUserId);
  const existingThread = await getDocument<DirectThread>('directThreads', threadId);

  if (existingThread) {
    return NextResponse.json({ thread: existingThread });
  }

  const createdAt = new Date().toISOString();
  const nextThread: Omit<DirectThread, 'id'> = {
    participantIds: [user.uid, recipientUserId],
    participantMeta: {
      [user.uid]: {
        displayName: senderProfile.displayName || senderProfile.email || 'Player',
        photoURL: senderProfile.photoURL || null,
        avatarPosterUrl: resolveAvatarImage(senderProfile) || senderProfile.avatarPosterUrl || null,
      },
      [recipientUserId]: {
        displayName: recipientProfile.displayName || recipientProfile.email || 'Player',
        photoURL: recipientProfile.photoURL || null,
        avatarPosterUrl: resolveAvatarImage(recipientProfile) || recipientProfile.avatarPosterUrl || null,
      },
    },
    messages: [],
    unreadCounts: {
      [user.uid]: 0,
      [recipientUserId]: 0,
    },
    lastMessagePreview: '',
    updatedAt: createdAt,
    createdAt,
  };

  const thread = await setDocument('directThreads', threadId, nextThread, false);
  return NextResponse.json({ thread });
}
