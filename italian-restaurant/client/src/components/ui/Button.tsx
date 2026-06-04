import { ButtonHTMLAttributes, ReactNode, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow-gold' | 'glow-red' | '3d';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  magnetic?: boolean;
  ripple?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles = {
  primary:
    'bg-rosso-pomodoro text-white hover:bg-red-800 shadow-warm active:bg-red-900',
  secondary:
    'bg-verde-basilico text-white hover:bg-green-700 shadow-olive active:bg-green-800',
  outline:
    'border-2 border-rosso-pomodoro text-rosso-pomodoro hover:bg-rosso-pomodoro hover:text-white',
  ghost:
    'bg-transparent text-noche-negro hover:bg-bianco-mozzarella dark:text-white dark:hover:bg-white/10',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  'glow-gold':
    'bg-gradient-to-r from-dorado-aceite to-yellow-400 text-noche-negro shadow-glow-gold hover:shadow-glow-gold-lg hover:from-yellow-400 hover:to-dorado-aceite',
  'glow-red':
    'bg-gradient-to-r from-rosso-pomodoro to-red-500 text-white shadow-glow-red hover:shadow-glow-red-lg hover:from-red-500 hover:to-rosso-pomodoro',
  '3d':
    'bg-gradient-to-b from-dorado-aceite to-yellow-600 text-noche-negro font-extrabold shadow-button-3d active:shadow-button-3d-active active:translate-y-1 border-b-4 border-yellow-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-base rounded-lg',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  magnetic = false,
  ripple = true,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ripple || disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;

    setMagneticOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center font-bold transition-all duration-200 overflow-hidden select-none',
          variant === '3d' ? 'active:translate-y-1' : 'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      style={{
        transform: magnetic
          ? `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`
          : undefined,
      }}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}

      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Caricamento...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}

      <style>{`
        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            margin-left: -150px;
            margin-top: -150px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s linear;
        }
      `}</style>
    </button>
  );
}
