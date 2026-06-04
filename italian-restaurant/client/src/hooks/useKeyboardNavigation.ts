import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  trapFocus?: boolean;
  focusableSelector?: string;
}

export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    trapFocus = false,
    focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  } = options;

  const focusableElements = useRef<HTMLElement[]>([]);
  const currentIndex = useRef<number>(-1);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
    );
    focusableElements.current = elements;
    return elements;
  }, [containerRef, focusableSelector]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
        case ' ':
          if ((event.target as HTMLElement).tagName !== 'BUTTON') {
            onEnter?.();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'Tab':
          if (trapFocus) {
            const elements = updateFocusableElements();
            if (elements.length === 0) break;

            currentIndex.current = elements.indexOf(event.target as HTMLElement);

            if (event.shiftKey) {
              if (currentIndex.current <= 0) {
                event.preventDefault();
                elements[elements.length - 1].focus();
              }
            } else {
              if (currentIndex.current >= elements.length - 1) {
                event.preventDefault();
                elements[0].focus();
              }
            }
          }
          break;
      }
    },
    [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, trapFocus, updateFocusableElements]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);

  const focusFirst = useCallback(() => {
    const elements = updateFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
      currentIndex.current = 0;
    }
  }, [updateFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = updateFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      currentIndex.current = elements.length - 1;
    }
  }, [updateFocusableElements]);

  return { focusFirst, focusLast, updateFocusableElements };
}
