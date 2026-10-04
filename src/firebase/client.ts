'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firebaseFirestore = getFirestore(app);

if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true' && typeof window !== 'undefined') {
  const marker = window as typeof window & { __lwcFirebaseEmulators?: boolean };
  if (!marker.__lwcFirebaseEmulators) {
    connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firebaseFirestore, '127.0.0.1', 8080);
    marker.__lwcFirebaseEmulators = true;
  }
}

export { app as firebaseApp };
