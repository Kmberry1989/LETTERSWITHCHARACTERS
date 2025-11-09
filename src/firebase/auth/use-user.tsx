'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// This function will be called whenever the auth state changes.
const onUserChange = (firestore: any, user: User | null) => {
  if (!firestore || !user) return;

  const userDocRef = doc(firestore, 'users', user.uid);

  // Check if the user document already exists.
  getDoc(userDocRef).then(docSnap => {
    if (!docSnap.exists()) {
      // If it doesn't exist, create it with initial data.
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || `Player_${user.uid.substring(0, 5)}`,
        photoURL: user.photoURL,
        totalScore: 0,
        avatarId: 'user-1',
        tileSetId: 'tile-plastic',
        boardThemeId: 'board-green',
        themeId: 'default',
        gameIds: [],
      };

      setDoc(userDocRef, profileData, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    }
  }).catch(error => {
    // This could happen if we don't have read access, but we should.
    // We'll log it for now and consider if it needs the full error emitter treatment.
    console.error("Error checking for user document:", error);
  });
};


export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      onUserChange(firestore, user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, loading };
}
