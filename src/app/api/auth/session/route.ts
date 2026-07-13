import { NextResponse } from 'next/server';
import { createSession, destroySession, getCurrentSessionToken, getCurrentUser, makeUser, upsertUserProfile } from '@/lib/server/auth';
import { toDocumentStoreError } from '@/lib/server/document-store';
import { signInWithPassword, signUpWithPassword } from '@/lib/server/password-auth';

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const mode = body?.mode || 'email';
    const action = body?.action === 'signup' ? 'signup' : 'signin';

    let user;

    if (mode === 'guest') {
      user = makeUser({
        uid: `guest-${crypto.randomUUID()}`,
        email: null,
        displayName: body?.displayName || 'Guest Player',
        photoURL: null,
        isAnonymous: true,
        providerId: 'guest',
      });
      await upsertUserProfile(user);
    } else if (mode === 'email') {
      const username = String(body?.username || '');
      const password = String(body?.password || '');
      const displayName = typeof body?.displayName === 'string' ? body.displayName : undefined;

      user =
        action === 'signup'
          ? await signUpWithPassword({ username, password, displayName })
          : await signInWithPassword({ username, password });
    } else {
      return NextResponse.json({ error: 'This sign-in method must be handled client-side.' }, { status: 405 });
    }

    const token = await createSession(user);

    return NextResponse.json({
      user: {
        ...user,
        token,
      },
    });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    const status = 'status' in normalized && typeof normalized.status === 'number' ? normalized.status : 400;
    return NextResponse.json({ error: normalized.message || 'Could not sign in.' }, { status });
  }
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
