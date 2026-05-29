'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { firebaseConfig } from '@/firebase/config';

const FIREBASE_CLIENT_APP_NAME = 'letters-with-characters-client';

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
    token: user.token,
    getIdToken: async () => {
      if (user.token) return user.token;
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      return data?.user?.token || '';
    },
  };
}

async function signInWithSocialProvider(mode: 'google' | 'apple') {
  const [{ initializeApp, getApp }, { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.authDomain) {
    throw new Error('Firebase web configuration is incomplete.');
  }

  let app;
  try {
    app = getApp(FIREBASE_CLIENT_APP_NAME);
  } catch {
    app = initializeApp(firebaseConfig, FIREBASE_CLIENT_APP_NAME);
  }

  const provider = mode === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com');

  if (mode === 'google') {
    provider.setCustomParameters({ prompt: 'select_account' });
  } else {
    provider.addScope('email');
    provider.addScope('name');
  }

  try {
    const credential = await signInWithPopup(getAuth(app), provider);

    return {
      mode,
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
    };
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/web-storage-unsupported') {
      await signInWithRedirect(getAuth(app), provider);
      throw new Error(`Redirecting to ${mode === 'apple' ? 'Apple' : 'Google'} sign-in...`);
    }

    throw error;
  }
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const refresh = async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      setUserAuthState({ user: withTokenGetter(data?.user), isUserLoading: false, userError: null });
    } catch (error: any) {
      setUserAuthState({ user: null, isUserLoading: false, userError: error });
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const completeRedirectSignIn = async () => {
      try {
        const [{ initializeApp, getApp }, { getAuth, getRedirectResult }] = await Promise.all([
          import('firebase/app'),
          import('firebase/auth'),
        ]);

        if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.authDomain) {
          return;
        }

        let app;
        try {
          app = getApp(FIREBASE_CLIENT_APP_NAME);
        } catch {
          app = initializeApp(firebaseConfig, FIREBASE_CLIENT_APP_NAME);
        }

        const credential = await getRedirectResult(getAuth(app));
        if (!credential || !isMounted) return;

        const providerId = credential.providerId === 'apple.com' ? 'apple' : 'google';
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: providerId,
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName,
            photoURL: credential.user.photoURL,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Could not complete sign in.');
        }

        setUserAuthState({ user: withTokenGetter(data.user), isUserLoading: false, userError: null });
      } catch (error: any) {
        if (!isMounted) return;
        if (error?.code === 'auth/no-auth-event') return;
        setUserAuthState((state) => ({ ...state, userError: error, isUserLoading: false }));
      }
    };

    void completeRedirectSignIn();

    return () => {
      isMounted = false;
    };
  }, []);

  const auth = useMemo<LocalAuth>(() => ({
    currentUser: userAuthState.user,
    signIn: async (payload: SignInPayload) => {
      let sessionPayload: Record<string, unknown> = payload ? { ...payload } : {};

      if (payload?.mode === 'google' || payload?.mode === 'apple') {
        try {
          sessionPayload = await signInWithSocialProvider(payload.mode);
        } catch (error: any) {
          const providerLabel = payload.mode === 'apple' ? 'Apple' : 'Google';
          if (error?.code === 'auth/popup-closed-by-user') {
            throw new Error(`${providerLabel} sign-in was canceled.`);
          }
          if (error?.code === 'auth/popup-blocked') {
            throw new Error(`${providerLabel} sign-in popup was blocked by the browser.`);
          }
          if (error?.message?.startsWith('Redirecting to')) {
            throw error;
          }
          throw new Error(error?.message || `${providerLabel} sign-in failed.`);
        }
      }

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Could not sign in.');
      }

      const user = withTokenGetter(data.user);
      setUserAuthState({ user, isUserLoading: false, userError: null });
      return user!;
    },
    signOut: async () => {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
    },
    refresh,
  }), [userAuthState.user]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: true,
    firebaseApp: null,
    firestore: null,
    auth,
    user: userAuthState.user,
    isUserLoading: userAuthState.isUserLoading,
    userError: userAuthState.userError,
  }), [auth, userAuthState]);

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
