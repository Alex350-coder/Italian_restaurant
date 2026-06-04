import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
}

interface UseIntersectionObserverReturn<T extends Element = Element> {
  ref: (node: T | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export default function useIntersectionObserver<T extends Element = Element>({
  threshold = 0,
  rootMargin = '0px',
  root = null,
  freezeOnceVisible = false,
  initialIsIntersecting = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn<T> {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const frozen = freezeOnceVisible && isIntersecting;

  const ref = useRef<T | null>(null);
  const callbackRef = useRef<IntersectionObserverCallback>();

  callbackRef.current = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
    }
  };

  const setRef = useCallback(
    (node: T | null) => {
      if (frozen) return;

      if (ref.current) {
        const observer = (ref.current as any).__observer;
        if (observer) {
          observer.disconnect();
        }
      }

      ref.current = node;

      if (node) {
        const observer = new IntersectionObserver(
          (entries) => {
            callbackRef.current?.(entries, observer);
          },
          { threshold, rootMargin, root }
        );
        observer.observe(node);
        (node as any).__observer = observer;
      }
    },
    [threshold, rootMargin, root, frozen]
  );

  useEffect(() => {
    return () => {
      if (ref.current) {
        const observer = (ref.current as any).__observer;
        if (observer) {
          observer.disconnect();
        }
      }
    };
  }, []);

  return { ref: setRef, isIntersecting, entry };
}
