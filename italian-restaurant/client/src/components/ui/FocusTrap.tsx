import { useEffect, useRef, ReactNode } from 'react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface FocusTrapProps {
  children: ReactNode;
  isActive?: boolean;
  onEscape?: () => void;
  className?: string;
}

export default function FocusTrap({
  children,
  isActive = true,
  onEscape,
  className = '',
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { focusFirst } = useKeyboardNavigation(containerRef, {
    trapFocus: true,
    onEscape,
  });

  useEffect(() => {
    if (isActive && containerRef.current) {
      const timer = setTimeout(() => {
        focusFirst();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, focusFirst]);

  useEffect(() => {
    if (!isActive) return;

    const handleFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        event.stopPropagation();
        focusFirst();
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isActive, focusFirst]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
