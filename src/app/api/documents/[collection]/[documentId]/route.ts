import { NextResponse } from 'next/server';
import { getDocument, setDocument, updateDocument } from '@/lib/server/document-store';
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
  const { collection, documentId } = await params;
  const document = await getDocument(decodeURIComponent(collection), decodeURIComponent(documentId));

  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
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
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collection: string; documentId: string }> }
) {
  const { collection, documentId } = await params;
  const accessError = await ensureMutationAccess(decodeURIComponent(collection), decodeURIComponent(documentId));
  if (accessError) return accessError;
  const body = await request.json().catch(() => null);

  try {
    const document = await updateDocument(
      decodeURIComponent(collection),
      decodeURIComponent(documentId),
      body?.patch || {}
    );

    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not update document.' }, { status: 404 });
  }
}
