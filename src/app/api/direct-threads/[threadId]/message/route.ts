import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import type { DirectInvitePayload, DirectMessage, DirectThread } from '@/lib/direct-threads';
import { notifyUserChat } from '@/lib/server/turn-notifications';

export const dynamic = 'force-dynamic';

function buildPreview(message: DirectMessage) {
  if (message.invite) {
    return `${message.senderName} sent a play invite`;
  }
  return message.text.slice(0, 120);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = await getDocument<DirectThread>('directThreads', decodeURIComponent(threadId));

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
  }
  if (!thread.participantIds.includes(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const inviteRequested = Boolean(body?.invite);

  if (!text && !inviteRequested) {
    return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
  }

  const recipientId = thread.participantIds.find((participantId) => participantId !== user.uid);
  if (!recipientId) {
    return NextResponse.json({ error: 'Recipient missing.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const invite: DirectInvitePayload | null = inviteRequested
    ? {
        id: crypto.randomUUID(),
        senderId: user.uid,
        recipientId,
        status: 'pending',
        createdAt: now,
        acceptedAt: null,
        gameId: null,
      }
    : null;

  const message: DirectMessage = {
    id: crypto.randomUUID(),
    senderId: user.uid,
    senderName: user.displayName || user.email || 'Player',
    text: text || 'Play with me',
    timestamp: now,
    invite,
  };

  const nextMessages = [...(thread.messages || []), message].slice(-200);
  const nextUnreadCounts = {
    ...(thread.unreadCounts || {}),
    [user.uid]: 0,
    [recipientId]: (thread.unreadCounts?.[recipientId] || 0) + 1,
  };

  const updatedThread = await updateDocument('directThreads', thread.id, {
    messages: nextMessages,
    unreadCounts: nextUnreadCounts,
    lastMessagePreview: buildPreview(message),
    updatedAt: now,
  });

  await notifyUserChat({
    userId: recipientId,
    title: invite ? 'New play invite' : 'New direct message',
    body: invite ? `${message.senderName} invited you to play.` : `${message.senderName}: ${message.text}`,
    gameUrl: invite ? `${new URL(request.url).origin}/dashboard` : `${new URL(request.url).origin}/dashboard`,
  });

  return NextResponse.json({ thread: updatedThread, message });
}
