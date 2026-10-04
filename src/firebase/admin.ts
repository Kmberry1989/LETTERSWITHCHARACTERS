import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function credentialFromEnvironment() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (encoded) {
    const value = encoded.startsWith('{') ? encoded : Buffer.from(encoded, 'base64').toString('utf8');
    return cert(JSON.parse(value));
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) return undefined;
  return applicationDefault();
}

export function getAdminApp() {
  if (getApps().length) return getApps()[0]!;
  const credential = credentialFromEnvironment();
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-1704097120-f2816',
    ...(credential ? { credential } : {}),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
