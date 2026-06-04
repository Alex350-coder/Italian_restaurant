import { memo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'image' | 'card' | 'avatar' | 'button' | 'circle';
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

const Skeleton = memo(function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  rounded = 'lg',
}: SkeletonProps) {
  const baseClasses = twMerge(
    clsx(
      'animate-skeleton-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
      roundedMap[rounded],
      className
    )
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  switch (variant) {
    case 'image':
      return (
        <div className={clsx(baseClasses, 'relative overflow-hidden')} style={style}>
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        </div>
      );

    case 'avatar':
      return <div className={clsx(baseClasses, 'rounded-full')} style={{ width: 48, height: 48, ...style }} />;

    case 'card':
      return (
        <div className={clsx(baseClasses, 'p-4 space-y-3 bg-white shadow-sm')} style={style}>
          <Skeleton variant="image" className="h-40 w-full" />
          <Skeleton variant="text" className="h-4 w-1/3" />
          <Skeleton variant="text" className="h-6 w-2/3" />
          <Skeleton variant="text" className="h-3 w-full" />
          <Skeleton variant="text" className="h-3 w-3/4" />
          <div className="flex justify-between pt-2">
            <Skeleton variant="text" className="h-6 w-16" />
            <Skeleton variant="button" className="h-8 w-24" />
          </div>
        </div>
      );

    case 'button':
      return <div className={clsx(baseClasses, 'h-10 w-24')} style={style} />;

    case 'circle':
      return <div className={clsx(baseClasses, 'rounded-full')} style={{ width: 40, height: 40, ...style }} />;

    case 'text':
    default:
      return <div className={clsx(baseClasses, 'h-4 w-full')} style={style} />;
  }
});

function MenuCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
      <Skeleton variant="image" className="h-48 w-full" rounded="xl" />
      <Skeleton variant="text" className="h-3 w-1/3" />
      <Skeleton variant="text" className="h-5 w-2/3" />
      <Skeleton variant="text" className="h-3 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton variant="text" className="h-6 w-16" />
        <Skeleton variant="button" className="h-8 w-28" />
      </div>
    </div>
  );
}

function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-3 w-16" />
        </div>
      </div>
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-2/3" />
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="min-h-[90vh] bg-noche-negro flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <Skeleton variant="text" className="h-4 w-48 bg-white/10" />
          <Skeleton variant="text" className="h-16 w-64 bg-white/10" />
          <Skeleton variant="text" className="h-16 w-48 bg-white/10" />
          <Skeleton variant="text" className="h-4 w-80 bg-white/10" />
          <div className="flex gap-4 pt-4">
            <Skeleton variant="button" className="h-12 w-40 bg-white/10" />
            <Skeleton variant="button" className="h-12 w-40 bg-white/10" />
          </div>
        </div>
        <div className="hidden md:block">
          <Skeleton variant="image" className="h-[500px] w-full bg-white/10" rounded="2xl" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
export { MenuCardSkeleton, TestimonialSkeleton, HeroSkeleton };
