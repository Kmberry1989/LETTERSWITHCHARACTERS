'use client';

import { useState, useEffect } from 'react';
import type { LocalDocRef } from '@/lib/client/document-client';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDoc<T = any>(memoizedDocRef: LocalDocRef | null | undefined): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async (showLoading = false) => {
      if (!memoizedDocRef) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(memoizedDocRef.collection)}/${encodeURIComponent(memoizedDocRef.id)}`, {
          cache: 'no-store',
        });
        const result = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok) {
          setData(null);
        } else {
          setData(result.document as StateDataType);
        }
        setError(null);
      } catch (err: any) {
        if (!cancelled) {
          setError(err);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load(true);
    interval = setInterval(() => void load(false), 2500);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
