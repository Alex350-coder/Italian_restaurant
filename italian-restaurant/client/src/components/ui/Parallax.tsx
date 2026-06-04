import { useEffect, useRef, ReactNode } from 'react';

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export default function Parallax({
  children,
  speed = 0.3,
  direction = 'up',
  className = '',
}: ParallaxProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const elementCenter = rect.top + rect.height / 2;
          const viewportCenter = windowHeight / 2;
          const distance = elementCenter - viewportCenter;
          const maxDistance = windowHeight;

          const normalizedDistance = Math.max(-1, Math.min(1, distance / maxDistance));

          let tx = 0;
          let ty = 0;

          switch (direction) {
            case 'up':
              ty = normalizedDistance * speed * 100;
              break;
            case 'down':
              ty = -normalizedDistance * speed * 100;
              break;
            case 'left':
              tx = normalizedDistance * speed * 100;
              break;
            case 'right':
              tx = -normalizedDistance * speed * 100;
              break;
          }

          element.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);

  return (
    <div ref={elementRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
