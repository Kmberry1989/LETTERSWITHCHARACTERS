import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
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
import { createBackendClient } from '@/lib/supabase/config';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { isGeneratedAuthEmail, mapSupabaseProviderToAppProvider } from '@/lib/auth-identity';

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

function getProfileDisplayName(authUser: SupabaseAuthUser, profile: Record<string, any> | null) {
  if (typeof profile?.displayName === 'string' && profile.displayName.trim()) {
    return profile.displayName;
  }

  const metadata = authUser.user_metadata || {};
  const preferred =
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    metadata.username ||
    (typeof authUser.email === 'string' ? authUser.email.split('@')[0] : null);

  return typeof preferred === 'string' && preferred.trim() ? preferred : 'Player';
}

function toPublicEmail(authUser: SupabaseAuthUser) {
  if (!authUser.email || isGeneratedAuthEmail(authUser.email)) {
    return null;
  }

  return authUser.email;
}

function isAnonymousUser(authUser: SupabaseAuthUser) {
  return authUser.is_anonymous || authUser.app_metadata?.provider === 'anonymous';
}

function isMissingAuthSessionError(error: { name?: string; status?: number; message?: string } | null | undefined) {
  return (
    error?.name === 'AuthSessionMissingError' ||
    error?.status === 400 ||
    error?.message === 'Auth session missing!'
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

export async function upsertUserProfile(user: AppUser) {
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

async function hydrateUserFromAuthUser(authUser: SupabaseAuthUser, accessToken?: string | null): Promise<AppUser> {
  const existingProfile = await getDocument<any>('users', authUser.id);
  const providerId = mapSupabaseProviderToAppProvider(authUser.app_metadata?.provider);
  const email = toPublicEmail(authUser);
  const baseUser = makeUser({
    uid: authUser.id,
    email,
    displayName: getProfileDisplayName(authUser, existingProfile),
    photoURL: typeof authUser.user_metadata?.avatar_url === 'string' ? authUser.user_metadata.avatar_url : null,
    isAnonymous: isAnonymousUser(authUser),
    providerId,
    avatarPresetId: existingProfile?.avatarPresetId ?? null,
    avatarModelUrl: existingProfile?.avatarModelUrl ?? null,
    avatarPosterUrl: existingProfile?.avatarPosterUrl ?? null,
    avatarConfiguredAt: existingProfile?.avatarConfiguredAt ?? null,
    onboardingCompletedAt: existingProfile?.onboardingCompletedAt ?? null,
  });

  const profile = await upsertUserProfile(baseUser);

  return {
    uid: profile.uid || authUser.id,
    email: profile.email ?? email,
    displayName: profile.displayName || baseUser.displayName || 'Player',
    photoURL: profile.photoURL || baseUser.photoURL || null,
    isAnonymous: Boolean(profile.isAnonymous ?? baseUser.isAnonymous),
    providerId: profile.providerId || baseUser.providerId,
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
    getIdToken: accessToken ? async () => accessToken : undefined,
  };
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isMissingAuthSessionError(error)) {
      return null;
    }
    throw error;
  }

  if (!data.user) {
    return null;
  }

  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token || null;
  return hydrateUserFromAuthUser(data.user, accessToken);
}

export async function getCurrentSessionToken() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token || null;
}

export async function verifyBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length);
  const supabase = createBackendClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return hydrateUserFromAuthUser(data.user, token);
}

export async function destroySession() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
