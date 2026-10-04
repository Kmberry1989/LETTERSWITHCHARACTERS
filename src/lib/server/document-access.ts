import { z } from 'zod';
import { ApiRequestError } from '@/lib/server/api';
import { avatarCatalog } from '@/lib/avatar-catalog';
import { BOARD_SKINS, BOARD_TINT_PRESETS } from '@/lib/board-skins';
import { INTERFACE_THEMES } from '@/lib/interface-themes';
import type { JsonRecord } from '@/lib/server/document-store';

const text = z.string().trim().min(1).max(100);
const imageUrl = z.string().max(2048).refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}).nullable();
const timestamp = z.string().datetime();
const notificationPreferences = z.object({
  emailTurnNotifications: z.boolean().optional(), webPushTurnNotifications: z.boolean().optional(),
  emailChallengeNotifications: z.boolean().optional(), webPushChallengeNotifications: z.boolean().optional(),
  emailGameNotifications: z.boolean().optional(), webPushGameNotifications: z.boolean().optional(),
  emailChatNotifications: z.boolean().optional(), webPushChatNotifications: z.boolean().optional(),
}).strict();

// Reject unknown and dotted keys rather than silently stripping protected fields.
export const profilePatchSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  photoURL: imageUrl.optional(),
  themeId: text.refine((id) => INTERFACE_THEMES.some((theme) => theme.id === id)).optional(),
  boardThemeId: text.refine((id) => BOARD_SKINS.some((skin) => skin.id === id)).optional(),
  boardTintId: text.refine((id) => BOARD_TINT_PRESETS.some((tint) => tint.id === id)).nullable().optional(),
  boardColor: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
  avatarId: z.null().optional(),
  avatarPresetId: text.refine((id) => avatarCatalog.some((avatar) => avatar.id === id)).optional(),
  avatarModelUrl: imageUrl.optional(), avatarPosterUrl: imageUrl.optional(),
  avatarConfiguredAt: timestamp.optional(), onboardingCompletedAt: timestamp.optional(),
  notificationPreferences: notificationPreferences.optional(),
  updatedAt: timestamp.optional(),
}).strict().refine((patch) => Object.keys(patch).length > 0, 'Provide at least one field.')
  .refine((patch) => !['avatarModelUrl', 'avatarPosterUrl', 'avatarConfiguredAt', 'onboardingCompletedAt'].some((key) => key in patch) || Boolean(patch.avatarPresetId), 'Choose an avatar preset.');

export function editableProfilePatch(input: unknown) {
  const parsed = profilePatchSchema.safeParse(input);
  if (!parsed.success) throw new ApiRequestError('INVALID_PROFILE_PATCH', 'Only editable profile settings may be changed.', 400);
  const patch = parsed.data;
  if (patch.avatarPresetId) {
    const preset = avatarCatalog.find((avatar) => avatar.id === patch.avatarPresetId)!;
    patch.avatarModelUrl = preset.modelUrl;
    patch.avatarPosterUrl = preset.posterUrl;
    patch.avatarConfiguredAt = new Date().toISOString();
    patch.onboardingCompletedAt = patch.avatarConfiguredAt;
  }
  return { ...patch, updatedAt: new Date().toISOString() };
}

export const readableCollections = ['users', 'games', 'directThreads', 'lobbyMessages', 'lobbyChallenges'] as const;
export function assertReadableCollection(collection: string) {
  if (!(readableCollections as readonly string[]).includes(collection)) throw new ApiRequestError('FORBIDDEN', 'Collection access denied.', 403);
}

const publicProfileFields = ['displayName', 'photoURL', 'totalScore', 'stats', 'avatarId', 'avatarPresetId', 'avatarModelUrl', 'avatarPosterUrl', 'tileSetId', 'equippedTileSetId', 'level'] as const;
export function visibleDocument(collection: string, document: JsonRecord, uid: string): JsonRecord | null {
  if (collection === 'games' && (!Array.isArray(document.players) || !document.players.includes(uid))) return null;
  if (collection === 'directThreads' && (!Array.isArray(document.participantIds) || !document.participantIds.includes(uid))) return null;
  if (collection !== 'users') return document;
  if (document.id === uid) return { ...document, uid: document.id };
  const profile: JsonRecord = { id: document.id, uid: document.id };
  for (const field of publicProfileFields) if (Object.hasOwn(document, field)) profile[field] = document[field];
  return profile;
}
