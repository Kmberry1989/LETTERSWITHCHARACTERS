'use client';

import { useEffect, useState } from 'react';
import type { DirectThread } from '@/lib/direct-threads';

type UseDirectThreadsResult = {
  data: DirectThread[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useDirectThreads(enabled = true): UseDirectThreadsResult {
  const [data, setData] = useState<DirectThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let pollingDisabled = false;

    const load = async (showLoading = false) => {
      if (pollingDisabled && !showLoading) return;
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const response = await fetch('/api/direct-threads', { cache: 'no-store' });
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
          throw new Error(result?.error || 'Could not load direct threads.');
        }

        setData(Array.isArray(result?.threads) ? result.threads : []);
        setError(null);
      } catch (nextError: any) {
        if (!cancelled) {
          setError(nextError);
          pollingDisabled = true;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load(true);
    interval = setInterval(() => void load(false), 5000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [enabled]);

  return {
    data,
    isLoading,
    error,
    refresh: async () => {
      const response = await fetch('/api/direct-threads', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not load direct threads.');
      }
      setData(Array.isArray(result?.threads) ? result.threads : []);
      setError(null);
    },
  };
}
