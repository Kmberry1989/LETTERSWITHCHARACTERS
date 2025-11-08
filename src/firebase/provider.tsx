'use client';

import { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// The context for the Firebase app.
const FirebaseContext = createContext<{
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null>(null);

/**
 * A hook to get the Firebase app instance.
 * @returns The Firebase app instance.
 */
export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.app;
};

/**
 * A hook to get the Firebase Auth instance.
 * @returns The Firebase Auth instance.
 */
export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

/**
 * A hook to get the Firestore instance.
 * @returns The Firestore instance.
 */
export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};

/**
 * A hook to get the Firebase app, Auth, and Firestore instances.
 * @returns An object containing the Firebase app, Auth, and Firestore instances.
 */
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

/**
 * A provider for the Firebase app.
 * @param children The children to render.
 * @returns A Firebase provider.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const { app, auth, firestore } = initializeFirebase();
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}
