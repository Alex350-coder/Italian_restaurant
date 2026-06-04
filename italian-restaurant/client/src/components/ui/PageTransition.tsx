import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale';
}

export default function PageTransition({ children, variant = 'fade' }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    setTransitionStage('exit');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('enter');
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const variantStyles = {
    fade: {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 translate-y-2',
    },
    slide: {
      enter: 'opacity-100 translate-x-0',
      exit: 'opacity-0 translate-x-8',
    },
    scale: {
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="relative">
      <div
        className={`transition-all duration-300 ease-out ${
          transitionStage === 'enter' ? styles.enter : styles.exit
        }`}
      >
        {displayChildren}
      </div>
      {transitionStage === 'exit' && (
        <div className="absolute inset-0 flex items-center justify-center bg-crema/80 backdrop-blur-sm z-50">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-dorado-aceite animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-rosso-pomodoro animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-verde-basilico animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
