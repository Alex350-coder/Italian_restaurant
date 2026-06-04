import { useState, useEffect, useCallback } from 'react';
import { useCacheContext } from '@/context/CacheContext';

interface UseCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  initialData?: T;
}

interface UseCacheReturn<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isValid: boolean;
}

export function useCache<T>({
  key,
  fetcher,
  ttl = 5 * 60 * 1000,
  enabled = true,
  initialData,
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const { get, set, invalidate, has, getAge } = useCacheContext();
  const [data, setData] = useState<T | undefined>(() => {
    if (initialData !== undefined) return initialData;
    if (enabled) {
      const cached = get<T>(key);
      return cached !== null ? cached : undefined;
    }
    return undefined;
  });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      set(key, result, ttl);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, key, set, ttl]);

  useEffect(() => {
    if (!enabled) return;

    const cached = get<T>(key);
    if (cached !== null) {
      setData(cached);
      setLoading(false);

      const age = getAge(key);
      if (age !== null && age > ttl * 0.8) {
        fetchData();
      }
      return;
    }

    fetchData();
  }, [enabled, key, get, getAge, ttl, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const invalidateCallback = useCallback(() => {
    invalidate(key);
    setData(undefined);
  }, [invalidate, key]);

  const isValid = data !== undefined && has(key);

  return {
    data,
    error,
    loading,
    refetch,
    invalidate: invalidateCallback,
    isValid,
  };
}

export default useCache;
