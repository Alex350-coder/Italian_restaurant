import { useState, useRef, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface UseVirtualScrollReturn {
  containerRef: (node: HTMLElement | null) => void;
  visibleItems: { index: number; offsetTop: number; style: React.CSSProperties }[];
  totalHeight: number;
  scrollTop: number;
  scrollToIndex: (index: number) => void;
}

export default function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const totalHeight = itemCount * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
      }

      containerRef.current = node;

      if (node) {
        node.addEventListener('scroll', handleScroll, { passive: true });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemCount, itemHeight, containerHeight]
  );

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const top = index * itemHeight;
        containerRef.current.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [itemHeight]
  );

  return {
    containerRef: setRef,
    visibleItems,
    totalHeight,
    scrollTop,
    scrollToIndex,
  };
}
