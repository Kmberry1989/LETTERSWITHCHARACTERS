import { NextResponse } from 'next/server';
import { addDocument, listDocuments, toDocumentStoreError } from '@/lib/server/document-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const orderBy = url.searchParams.get('orderBy') || undefined;
    const direction = (url.searchParams.get('direction') || 'desc') as 'asc' | 'desc';

    const documents = await listDocuments(decodeURIComponent(collection), {
      limit: Number.isFinite(limit) ? limit : 50,
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
    const { collection } = await params;
    const body = await request.json().catch(() => null);
    const document = await addDocument(decodeURIComponent(collection), body?.data || {});
    return NextResponse.json({ document });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Could not create document.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Could not create document.' }, { status });
  }
}
