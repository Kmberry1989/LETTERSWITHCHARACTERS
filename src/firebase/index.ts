'use client';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
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

  if (app) {
    return { app, auth, firestore };
  } 
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);

  if (process.env.NODE_ENV === 'development') {
    // Point to the emulators running on localhost.
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    } catch (e) {
        // This can happen if you refresh the page and the emulators are already connected.
        // It's safe to ignore this error.
        console.warn('Firebase emulators already connected or connection failed.', e);
    }
  }

  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
