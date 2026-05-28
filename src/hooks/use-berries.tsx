'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { STARTER_BERRIES } from '@/lib/tile-cosmetics';

type BerriesContextType = {
  berries: number;
  level: number;
  experience: number;
  equippedTileSetId: string;
  ownedTileSetIds: string[];
  isLoading: boolean;
  refreshKey: string;
};

const BerriesContext = createContext<BerriesContextType | undefined>(undefined);

export function BerriesProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const value = useMemo(() => {
    const normalized = normalizeUserCosmetics(userProfile || undefined);
    return {
      berries: normalized.berries ?? STARTER_BERRIES,
      level: normalized.level ?? 1,
      experience: normalized.experience ?? 0,
      equippedTileSetId: normalized.equippedTileSetId,
      ownedTileSetIds: normalized.ownedTileSetIds,
      isLoading: isUserLoading || isProfileLoading,
      refreshKey: userProfile?.id || user?.uid || 'guest',
    };
  }, [isProfileLoading, isUserLoading, user?.uid, userProfile]);

  return <BerriesContext.Provider value={value}>{children}</BerriesContext.Provider>;
}

export function useBerries() {
  const context = useContext(BerriesContext);
  if (!context) {
    throw new Error('useBerries must be used within a BerriesProvider');
  }
  return context;
}
