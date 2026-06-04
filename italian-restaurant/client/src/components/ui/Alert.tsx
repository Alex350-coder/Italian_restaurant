import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  role?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  className?: string;
  id?: string;
}

const variantStyles: Record<string, string> = {
  info: 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-600',
  success: 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-600',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600',
  error: 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-200 dark:border-red-600',
};

const variantIcons: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

export default function Alert({
  children,
  variant = 'info',
  role = 'alert',
  'aria-live': ariaLive = 'polite',
  className = '',
  id,
}: AlertProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      id={id}
      className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${variantStyles[variant]} ${className}`}
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">
        {variantIcons[variant]}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
