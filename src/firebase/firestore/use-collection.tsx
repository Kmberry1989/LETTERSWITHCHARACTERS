'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(firestore, path);
    const unsubscribe = onSnapshot(collectionRef, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}
