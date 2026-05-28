'use client';

import { useMemo } from 'react';
import { collection } from '@/lib/client/document-client';
import { useCollection } from './use-collection';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  providerId?: string;
  totalScore?: number;
  avatarId?: string;
  avatarPresetId?: string | null;
  avatarModelUrl?: string | null;
  avatarPosterUrl?: string | null;
  avatarConfiguredAt?: string | null;
  onboardingCompletedAt?: string | null;
  tileSetId?: string;
  equippedTileSetId?: string;
  ownedTileSetIds?: string[];
  berries?: number;
  experience?: number;
  level?: number;
  boardThemeId?: string;
  themeId?: string;
  gameIds?: string[];
}

export function useUsers() {
  const usersCollectionRef = useMemo(() => collection(null, 'users'), []);
  const { data, isLoading, error } = useCollection<UserProfile>(usersCollectionRef);

  return {
    users: data || [],
    loading: isLoading,
    error,
  };
}
