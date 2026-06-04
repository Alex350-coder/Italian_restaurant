import { useEffect, useRef, ReactNode } from 'react';

interface TextRevealProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  splitBy?: 'chars' | 'words';
  staggerDelay?: number;
  className?: string;
  id?: string;
}

export default function TextReveal({
  children,
  as: Tag = 'p',
  splitBy = 'words',
  staggerDelay = 50,
  className = '',
  id,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = container.querySelectorAll('[data-reveal-item]');
            items.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('revealed');
              }, index * staggerDelay);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [staggerDelay]);

  const text = typeof children === 'string' ? children : '';
  const items = splitBy === 'words' ? text.split(' ') : text.split('');

  return (
    <Tag ref={containerRef} id={id} className={className}>
      {items.map((item, index) => (
        <span
          key={index}
          data-reveal-item
          className="inline-block transition-all duration-700 opacity-0 translate-y-6"
          style={{
            transitionDelay: `${index * staggerDelay}ms`,
          }}
        >
          {item}
          {splitBy === 'words' && index < items.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
      <style>{`
        [data-reveal-item].revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </Tag>
  );
}
