'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import type { Provider as SupabaseProvider } from '@supabase/supabase-js';
import { resolveBoardColor } from '@/lib/board-skins';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/supabase/config';
import { normalizeUsername } from '@/lib/auth-identity';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  token?: string;
  getIdToken: () => Promise<string>;
};

type SignInPayload = {
  mode?: 'email' | 'guest' | 'google' | 'apple';
  action?: 'signin' | 'signup';
  email?: string;
  username?: string;
  password?: string;
  displayName?: string;
};

type LocalAuth = {
  currentUser: AppUser | null;
  signIn: (payload: SignInPayload) => Promise<AppUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

interface UserAuthState {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: null;
  firestore: null;
  auth: LocalAuth;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: null;
  firestore: null;
  auth: LocalAuth;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

function withTokenGetter(user: any): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? user.email ?? 'Player',
    photoURL: user.photoURL ?? null,
    isAnonymous: Boolean(user.isAnonymous),
    providerId: user.providerId,
    avatarPresetId: user.avatarPresetId ?? null,
    avatarModelUrl: user.avatarModelUrl ?? null,
    avatarPosterUrl: user.avatarPosterUrl ?? null,
    avatarConfiguredAt: user.avatarConfiguredAt ?? null,
    onboardingCompletedAt: user.onboardingCompletedAt ?? null,
    boardThemeId: user.boardThemeId ?? 'board-green',
    boardTintId: user.boardTintId ?? null,
    boardColor: resolveBoardColor(user.boardThemeId ?? 'board-green', user.boardColor ?? null, user.boardTintId ?? null),
    token: user.token,
    getIdToken: async () => {
      if (user.token) return user.token;

      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      return data?.user?.token || '';
    },
  };
}

async function loadCurrentUser() {
  const response = await fetch('/api/auth/session', { cache: 'no-store' });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Could not load the current session.');
  }

  return withTokenGetter(data?.user);
}

async function signInWithLocalSession(payload: SignInPayload) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Could not sign in.');
  }

  return withTokenGetter(data?.user);
}

function getOAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/auth/callback?next=/`;
}

function getProviderLabel(mode: 'google' | 'apple') {
  return mode === 'apple' ? 'Apple' : 'Google';
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const authAvailable = hasSupabaseEnv();
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: authAvailable,
    userError: authAvailable ? null : new Error('Authentication is unavailable because Supabase env vars are not configured.'),
  });
  const supabase = useMemo(() => (authAvailable ? createSupabaseClient() : null), [authAvailable]);

  const refresh = async () => {
    if (!authAvailable) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Authentication is unavailable because Supabase env vars are not configured.'),
      });
      return;
    }

    try {
      const user = await loadCurrentUser();
      setUserAuthState({ user, isUserLoading: false, userError: null });
    } catch (error: any) {
      setUserAuthState({ user: null, isUserLoading: false, userError: error });
    }
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const auth = useMemo<LocalAuth>(
    () => ({
      currentUser: userAuthState.user,
      signIn: async (payload: SignInPayload) => {
        if (payload?.mode === 'google' || payload?.mode === 'apple') {
          if (!supabase) {
            throw new Error('Authentication is unavailable because Supabase env vars are not configured.');
          }

          const provider = payload.mode as SupabaseProvider;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: getOAuthRedirectUrl(),
            },
          });

          if (error) {
            throw new Error(error.message || `${getProviderLabel(payload.mode)} sign-in failed.`);
          }

          throw new Error(`Redirecting to ${getProviderLabel(payload.mode)} sign-in...`);
        }

        if (payload?.mode === 'guest') {
          const user = await signInWithLocalSession({
            mode: 'guest',
            displayName: payload.displayName?.trim() || 'Guest Player',
          });
          setUserAuthState({ user, isUserLoading: false, userError: null });
          return user!;
        }

        const username = normalizeUsername(payload?.username || '');
        const password = String(payload?.password || '');

        if (!username || !password) {
          throw new Error('Username and password are required.');
        }

        const user = await signInWithLocalSession({
          mode: 'email',
          action: payload?.action === 'signup' ? 'signup' : 'signin',
          username,
          password,
          displayName: payload.displayName?.trim() || username,
        });
        setUserAuthState({ user, isUserLoading: false, userError: null });
        return user!;
      },
      signOut: async () => {
        if (supabase) {
          const { error } = await supabase.auth.signOut();
          if (error && error.message !== 'Auth session missing!') {
            throw new Error(error.message || 'Could not sign out.');
          }
        }

        const response = await fetch('/api/auth/session', {
          method: 'DELETE',
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Could not sign out.');
        }

        setUserAuthState({ user: null, isUserLoading: false, userError: null });
      },
      refresh,
    }),
    [supabase, userAuthState.user]
  );

  const contextValue = useMemo(
    (): FirebaseContextState => ({
      areServicesAvailable: authAvailable,
      firebaseApp: null,
      firestore: null,
      auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    }),
    [auth, authAvailable, userAuthState]
  );

  return <FirebaseContext.Provider value={contextValue}>{children}</FirebaseContext.Provider>;
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within FirebaseProvider.');
  }

  return {
    firebaseApp: null,
    firestore: null,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): LocalAuth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): null => null;

export const useFirebaseApp = (): null => null;

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
