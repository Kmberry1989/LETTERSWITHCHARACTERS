import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/firebase/admin';
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
import { getDocument, setDocument } from '@/lib/server/document-store';
import { isGeneratedAuthEmail } from '@/lib/auth-identity';

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
const SESSION_DAYS = 14;
export const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function providerId(token: DecodedIdToken): AppUser['providerId'] {
  if (token.firebase.sign_in_provider === 'anonymous') return 'guest';
  if (token.firebase.sign_in_provider === 'google.com') return 'google.com';
  if (token.firebase.sign_in_provider === 'apple.com') return 'apple.com';
  return 'password';
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

export async function upsertUserProfile(user: AppUser) {
  const existing = await getDocument<any>('users', user.uid);
  const equippedTileSetId = resolveEquippedTileSetId(existing?.tileSetId, existing?.equippedTileSetId);
  const ownedTileSetIds = normalizeOwnedTileSetIds(existing?.ownedTileSetIds || [existing?.tileSetId || STARTER_TILE_SET_ID]);
  return setDocument('users', user.uid, {
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
  }, true);
}

async function hydrateUser(token: DecodedIdToken, rawToken?: string): Promise<AppUser> {
  const existing = await getDocument<any>('users', token.uid);
  const email = token.email && !isGeneratedAuthEmail(token.email) ? token.email : null;
  const base = makeUser({
    uid: token.uid,
    email,
    displayName: existing?.displayName || token.name || (email ? email.split('@')[0] : 'Player'),
    photoURL: existing?.photoURL || token.picture || null,
    isAnonymous: token.firebase.sign_in_provider === 'anonymous',
    providerId: providerId(token),
    avatarPresetId: existing?.avatarPresetId,
    avatarModelUrl: existing?.avatarModelUrl,
    avatarPosterUrl: existing?.avatarPosterUrl,
    avatarConfiguredAt: existing?.avatarConfiguredAt,
    onboardingCompletedAt: existing?.onboardingCompletedAt,
  });
  const profile = await upsertUserProfile(base);
  return {
    ...base,
    displayName: profile.displayName || base.displayName,
    photoURL: profile.photoURL || base.photoURL,
    boardThemeId: profile.boardThemeId || 'board-green',
    boardTintId: profile.boardTintId || getDefaultBoardTintId(profile.boardThemeId || 'board-green'),
    boardColor: resolveBoardColor(profile.boardThemeId || 'board-green', profile.boardColor || null, profile.boardTintId || null),
    berries: typeof profile.berries === 'number' ? profile.berries : STARTER_BERRIES,
    experience: typeof profile.experience === 'number' ? profile.experience : 0,
    level: getLevelForExperience(typeof profile.experience === 'number' ? profile.experience : 0),
    getIdToken: rawToken ? async () => rawToken : undefined,
  };
}

export async function createSession(idToken: string) {
  const expiresIn = SESSION_MAX_AGE_MS;
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(expiresIn / 1000),
    priority: 'high',
  });
  return sessionCookie;
}

export async function getCurrentSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value || null;
}

export async function getCurrentUser() {
  const token = await getCurrentSessionToken();
  if (!token) return null;
  try {
    return await hydrateUser(await getAdminAuth().verifySessionCookie(token, true));
  } catch {
    return null;
  }
}

export async function verifyBearerToken(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    return await hydrateUser(await getAdminAuth().verifyIdToken(token), token);
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  if (userId) await getAdminAuth().revokeRefreshTokens(userId);
  await destroySession();
}
