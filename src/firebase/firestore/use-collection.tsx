'use client';

import { useState, useEffect } from 'react';
import type { LocalCollectionTarget } from '@/lib/client/document-client';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T = any>(memoizedTargetRefOrQuery: (LocalCollectionTarget & { __memo?: boolean }) | null | undefined): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let pollingDisabled = false;

    const load = async (showLoading = false) => {
      if (pollingDisabled && !showLoading) return;
      if (!memoizedTargetRefOrQuery) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if ('orderBy' in memoizedTargetRefOrQuery && memoizedTargetRefOrQuery.orderBy) params.set('orderBy', memoizedTargetRefOrQuery.orderBy);
      if ('direction' in memoizedTargetRefOrQuery && memoizedTargetRefOrQuery.direction) params.set('direction', memoizedTargetRefOrQuery.direction);
      if ('limit' in memoizedTargetRefOrQuery && memoizedTargetRefOrQuery.limit) params.set('limit', String(memoizedTargetRefOrQuery.limit));

      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(memoizedTargetRefOrQuery.collection)}?${params.toString()}`, {
          cache: 'no-store',
        });
        const result = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok) {
          if (response.status >= 500) {
            pollingDisabled = true;
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
          throw new Error(result?.error || 'Could not load collection.');
        }

        setData(result.documents as StateDataType);
        setError(null);
      } catch (err: any) {
        if (!cancelled) {
          setError(err);
          setData(null);
          pollingDisabled = true;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load(true);
    interval = setInterval(() => void load(false), 5000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
