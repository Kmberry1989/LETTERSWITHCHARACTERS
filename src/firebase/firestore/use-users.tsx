'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import type { User } from 'firebase/auth';

// We'll define a simpler UserProfile type for our app's purposes
export interface UserProfile extends Partial<User> {
  uid: string;
  totalScore?: number;
  avatarId?: string;
  tileSetId?: string;
  boardThemeId?: string;
  themeId?: string;
}

export function useUsers() {
  const firestore = useFirestore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const usersCollectionRef = collection(firestore, 'users');
    const unsubscribe = onSnapshot(usersCollectionRef, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const userList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserProfile[];
        setUsers(userList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return { users, loading, error };
}
