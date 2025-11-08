'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseAuthProvider } from '@/firebase/auth/auth-provider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
    </FirebaseProvider>
  );
}
