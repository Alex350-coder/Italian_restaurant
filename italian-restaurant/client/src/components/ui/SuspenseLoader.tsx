import { memo } from 'react';

const ForkKnifeSpinner = memo(function ForkKnifeSpinner() {
  return (
    <div className="relative w-20 h-20">
      <svg
        className="animate-spin-slow"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#C41E3A"
          strokeWidth="3"
          strokeDasharray="70 30"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce-subtle">
        🍴
      </span>
    </div>
  );
});

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-skeleton-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
      <SkeletonPulse className="h-40 rounded-lg w-full" />
      <SkeletonPulse className="h-4 w-1/3" />
      <SkeletonPulse className="h-6 w-2/3" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-3/4" />
      <div className="flex justify-between pt-2">
        <SkeletonPulse className="h-6 w-16" />
        <SkeletonPulse className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonPulse className="h-64 w-full rounded-2xl" />
      <div className="space-y-3">
        <SkeletonPulse className="h-8 w-1/3" />
        <SkeletonPulse className="h-4 w-2/3" />
        <SkeletonPulse className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

interface SuspenseLoaderProps {
  variant?: 'page' | 'card' | 'component';
}

function SuspenseLoaderInner({ variant = 'component' }: SuspenseLoaderProps) {
  if (variant === 'page') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-crema">
        <div className="text-center space-y-6">
          <ForkKnifeSpinner />
          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold text-gradient-gold">
              La Dolce Vita
            </h3>
            <p className="text-tierra-marron text-sm">Preparando per te...</p>
          </div>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-rosso-pomodoro animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return <CardSkeleton />;
  }

  return (
    <div className="flex items-center justify-center p-8">
      <ForkKnifeSpinner />
    </div>
  );
}

const SuspenseLoader = memo(SuspenseLoaderInner);
export default SuspenseLoader;
export { PageSkeleton, CardSkeleton };
