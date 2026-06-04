import { ReactNode, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  variant?: 'default' | 'glass' | '3d' | '3d-gold' | 'glass-gold';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className,
  hover = true,
  padding = 'md',
  onClick,
  variant = 'default',
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const is3D = variant === '3d';

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!is3D || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(-y * 8);
    setRotateY(x * 8);
  };

  const handleMouseLeave = () => {
    if (!is3D) return;
    setRotateX(0);
    setRotateY(0);
  };

  const variantStyles = {
    default: 'bg-white shadow-lg',
    glass: 'bg-white/70 backdrop-blur-md border border-white/30 shadow-lg',
    '3d': 'bg-white shadow-3d',
    '3d-gold': 'bg-white shadow-3d-gold border border-dorado-aceite/20',
    'glass-gold': 'bg-gradient-to-br from-white/80 to-yellow-50/80 backdrop-blur-md border border-dorado-aceite/20 shadow-3d-gold',
  };

  const baseStyles = clsx(
    'rounded-xl overflow-hidden transition-all duration-300',
    variantStyles[variant],
    hover && !is3D && 'hover:shadow-xl hover:-translate-y-1',
    is3D && 'card-3d hover:shadow-2xl',
    onClick && 'cursor-pointer',
    paddingStyles[padding],
    className
  );

  const isGoldTinted = variant === '3d-gold' || variant === 'glass-gold';

  return (
    <div
      ref={cardRef}
      className={twMerge(baseStyles)}
      style={
        is3D
          ? {
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              boxShadow: isGoldTinted
                ? `${rotateY * -2}px ${rotateX * 2}px 24px rgba(218,165,32,0.2), 0 4px 12px rgba(0,0,0,0.08)`
                : `${rotateY * -2}px ${rotateX * 2}px 24px rgba(0,0,0,0.12)`,
            }
          : undefined
      }
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={twMerge('mb-4', className)}>{children}</div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={twMerge(
        'font-display text-xl font-bold text-noche-negro',
        className
      )}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

Card.Description = function CardDescription({
  children,
  className,
}: CardDescriptionProps) {
  return (
    <p className={twMerge('text-tierra-marron/70 text-sm', className)}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

Card.Content = function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={twMerge(
        'mt-4 pt-4 border-t border-dorado-aceite/20 flex items-center',
        className
      )}
    >
      {children}
    </div>
  );
};
