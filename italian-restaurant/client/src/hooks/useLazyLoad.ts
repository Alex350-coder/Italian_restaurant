import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

interface UseLazyLoadReturn {
  ref: (node: HTMLElement | null) => void;
  isLoaded: boolean;
  isVisible: boolean;
  isError: boolean;
  placeholderSrc: string | undefined;
}

export default function useLazyLoad({
  threshold = 0,
  rootMargin = '200px 0px',
  placeholder,
}: UseLazyLoadOptions = {}): UseLazyLoadReturn {
  const [isLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isError] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      elementRef.current = node;

      if (node) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observerRef.current?.disconnect();
            }
          },
          { threshold, rootMargin }
        );
        observerRef.current.observe(node);
      }
    },
    [threshold, rootMargin]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref: setRef,
    isLoaded,
    isVisible,
    isError,
    placeholderSrc: placeholder,
  };
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  blurHash?: string;
  onLoad?: () => void;
}

export function useLazyImage({
  src,
  placeholder,
  blurHash,
}: Omit<LazyImageProps, 'children'>) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      imgRef.current = node;

      if (node) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              const img = new Image();
              img.src = src;
              img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
              };
              img.onerror = () => setIsError(true);
              observerRef.current?.disconnect();
            }
          },
          { rootMargin: '200px 0px' }
        );
        observerRef.current.observe(node);
      }
    },
    [src]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref: setRef,
    src: imageSrc,
    isLoaded,
    isError,
    blurHash,
  };
}
