import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getDocument, setDocument } from '@/lib/server/document-store';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  getIdToken?: () => Promise<string>;
};

const SESSION_COOKIE = 'lwc_session';
const SESSION_DAYS = 30;

function sessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export async function createSession(user: AppUser) {
  const token = crypto.randomUUID();
  const expiresAt = sessionExpiry();

  await prisma.appSession.create({
    data: {
      token,
      userId: user.uid,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(token?: string | null) {
  const cookieStore = await cookies();
  const activeToken = token || cookieStore.get(SESSION_COOKIE)?.value;

  if (activeToken) {
    await prisma.appSession.deleteMany({ where: { token: activeToken } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getUserByToken(token?: string | null): Promise<AppUser | null> {
  if (!token) return null;

  const session = await prisma.appSession.findUnique({ where: { token } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.appSession.delete({ where: { token } }).catch(() => null);
    return null;
  }

  const profile = await getDocument<any>('users', session.userId);
  if (!profile) return null;

  return {
    uid: profile.uid || session.userId,
    email: profile.email || null,
    displayName: profile.displayName || profile.email || 'Player',
    photoURL: profile.photoURL || null,
    isAnonymous: profile.isAnonymous || false,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserByToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function verifyBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return getUserByToken(authHeader.slice('Bearer '.length));
}

export async function upsertUserProfile(user: AppUser) {
  return setDocument(
    'users',
    user.uid,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email || 'Player',
      photoURL: user.photoURL,
      isAnonymous: Boolean(user.isAnonymous),
      totalScore: 0,
      avatarId: 'user-1',
      gameIds: [],
      updatedAt: new Date().toISOString(),
    },
    true
  );
}

export function makeUser(overrides: Partial<AppUser> & Pick<AppUser, 'uid'>): AppUser {
  return {
    uid: overrides.uid,
    email: overrides.email ?? null,
    displayName: overrides.displayName ?? overrides.email ?? 'Player',
    photoURL: overrides.photoURL ?? null,
    isAnonymous: overrides.isAnonymous ?? false,
  };
}
