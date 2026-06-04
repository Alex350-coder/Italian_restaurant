import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineManager } from '@/services/offlineManager';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  queueRequest: <T>(method: string, url: string, data?: unknown) => Promise<T>;
  retryFailed: () => void;
  getQueueSize: () => number;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = offlineManager.onStatusChange((online) => {
      if (mountedRef.current) {
        setIsOnline(online);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const queueRequest = useCallback(
    async <T,>(method: string, url: string, data?: unknown): Promise<T> => {
      return offlineManager.queueRequest<T>(method, url, data);
    },
    []
  );

  const retryFailed = useCallback(() => {
    offlineManager.retryFailedRequests();
  }, []);

  const getQueueSize = useCallback(() => {
    return offlineManager.getQueueSize();
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    queueRequest,
    retryFailed,
    getQueueSize,
  };
}

export default useOffline;
