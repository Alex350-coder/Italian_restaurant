import { ReactNode } from 'react';

interface VisuallyHiddenTextProps {
  children: ReactNode;
  as?: 'span' | 'div' | 'p';
  className?: string;
  id?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
}

export default function VisuallyHidden({
  children,
  as: Component = 'span',
  className = '',
  id,
  'aria-live': ariaLive,
  'aria-atomic': ariaAtomic,
}: VisuallyHiddenTextProps) {
  return (
    <Component
      id={id}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={`sr-only ${className}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </Component>
  );
}
