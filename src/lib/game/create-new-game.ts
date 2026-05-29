import { createTileBag, drawTiles } from '@/lib/game-logic';
import type { Tile } from '@/lib/game/types';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import type { UserProfile } from '@/firebase/firestore/use-users';

type PlayerData = {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
  avatarPresetId?: string | null;
  avatarPosterUrl?: string | null;
  equippedTileSetId?: string | null;
  tiles: Tile[];
};

export function createNewGame(
  creatorUid: string,
  accepterUid: string,
  creatorProfile: UserProfile,
  accepterProfile: UserProfile
) {
  const creatorCosmetics = normalizeUserCosmetics(creatorProfile);
  const accepterCosmetics = normalizeUserCosmetics(accepterProfile);
  let tileBag = createTileBag();
  const [creatorTiles, tileBagAfterCreator] = drawTiles(tileBag, 7);
  const [accepterTiles, finalTileBag] = drawTiles(tileBagAfterCreator, 7);
  tileBag = finalTileBag;

  const playerData: Record<string, PlayerData> = {
    [creatorUid]: {
      displayName: creatorProfile.displayName || creatorProfile.email || 'Player One',
      score: 0,
      avatarId: creatorProfile.avatarId || 'user-1',
      photoURL: creatorProfile.photoURL || null,
      avatarPresetId: creatorProfile.avatarPresetId || null,
      avatarPosterUrl: creatorProfile.avatarPosterUrl || null,
      equippedTileSetId: creatorCosmetics.equippedTileSetId,
      tiles: creatorTiles,
    },
    [accepterUid]: {
      displayName: accepterProfile.displayName || accepterProfile.email || 'Player Two',
      score: 0,
      avatarId: accepterProfile.avatarId || 'user-1',
      photoURL: accepterProfile.photoURL || null,
      avatarPresetId: accepterProfile.avatarPresetId || null,
      avatarPosterUrl: accepterProfile.avatarPosterUrl || null,
      equippedTileSetId: accepterCosmetics.equippedTileSetId,
      tiles: accepterTiles,
    },
  };

  return {
    players: [creatorUid, accepterUid],
    playerData,
    board: {},
    tileBag,
    currentTurn: creatorUid,
    status: 'active' as const,
    consecutivePasses: 0,
    messages: [],
  };
}
