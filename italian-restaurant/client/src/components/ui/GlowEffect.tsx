import { ReactNode, useState } from 'react';

interface GlowEffectProps {
  children: ReactNode;
  color?: 'gold' | 'red' | 'green' | 'white';
  intensity?: 'sm' | 'md' | 'lg';
  className?: string;
}

const glowColors = {
  gold: {
    sm: '0 0 10px rgba(218, 165, 32, 0.3)',
    md: '0 0 20px rgba(218, 165, 32, 0.4)',
    lg: '0 0 40px rgba(218, 165, 32, 0.5)',
  },
  red: {
    sm: '0 0 10px rgba(196, 30, 58, 0.3)',
    md: '0 0 20px rgba(196, 30, 58, 0.4)',
    lg: '0 0 40px rgba(196, 30, 58, 0.5)',
  },
  green: {
    sm: '0 0 10px rgba(34, 139, 34, 0.3)',
    md: '0 0 20px rgba(34, 139, 34, 0.4)',
    lg: '0 0 40px rgba(34, 139, 34, 0.5)',
  },
  white: {
    sm: '0 0 10px rgba(255, 255, 255, 0.2)',
    md: '0 0 20px rgba(255, 255, 255, 0.3)',
    lg: '0 0 40px rgba(255, 255, 255, 0.4)',
  },
};

export default function GlowEffect({
  children,
  color = 'gold',
  intensity = 'md',
  className = '',
}: GlowEffectProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? glowColors[color][intensity] : 'none',
      }}
    >
      {children}
    </div>
  );
}
