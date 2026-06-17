import { NextResponse } from 'next/server';
import { getDocument, setDocument, toDocumentStoreError, updateDocument } from '@/lib/server/document-store';
import { getCurrentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

async function ensureMutationAccess(collection: string, documentId: string) {
  if (collection !== 'users') return null;

  const user = await getCurrentUser();
  if (!user || user.uid !== documentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
  try {
    const { collection, documentId } = await params;
    const document = await getDocument(decodeURIComponent(collection), decodeURIComponent(documentId));

    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    return NextResponse.json({ document });
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
    const { collection, documentId } = await params;
    const accessError = await ensureMutationAccess(decodeURIComponent(collection), decodeURIComponent(documentId));
    if (accessError) return accessError;
    const body = await request.json().catch(() => null);
    const document = await setDocument(
      decodeURIComponent(collection),
      decodeURIComponent(documentId),
      body?.data || {},
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
    const { collection, documentId } = await params;
    const accessError = await ensureMutationAccess(decodeURIComponent(collection), decodeURIComponent(documentId));
    if (accessError) return accessError;
    const body = await request.json().catch(() => null);
    const document = await updateDocument(
      decodeURIComponent(collection),
      decodeURIComponent(documentId),
      body?.patch || {}
    );

    return NextResponse.json({ document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not update document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : normalized.message.includes('does not exist') ? 404 : 500;
    return NextResponse.json({ error: normalized.message || 'Could not update document.' }, { status });
  }
}
