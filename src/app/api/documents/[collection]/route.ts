import { NextResponse } from 'next/server';
import { addDocument, listDocuments, toDocumentStoreError } from '@/lib/server/document-store';
import { getCurrentUser, type AppUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const LISTABLE_COLLECTIONS = new Set(['lobbyMessages', 'lobbyChallenges']);
const CREATABLE_COLLECTIONS = new Set(['lobbyMessages', 'lobbyChallenges']);
const MAX_COLLECTION_LIMIT = 100;
const MAX_LOBBY_MESSAGE_LENGTH = 500;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeLimit(value: string | null) {
  const parsed = Number(value || '50');
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(MAX_COLLECTION_LIMIT, Math.floor(parsed)));
}

async function requireCollectionReadAccess(collection: string) {
  const user = await getCurrentUser();
  if (!user) return jsonError('Unauthorized', 401);

  if (!LISTABLE_COLLECTIONS.has(collection)) {
    return jsonError('Collection reads are not available for this resource.', 403);
  }

  return { user };
}

async function buildLobbyMessagePayload(body: any, user: AppUser) {
  const text = String(body?.data?.text || '').trim();

  if (!text) {
    return jsonError('Message text is required.', 400);
  }

  if (text.length > MAX_LOBBY_MESSAGE_LENGTH) {
    return jsonError(`Lobby messages must be ${MAX_LOBBY_MESSAGE_LENGTH} characters or fewer.`, 400);
  }

  return {
    senderId: user.uid,
    senderName: user.displayName || 'Anonymous',
    senderPhotoURL: user.photoURL || null,
    text,
    timestamp: new Date().toISOString(),
  };
}

async function buildLobbyChallengePayload(body: any, user: AppUser) {
  const openChallenges = await listDocuments<any>('lobbyChallenges');
  const alreadyOpen = openChallenges.some(
    (challenge) => challenge.creatorUid === user.uid && challenge.status === 'open'
  );

  if (alreadyOpen) {
    return jsonError('You already have an open challenge in the lobby.', 409);
  }

  return {
    creatorUid: user.uid,
    creatorDisplayName: user.displayName || user.email || 'Anonymous',
    creatorAvatarId: body?.data?.creatorAvatarId || 'user-1',
    creatorPhotoURL: user.photoURL || null,
    creatorAvatarPosterUrl: user.avatarPosterUrl || null,
    status: 'open' as const,
    createdAt: new Date().toISOString(),
  };
}

async function buildCreatePayload(collection: string, body: any, user: AppUser) {
  if (collection === 'lobbyMessages') {
    return buildLobbyMessagePayload(body, user);
  }

  if (collection === 'lobbyChallenges') {
    return buildLobbyChallengePayload(body, user);
  }

  return jsonError('Collection writes are not available for this resource.', 403);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: rawCollection } = await params;
    const collection = decodeURIComponent(rawCollection);
    const access = await requireCollectionReadAccess(collection);

    if (access instanceof NextResponse) return access;

    const url = new URL(request.url);
    const orderBy = url.searchParams.get('orderBy') || undefined;
    const direction = (url.searchParams.get('direction') || 'desc') as 'asc' | 'desc';

    const documents = await listDocuments(collection, {
      limit: sanitizeLimit(url.searchParams.get('limit')),
      orderBy,
      direction,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not load documents.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Could not load documents.' }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: rawCollection } = await params;
    const collection = decodeURIComponent(rawCollection);
    const user = await getCurrentUser();

    if (!user) return jsonError('Unauthorized', 401);
    if (!CREATABLE_COLLECTIONS.has(collection)) {
      return jsonError('Collection writes are not available for this resource.', 403);
    }

    const body = await request.json().catch(() => null);
    const payload = await buildCreatePayload(collection, body, user);

    if (payload instanceof NextResponse) return payload;

    const document = await addDocument(collection, payload);
    return NextResponse.json({ document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not create document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Could not create document.' }, { status });
  }
}
