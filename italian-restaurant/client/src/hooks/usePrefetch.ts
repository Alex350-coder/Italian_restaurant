import { useEffect, useRef, useCallback } from 'react';
import { prefetcher } from '@/services/prefetcher';

export function usePrefetchOnHover(url: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  const elementRef = useRef<HTMLElement | null>(null);
  const isPrefetched = useRef(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isPrefetched.current) return;

    timeoutId.current = setTimeout(() => {
      prefetcher.prefetch(url, priority);
      isPrefetched.current = true;
    }, 100);
  }, [url, priority]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('focus', handleMouseEnter);
    element.addEventListener('blur', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('focus', handleMouseEnter);
      element.removeEventListener('blur', handleMouseLeave);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [handleMouseEnter, handleMouseLeave]);

  return elementRef;
}

export function usePrefetchInView(url: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  const elementRef = useRef<HTMLElement | null>(null);
  const isPrefetched = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isPrefetched.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      prefetcher.prefetch(url, priority);
      isPrefetched.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPrefetched.current) {
            prefetcher.prefetch(url, priority);
            isPrefetched.current = true;
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [url, priority]);

  return elementRef;
}

export function usePrefetchIdle(
  urls: string[],
  priority: 'high' | 'medium' | 'low' = 'low'
) {
  useEffect(() => {
    if (urls.length === 0) return;

    let cancelled = false;

    const prefetch = () => {
      if (cancelled) return;

      if (typeof requestIdleCallback === 'undefined') {
        urls.forEach((url) => prefetcher.prefetch(url, priority));
        return;
      }

      requestIdleCallback(
        (deadline) => {
          if (cancelled) return;
          let i = 0;
          while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && i < urls.length) {
            prefetcher.prefetch(urls[i], priority);
            i++;
          }
        },
        { timeout: 5000 }
      );
    };

    prefetch();

    return () => {
      cancelled = true;
      urls.forEach((url) => prefetcher.cancelPrefetch(url));
    };
  }, [urls, priority]);
}

export function usePrefetchOnView(
  containerRef: React.RefObject<HTMLElement>,
  urls: string[],
  options: { rootMargin?: string; threshold?: number } = {}
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || urls.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      urls.forEach((url) => prefetcher.prefetch(url, 'low'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const links = entry.target.querySelectorAll('a[data-prefetch]');
            links.forEach((link) => {
              const url = link.getAttribute('href');
              if (url) {
                prefetcher.prefetch(url, 'low');
              }
            });
          }
        });
      },
      { rootMargin: options.rootMargin || '300px', threshold: options.threshold || 0 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef, urls, options.rootMargin, options.threshold]);
}

export default usePrefetchOnHover;
