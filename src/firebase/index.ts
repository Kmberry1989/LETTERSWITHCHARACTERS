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
  if (app) {
    return { app, auth, firestore };
  } else {
    // If no Firebase app has been initialized, create one.
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    return { app, auth, firestore };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
