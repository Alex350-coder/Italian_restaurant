import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(start);
  const countRef = useRef<number>(start);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            startTimeRef.current = null;
            const animate = (timestamp: number) => {
              if (!startTimeRef.current) startTimeRef.current = timestamp;
              const elapsed = timestamp - startTimeRef.current;
              const progress = Math.min(elapsed / duration, 1);

              const eased = 1 - Math.pow(1 - progress, 3);
              countRef.current = start + (end - start) * eased;
              setCount(countRef.current);

              if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
              }
            };
            rafRef.current = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, start, duration]);

  const displayValue = count.toFixed(decimals);

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
