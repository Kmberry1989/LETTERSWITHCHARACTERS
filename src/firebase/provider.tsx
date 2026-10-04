'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { resolveBoardColor } from '@/lib/board-skins';
import { normalizeUsername, usernameToAuthEmail } from '@/lib/auth-identity';
import { firebaseApp, firebaseAuth, firebaseFirestore } from '@/firebase/client';
import { isFirebaseConfigured } from '@/firebase/config';

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

type AppAuth = {
  currentUser: AppUser | null;
  signIn: (payload: SignInPayload) => Promise<AppUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

type UserAuthState = { user: AppUser | null; isUserLoading: boolean; userError: Error | null };
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: AppAuth;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}
export type FirebaseServicesAndUser = Omit<FirebaseContextState, 'areServicesAvailable'>;
export type UserHookResult = Pick<UserAuthState, 'user' | 'isUserLoading' | 'userError'>;
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
    getIdToken: async () => {
      const current = firebaseAuth.currentUser;
      if (!current || current.uid !== user.uid) return '';
      return current.getIdToken();
    },
  };
}

async function loadCurrentUser() {
  const response = await fetch('/api/auth/session', { cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Could not load the current session.');
  return withTokenGetter(data?.user);
}

async function exchangeSession(idToken: string) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Could not establish the Firebase session.');
  return withTokenGetter(data.user);
}

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const available = isFirebaseConfigured();
  const [state, setState] = useState<UserAuthState>({ user: null, isUserLoading: available, userError: null });

  const refresh = async () => {
    try {
      const user = await loadCurrentUser();
      setState({ user, isUserLoading: false, userError: null });
    } catch (error) {
      setState({ user: null, isUserLoading: false, userError: error as Error });
    }
  };

  useEffect(() => onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    if (!firebaseUser) {
      setState({ user: null, isUserLoading: false, userError: null });
      return;
    }
    try {
      const user = await exchangeSession(await firebaseUser.getIdToken());
      setState({ user, isUserLoading: false, userError: null });
    } catch (error) {
      setState({ user: null, isUserLoading: false, userError: error as Error });
    }
  }), []);

  const auth = useMemo<AppAuth>(() => ({
    currentUser: state.user,
    signIn: async (payload) => {
      let credential;
      if (payload.mode === 'guest') {
        credential = await signInAnonymously(firebaseAuth);
        if (payload.displayName?.trim()) await updateProfile(credential.user, { displayName: payload.displayName.trim() });
      } else if (payload.mode === 'google') {
        credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      } else if (payload.mode === 'apple') {
        credential = await signInWithPopup(firebaseAuth, new OAuthProvider('apple.com'));
      } else {
        const username = normalizeUsername(payload.username || '');
        const password = String(payload.password || '');
        if (!username || !password) throw new Error('Username and password are required.');
        const email = usernameToAuthEmail(username);
        credential = payload.action === 'signup'
          ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
          : await signInWithEmailAndPassword(firebaseAuth, email, password);
        if (payload.action === 'signup') await updateProfile(credential.user, { displayName: payload.displayName?.trim() || username });
      }
      const user = await exchangeSession(await credential.user.getIdToken(true));
      setState({ user, isUserLoading: false, userError: null });
      return user!;
    },
    signOut: async () => {
      await firebaseSignOut(firebaseAuth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setState({ user: null, isUserLoading: false, userError: null });
    },
    refresh,
  }), [state.user]);

  const value = useMemo<FirebaseContextState>(() => ({
    areServicesAvailable: available,
    firebaseApp,
    firestore: firebaseFirestore,
    auth,
    user: state.user,
    isUserLoading: state.isUserLoading,
    userError: state.userError,
  }), [auth, available, state]);

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export function useFirebase(): FirebaseServicesAndUser {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider.');
  const { firebaseApp, firestore, auth, user, isUserLoading, userError } = context;
  return { firebaseApp, firestore, auth, user, isUserLoading, userError };
}
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
type MemoFirebase<T> = T & { __memo?: boolean };
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);
  if (typeof memoized === 'object' && memoized !== null) (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
