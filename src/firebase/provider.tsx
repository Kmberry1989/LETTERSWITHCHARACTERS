'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { firebaseConfig } from '@/firebase/config';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  providerId?: 'google.com' | 'password' | 'guest';
  token?: string;
  getIdToken: () => Promise<string>;
};

type SignInPayload = {
  mode?: 'email' | 'guest' | 'google';
  email?: string;
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
    token: user.token,
    getIdToken: async () => {
      if (user.token) return user.token;
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      return data?.user?.token || '';
    },
  };
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

  const auth = useMemo<LocalAuth>(() => ({
    currentUser: userAuthState.user,
    signIn: async (payload: SignInPayload) => {
      let sessionPayload: Record<string, unknown> = payload ? { ...payload } : {};

      if (payload?.mode === 'google') {
        try {
          const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
            import('firebase/app'),
            import('firebase/auth'),
          ]);

          const app = getApps()[0] ?? initializeApp(firebaseConfig);
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const credential = await signInWithPopup(getAuth(app), provider);

          sessionPayload = {
            mode: 'google',
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName,
            photoURL: credential.user.photoURL,
          };
        } catch (error: any) {
          if (error?.code === 'auth/popup-closed-by-user') {
            throw new Error('Google sign-in was canceled.');
          }
          if (error?.code === 'auth/popup-blocked') {
            throw new Error('Google sign-in popup was blocked by the browser.');
          }
          throw new Error(error?.message || 'Google sign-in failed.');
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
