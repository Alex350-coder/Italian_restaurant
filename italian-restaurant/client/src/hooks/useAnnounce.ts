import { useCallback, useRef, useEffect } from 'react';

export function useAnnounce() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      let region = document.getElementById('use-announce-region');
      if (!region) {
        region = document.createElement('div');
        region.id = 'use-announce-region';
        region.setAttribute('aria-live', priority);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        document.body.appendChild(region);
      }

      region.setAttribute('aria-live', priority);
      region.textContent = '';

      timeoutRef.current = setTimeout(() => {
        if (region) region.textContent = message;
      }, 100);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { announce };
}
