import { NextResponse } from 'next/server';
import { createSession, destroySession, getCurrentUser, makeUser, upsertUserProfile } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const mode = body?.mode || 'email';

  let user;

  if (mode === 'guest') {
    const guestId = `guest-${crypto.randomUUID()}`;
    user = makeUser({
      uid: guestId,
      email: null,
      displayName: body?.displayName || 'Anonymous Player',
      photoURL: null,
      isAnonymous: true,
    });
  } else {
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    user = makeUser({
      uid: `email-${Buffer.from(email).toString('base64url')}`,
      email,
      displayName: body?.displayName || email.split('@')[0],
      photoURL: null,
    });
  }

  await upsertUserProfile(user);
  const token = await createSession(user);

  return NextResponse.json({
    user: {
      ...user,
      token,
    },
  });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
