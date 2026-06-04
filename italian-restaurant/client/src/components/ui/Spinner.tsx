import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-spin rounded-full border-dorado-aceite border-t-transparent',
          sizeStyles[size],
          className
        )
      )}
      role="status"
      aria-label="Caricamento"
    >
      <span className="sr-only">Caricamento...</span>
    </div>
  );
}
