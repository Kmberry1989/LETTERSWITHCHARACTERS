import { NextResponse } from 'next/server';
import { createSession, destroySession, getCurrentSessionToken, getCurrentUser, getUserByToken, makeUser, upsertUserProfile } from '@/lib/server/auth';
import { signInWithPassword, signUpWithPassword } from '@/lib/server/password-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
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
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const mode = body?.mode || 'email';
  const action = body?.action || 'signin';

  let user;

  if (mode === 'guest') {
    const guestId = `guest-${crypto.randomUUID()}`;
    user = makeUser({
      uid: guestId,
      email: null,
      displayName: body?.displayName || 'Anonymous Player',
      photoURL: null,
      isAnonymous: true,
      providerId: 'guest',
    });
  } else if (mode === 'google' || mode === 'apple') {
    const uid = String(body?.uid || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!uid || !email) {
      return NextResponse.json(
        { error: `${mode === 'apple' ? 'Apple' : 'Google'} sign-in did not return a valid user profile.` },
        { status: 400 }
      );
    }

    user = makeUser({
      uid,
      email,
      displayName: body?.displayName || email.split('@')[0] || (mode === 'apple' ? 'Apple Player' : 'Google Player'),
      photoURL: body?.photoURL || null,
      providerId: mode === 'apple' ? 'apple.com' : 'google.com',
    });
  } else {
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    try {
      user =
        action === 'signup'
          ? await signUpWithPassword({
              username,
              password,
              displayName: body?.displayName || username,
            })
          : await signInWithPassword({
              username,
              password,
            });
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || 'Could not authenticate with username and password.' }, { status: 400 });
    }
  }

  if (mode !== 'email') {
    await upsertUserProfile(user);
  }
  const token = await createSession(user);
  const sessionUser = await getUserByToken(token);

  return NextResponse.json({
    user: {
      ...sessionUser,
      token,
    },
  });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
