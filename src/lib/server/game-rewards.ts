import { getDocument, updateDocument } from '@/lib/server/document-store';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { WIN_BONUS_BERRIES } from '@/lib/tile-cosmetics';

export async function awardBerries(userId: string, amount: number) {
  if (!userId || amount <= 0) return null;

  const profile = normalizeUserCosmetics(await getDocument<any>('users', userId));
  const berries = (profile.berries || 0) + amount;

  return updateDocument('users', userId, {
    berries,
    updatedAt: new Date().toISOString(),
  });
}

export async function awardWinnerBonusIfNeeded(winner: string | undefined, alreadyFinished?: boolean) {
  if (!winner || winner === 'draw' || alreadyFinished) {
    return 0;
  }

  await awardBerries(winner, WIN_BONUS_BERRIES);
  return WIN_BONUS_BERRIES;
}
