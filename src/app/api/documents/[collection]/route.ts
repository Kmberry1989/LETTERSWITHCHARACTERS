import { z } from 'zod';
import { addDocument, getDocument, listDocuments } from '@/lib/server/document-store';
import { getCurrentUser } from '@/lib/server/auth';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk } from '@/lib/server/api';
import { assertReadableCollection, visibleDocument } from '@/lib/server/document-access';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ collection: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const { collection } = await params;
    assertReadableCollection(collection);
    const query = new URL(request.url).searchParams;
    const limit = Number(query.get('limit') ?? 50);
    const direction = query.get('direction') ?? 'desc';
    const orderBy = query.get('orderBy') || undefined;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !['asc', 'desc'].includes(direction)
      || (orderBy && !['timestamp', 'createdAt', 'updatedAt', 'totalScore', 'displayName'].includes(orderBy))) {
      throw new ApiRequestError('INVALID_QUERY', 'Invalid collection query.', 400);
    }
    const documents = await listDocuments(collection, {
      limit, orderBy, direction: direction as 'asc' | 'desc',
      ...(collection === 'games' ? { participant: { field: 'players' as const, uid: user.uid } } : {}),
      ...(collection === 'directThreads' ? { participant: { field: 'participantIds' as const, uid: user.uid } } : {}),
    });
    return jsonOk({ documents: documents.map((document) => visibleDocument(collection, document, user.uid)).filter(Boolean) }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not load documents.'), request);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const { collection } = await params;
    if (!['lobbyMessages', 'lobbyChallenges'].includes(collection)) throw new ApiRequestError('FORBIDDEN', 'Use the dedicated action for this collection.', 403);
    enforceRateLimit(request, `lobby-create:${user.uid}`, 30, 60_000);
    const body = await request.json().catch(() => null);
    const profile = await getDocument('users', user.uid);
    if (!profile) throw new ApiRequestError('NOT_FOUND', 'Profile not found.', 404);
    let data;
    if (collection === 'lobbyMessages') {
      const parsed = z.object({ text: z.string().trim().min(1).max(2000) }).safeParse(body?.data);
      if (!parsed.success) throw new ApiRequestError('INVALID_MESSAGE', 'Enter a message of up to 2000 characters.', 400);
      data = { text: parsed.data.text, senderId: user.uid, senderName: profile.displayName || 'Player', senderPhotoURL: profile.photoURL || null, timestamp: new Date().toISOString() };
    } else {
      data = { creatorUid: user.uid, creatorDisplayName: profile.displayName || 'Player', creatorAvatarId: profile.avatarId || 'user-1', creatorPhotoURL: profile.photoURL || null, creatorAvatarPosterUrl: profile.avatarPosterUrl || null, status: 'open', createdAt: new Date().toISOString() };
    }
    return jsonOk({ document: await addDocument(collection, data) }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not create document.'), request);
  }
}
