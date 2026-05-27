'use client';

import { useUser as useProviderUser } from '../provider';

export function useUser() {
  const { user, isUserLoading, userError } = useProviderUser();
  return {
    user,
    loading: isUserLoading,
    error: userError,
  };
}
