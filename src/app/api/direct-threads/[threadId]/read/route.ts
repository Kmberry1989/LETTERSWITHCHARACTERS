import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import type { DirectThread } from '@/lib/direct-threads';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
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

  const updatedThread = await updateDocument('directThreads', thread.id, {
    unreadCounts: {
      ...(thread.unreadCounts || {}),
      [user.uid]: 0,
    },
  });

  return NextResponse.json({ thread: updatedThread });
}
