import { ReactNode } from 'react';

interface AccessibleIconProps {
  children: ReactNode;
  label?: string;
  'aria-label'?: string;
  role?: string;
  className?: string;
  decorative?: boolean;
}

export default function AccessibleIcon({
  children,
  label,
  'aria-label': ariaLabel,
  role,
  className = '',
  decorative = false,
}: AccessibleIconProps) {
  const accessibleLabel = ariaLabel || label;

  if (decorative) {
    return (
      <span className={className} aria-hidden="true">
        {children}
      </span>
    );
  }

  return (
    <span
      className={className}
      role={role || 'img'}
      aria-label={accessibleLabel}
    >
      {children}
      {accessibleLabel && (
        <span className="sr-only">{accessibleLabel}</span>
      )}
    </span>
  );
}
