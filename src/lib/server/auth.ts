import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getDocument, setDocument } from '@/lib/server/document-store';
import {
  normalizeOwnedTileSetIds,
  resolveEquippedTileSetId,
  getLevelForExperience,
  STARTER_BERRIES,
  STARTER_TILE_SET_ID,
} from '@/lib/tile-cosmetics';
import { DEFAULT_PLAYER_STATS } from '@/lib/player-stats';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications';
import { DEFAULT_RETENTION_STATE } from '@/lib/retention';
import { getDefaultBoardTintId, resolveBoardColor } from '@/lib/board-skins';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  berries?: number;
  isAnonymous?: boolean;
  providerId?: 'google.com' | 'apple.com' | 'password' | 'guest';
  avatarPresetId?: string | null;
  avatarModelUrl?: string | null;
  avatarPosterUrl?: string | null;
  avatarConfiguredAt?: string | null;
  onboardingCompletedAt?: string | null;
  boardThemeId?: string | null;
  boardTintId?: string | null;
  boardColor?: string | null;
  getIdToken?: () => Promise<string>;
  experience?: number;
  level?: number;
};

const SESSION_COOKIE = 'lwc_session';
const SESSION_DAYS = 30;

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('Authentication storage requires DATABASE_URL to be configured and the dev server restarted.');
  }
}

function sessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export async function createSession(user: AppUser) {
  assertDatabaseConfigured();
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
  assertDatabaseConfigured();
  const cookieStore = await cookies();
  const activeToken = token || cookieStore.get(SESSION_COOKIE)?.value;

  if (activeToken) {
    await prisma.appSession.deleteMany({ where: { token: activeToken } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getUserByToken(token?: string | null): Promise<AppUser | null> {
  assertDatabaseConfigured();
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
    providerId: profile.providerId || (profile.isAnonymous ? 'guest' : 'password'),
    avatarPresetId: profile.avatarPresetId || null,
    avatarModelUrl: profile.avatarModelUrl || null,
    avatarPosterUrl: profile.avatarPosterUrl || null,
    avatarConfiguredAt: profile.avatarConfiguredAt || null,
    onboardingCompletedAt: profile.onboardingCompletedAt || null,
    boardThemeId: profile.boardThemeId || 'board-green',
    boardTintId: profile.boardTintId || getDefaultBoardTintId(profile.boardThemeId || 'board-green'),
    boardColor: resolveBoardColor(profile.boardThemeId || 'board-green', profile.boardColor || null, profile.boardTintId || null),
    berries: typeof profile.berries === 'number' ? profile.berries : STARTER_BERRIES,
    experience: typeof profile.experience === 'number' ? profile.experience : 0,
    level: getLevelForExperience(typeof profile.experience === 'number' ? profile.experience : 0),
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserByToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function verifyBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return getUserByToken(authHeader.slice('Bearer '.length));
}

export async function upsertUserProfile(user: AppUser) {
  assertDatabaseConfigured();
  const existing = await getDocument<any>('users', user.uid);
  const equippedTileSetId = resolveEquippedTileSetId(existing?.tileSetId, existing?.equippedTileSetId);
  const ownedTileSetIds = normalizeOwnedTileSetIds(existing?.ownedTileSetIds || [existing?.tileSetId || STARTER_TILE_SET_ID]);
  return setDocument(
    'users',
    user.uid,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email || 'Player',
      photoURL: user.photoURL,
      isAnonymous: Boolean(user.isAnonymous),
      providerId: user.providerId || (user.isAnonymous ? 'guest' : 'password'),
      totalScore: existing?.totalScore ?? 0,
      stats: existing?.stats ?? DEFAULT_PLAYER_STATS,
      avatarId: existing?.avatarId ?? null,
      avatarPresetId: existing?.avatarPresetId ?? null,
      avatarModelUrl: existing?.avatarModelUrl ?? null,
      avatarPosterUrl: existing?.avatarPosterUrl ?? null,
      avatarConfiguredAt: existing?.avatarConfiguredAt ?? null,
      onboardingCompletedAt: existing?.onboardingCompletedAt ?? null,
      tileSetId: equippedTileSetId,
      equippedTileSetId,
      ownedTileSetIds,
      berries: typeof existing?.berries === 'number' ? existing.berries : STARTER_BERRIES,
      experience: typeof existing?.experience === 'number' ? existing.experience : 0,
      level: getLevelForExperience(typeof existing?.experience === 'number' ? existing.experience : 0),
      boardThemeId: existing?.boardThemeId ?? 'board-green',
      boardTintId: existing?.boardTintId ?? getDefaultBoardTintId(existing?.boardThemeId ?? 'board-green'),
      boardColor: resolveBoardColor(existing?.boardThemeId ?? 'board-green', existing?.boardColor ?? null, existing?.boardTintId ?? null),
      themeId: existing?.themeId ?? 'default',
      gameIds: existing?.gameIds ?? [],
      notificationPreferences: existing?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
      pushSubscriptions: existing?.pushSubscriptions ?? [],
      retention: existing?.retention ?? DEFAULT_RETENTION_STATE,
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
    providerId: overrides.providerId ?? (overrides.isAnonymous ? 'guest' : 'password'),
    avatarPresetId: overrides.avatarPresetId ?? null,
    avatarModelUrl: overrides.avatarModelUrl ?? null,
    avatarPosterUrl: overrides.avatarPosterUrl ?? null,
    avatarConfiguredAt: overrides.avatarConfiguredAt ?? null,
    onboardingCompletedAt: overrides.onboardingCompletedAt ?? null,
  };
}
