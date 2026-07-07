import { NextResponse } from 'next/server';
import { destroySession, getCurrentSessionToken, getCurrentUser } from '@/lib/server/auth';
import { toDocumentStoreError } from '@/lib/server/document-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const token = await getCurrentSessionToken();

    return NextResponse.json({
      user: user
        ? {
            ...user,
            token,
          }
        : null,
    });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Authentication storage is unavailable.' }, { status });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Supabase Auth is handled client-side for sign-in.' }, { status: 405 });
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 500;
    return NextResponse.json({ error: normalized.message || 'Authentication storage is unavailable.' }, { status });
  }
}
