import { createContext, useContext, useCallback, ReactNode } from 'react';
import { cacheService } from '@/services/cacheService';

interface CacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttlMs?: number) => void;
  invalidate: (key: string) => void;
  invalidatePattern: (pattern: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  getAge: (key: string) => number | null;
  prefetch: <T>(key: string, fetcher: () => Promise<T>, ttlMs?: number) => Promise<T>;
  getStats: () => {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    idbHits: number;
    memoryHits: number;
    localStorageHits: number;
    totalSize: number;
    entryCount: number;
  };
  warmCache: (entries: Array<{ key: string; fetcher: () => Promise<unknown>; ttl?: number }>) => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const get = useCallback(<T,>(key: string): T | null => {
    return cacheService.syncGet<T>(key);
  }, []);

  const set = useCallback(
    <T,>(key: string, data: T, ttlMs: number = 5 * 60 * 1000) => {
      cacheService.syncSet(key, data, ttlMs);
    },
    []
  );

  const invalidate = useCallback((key: string) => {
    cacheService.invalidate(key);
  }, []);

  const invalidatePattern = useCallback(
    (pattern: string) => {
      cacheService.invalidatePattern(pattern);
    },
    []
  );

  const clear = useCallback(() => {
    cacheService.clear();
  }, []);

  const has = useCallback(
    (key: string): boolean => {
      return cacheService.has(key);
    },
    []
  );

  const getAge = useCallback(
    (key: string): number | null => {
      return cacheService.getAge(key);
    },
    []
  );

  const prefetch = useCallback(
    async <T,>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> => {
      return cacheService.prefetch(key, fetcher, ttlMs);
    },
    []
  );

  const getStats = useCallback(() => {
    return cacheService.getStats();
  }, []);

  const warmCache = useCallback(
    async (entries: Array<{ key: string; fetcher: () => Promise<unknown>; ttl?: number }>) => {
      await cacheService.warmCache(entries);
    },
    []
  );

  return (
    <CacheContext.Provider
      value={{
        get,
        set,
        invalidate,
        invalidatePattern,
        clear,
        has,
        getAge,
        prefetch,
        getStats,
        warmCache,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
}

export function useCacheContext(): CacheContextType {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider');
  }
  return context;
}
