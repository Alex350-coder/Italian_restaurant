import { useState, useRef, ReactNode } from 'react';
import { generateId } from '@/utils/a11y';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const positionStyles: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useRef(generateId('tooltip'));

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div className={`relative inline-block ${className}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <div
        aria-describedby={isVisible ? tooltipId.current : undefined}
        tabIndex={0}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`absolute z-50 px-3 py-1.5 text-sm font-medium text-white bg-noche-negro 
                      dark:bg-white dark:text-noche-negro rounded-lg shadow-lg whitespace-nowrap
                      pointer-events-none animate-fade-in ${positionStyles[position]}`}
        >
          {content}
          <span
            className={`absolute w-2 h-2 bg-noche-negro dark:bg-white transform rotate-45
                       ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                       ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                       ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                       ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
