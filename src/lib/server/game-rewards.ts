import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { getLevelForExperience, WIN_BONUS_BERRIES, WIN_BONUS_EXPERIENCE } from '@/lib/tile-cosmetics';

export async function awardPlayerProgress(userId: string, rewards: { berries?: number; experience?: number }) {
  if (!userId) return null;

  const profile = normalizeUserCosmetics(await getDocument<any>('users', userId));
  const berries = (profile.berries || 0) + (rewards.berries || 0);
  const experience = (profile.experience || 0) + (rewards.experience || 0);
  const level = getLevelForExperience(experience);

  return updateDocument('users', userId, {
    berries,
    experience,
    level,
    updatedAt: new Date().toISOString(),
  });
}

export async function awardWinnerBonusIfNeeded(winner: string | undefined, alreadyFinished?: boolean) {
  if (!winner || winner === 'draw' || alreadyFinished) {
    return 0;
  }

  await awardPlayerProgress(winner, {
    berries: WIN_BONUS_BERRIES,
    experience: WIN_BONUS_EXPERIENCE,
  });
  return WIN_BONUS_BERRIES;
}
