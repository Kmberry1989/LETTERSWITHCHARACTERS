'use client';

import { firebaseApp, firebaseAuth, firebaseFirestore } from './client';

export function initializeFirebase() {
  return {
    firebaseApp,
    auth: firebaseAuth,
    firestore: firebaseFirestore,
  };
}

export function getSdks() {
  return initializeFirebase();
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-users';
export * from './non-blocking-updates';

export * from './errors';
export * from './error-emitter';
