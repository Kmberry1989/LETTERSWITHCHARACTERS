'use client';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// The singleton instances for the app.
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes and returns a Firebase client-side instance.
 *
 * @returns An object containing the Firebase app, Auth, and Firestore instances.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (typeof window === 'undefined') {
    // During server-side rendering, return uninitialized instances or mocks.
    // This is a simplified approach. A more robust solution might involve
    // a separate server-side initialization.
    if (!app) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        firestore = getFirestore(app);
    }
    return { app, auth, firestore };
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
  } else {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }

  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
