export type AvatarPreset = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  modelUrl: string;
  posterUrl: string;
  accentClassName: string;
};

export const avatarCatalog: AvatarPreset[] = [
  {
    id: 'aurora-pilot',
    name: 'Aurora Pilot',
    tagline: 'Calm, bright, and precise.',
    description: 'A crystalline navigator built for confident openings and clean endgames.',
    modelUrl: '/avatars/models/aurora-pilot.gltf',
    posterUrl: '/avatars/posters/aurora-pilot.svg',
    accentClassName: 'from-cyan-400/30 via-sky-500/20 to-blue-700/40',
  },
  {
    id: 'ember-scribe',
    name: 'Ember Scribe',
    tagline: 'Warm, theatrical, and bold.',
    description: 'A molten storyteller who turns every board into a dramatic performance.',
    modelUrl: '/avatars/models/ember-scribe.gltf',
    posterUrl: '/avatars/posters/ember-scribe.svg',
    accentClassName: 'from-orange-300/30 via-rose-500/25 to-red-800/40',
  },
  {
    id: 'moss-keeper',
    name: 'Moss Keeper',
    tagline: 'Patient, grounded, and sly.',
    description: 'A forest-minded tactician with a taste for long words and quiet traps.',
    modelUrl: '/avatars/models/moss-keeper.gltf',
    posterUrl: '/avatars/posters/moss-keeper.svg',
    accentClassName: 'from-lime-300/30 via-emerald-500/20 to-green-800/40',
  },
];

export function getAvatarPresetById(avatarPresetId?: string | null) {
  if (!avatarPresetId) return null;
  return avatarCatalog.find((preset) => preset.id === avatarPresetId) ?? null;
}

export function isAvatarMetadataComplete(preset?: AvatarPreset | null) {
  return Boolean(preset?.id && preset?.modelUrl && preset?.posterUrl);
}

export function hasCompletedAvatarOnboarding(
  profile?: {
    avatarPresetId?: string | null;
    avatarModelUrl?: string | null;
    avatarPosterUrl?: string | null;
    onboardingCompletedAt?: string | null;
  } | null
) {
  return Boolean(
    profile?.avatarPresetId &&
      profile?.avatarModelUrl &&
      profile?.avatarPosterUrl &&
      profile?.onboardingCompletedAt
  );
}

export function resolveAvatarImage(profile?: {
  avatarPosterUrl?: string | null;
  photoURL?: string | null;
}) {
  return profile?.photoURL || null;
}
