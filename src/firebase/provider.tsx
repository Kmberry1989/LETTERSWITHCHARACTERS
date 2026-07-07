'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import type { Provider as SupabaseProvider } from '@supabase/supabase-js';
import { resolveBoardColor } from '@/lib/board-skins';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { normalizeUsername, usernameToAuthEmail } from '@/lib/auth-identity';

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
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });
  const supabase = useMemo(() => createSupabaseClient(), []);

  const refresh = async () => {
    try {
      const user = await loadCurrentUser();
      setUserAuthState({ user, isUserLoading: false, userError: null });
    } catch (error: any) {
      setUserAuthState({ user: null, isUserLoading: false, userError: error });
    }
  };

  useEffect(() => {
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
          const { error } = await supabase.auth.signInAnonymously({
            options: {
              data: {
                display_name: payload.displayName?.trim() || 'Guest Player',
              },
            },
          });

          if (error) {
            throw new Error(error.message || 'Guest sign-in failed.');
          }

          const user = await loadCurrentUser();
          setUserAuthState({ user, isUserLoading: false, userError: null });
          return user!;
        }

        const username = normalizeUsername(payload?.username || '');
        const password = String(payload?.password || '');

        if (!username || !password) {
          throw new Error('Username and password are required.');
        }

        if (payload?.action === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: usernameToAuthEmail(username),
            password,
            options: {
              data: {
                username,
                display_name: payload.displayName?.trim() || username,
              },
            },
          });

          if (error) {
            throw new Error(error.message || 'Could not create the account.');
          }

          if (!data.session) {
            throw new Error('Account created, but email confirmation is still required in Supabase Auth.');
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: usernameToAuthEmail(username),
            password,
          });

          if (error) {
            throw new Error(error.message || 'Could not sign in.');
          }
        }

        const user = await loadCurrentUser();
        setUserAuthState({ user, isUserLoading: false, userError: null });
        return user!;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw new Error(error.message || 'Could not sign out.');
        }

        setUserAuthState({ user: null, isUserLoading: false, userError: null });
      },
      refresh,
    }),
    [supabase, userAuthState.user]
  );

  const contextValue = useMemo(
    (): FirebaseContextState => ({
      areServicesAvailable: true,
      firebaseApp: null,
      firestore: null,
      auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    }),
    [auth, userAuthState]
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
