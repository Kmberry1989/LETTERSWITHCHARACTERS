import { NextResponse } from 'next/server';
import { getDocument, setDocument, toDocumentStoreError, updateDocument } from '@/lib/server/document-store';
import { getCurrentUser, type AppUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

type AccessMode = 'read' | 'write';

const AUTHENTICATED_READ_COLLECTIONS = new Set(['lobbyMessages', 'lobbyChallenges']);
const USER_MUTATION_BLOCKLIST = new Set([
  'uid',
  'email',
  'isAnonymous',
  'providerId',
  'totalScore',
  'stats',
  'gameIds',
  'berries',
  'experience',
  'level',
  'createdAt',
  'updatedAt',
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function canReadDocument(collection: string, documentId: string, document: any, user: AppUser) {
  if (collection === 'users') {
    return user.uid === documentId;
  }

  if (collection === 'games') {
    return Array.isArray(document?.players) && document.players.includes(user.uid);
  }

  return AUTHENTICATED_READ_COLLECTIONS.has(collection);
}

function canWriteDocument(collection: string, documentId: string, _document: any, user: AppUser) {
  if (collection === 'users') {
    return user.uid === documentId;
  }

  return false;
}

async function requireDocumentAccess(collection: string, documentId: string, mode: AccessMode) {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError('Unauthorized', 401), user: null, document: null };

  const document = await getDocument(collection, documentId);
  if (!document) return { error: jsonError('Document not found.', 404), user, document: null };

  const isAllowed = mode === 'read'
    ? canReadDocument(collection, documentId, document, user)
    : canWriteDocument(collection, documentId, document, user);

  if (!isAllowed) {
    return { error: jsonError('You do not have access to this document.', 403), user, document };
  }

  return { error: null, user, document };
}

function sanitizeUserMutation(input: Record<string, any>) {
  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(input || {})) {
    const rootKey = key.split('.')[0];

    if (USER_MUTATION_BLOCKLIST.has(rootKey)) {
      continue;
    }

    output[key] = value;
  }

  output.updatedAt = new Date().toISOString();
  return output;
}

function hasWritableKeys(input: Record<string, any>) {
  return Object.keys(input).some((key) => key !== 'updatedAt');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
  try {
    const { collection: rawCollection, documentId: rawDocumentId } = await params;
    const collection = decodeURIComponent(rawCollection);
    const documentId = decodeURIComponent(rawDocumentId);
    const access = await requireDocumentAccess(collection, documentId, 'read');

    if (access.error) return access.error;

    return NextResponse.json({ document: access.document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not load document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Could not load document.' }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
  try {
    const { collection: rawCollection, documentId: rawDocumentId } = await params;
    const collection = decodeURIComponent(rawCollection);
    const documentId = decodeURIComponent(rawDocumentId);
    const access = await requireDocumentAccess(collection, documentId, 'write');

    if (access.error) return access.error;

    const body = await request.json().catch(() => null);
    const sanitizedData = collection === 'users'
      ? sanitizeUserMutation(body?.data || {})
      : body?.data || {};

    if (collection === 'users' && !hasWritableKeys(sanitizedData)) {
      return jsonError('No writable user profile fields were provided.', 400);
    }

    const document = await setDocument(
      collection,
      documentId,
      sanitizedData,
      Boolean(body?.merge)
    );

    return NextResponse.json({ document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not save document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Could not save document.' }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
  try {
    const { collection: rawCollection, documentId: rawDocumentId } = await params;
    const collection = decodeURIComponent(rawCollection);
    const documentId = decodeURIComponent(rawDocumentId);
    const access = await requireDocumentAccess(collection, documentId, 'write');

    if (access.error) return access.error;

    const body = await request.json().catch(() => null);
    const sanitizedPatch = collection === 'users'
      ? sanitizeUserMutation(body?.patch || {})
      : body?.patch || {};

    if (collection === 'users' && !hasWritableKeys(sanitizedPatch)) {
      return jsonError('No writable user profile fields were provided.', 400);
    }

    const document = await updateDocument(
      collection,
      documentId,
      sanitizedPatch
    );

    return NextResponse.json({ document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not update document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : normalized.message.includes('does not exist') ? 404 : 500;
    return NextResponse.json({ error: normalized.message || 'Could not update document.' }, { status });
  }
}
