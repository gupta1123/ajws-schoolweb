// src/components/classes/class-health-indicator.tsx

'use client';

import { cn } from '@/lib/utils';

interface ClassHealthIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ClassHealthIndicator({
  score,
  size = 'md',
  className,
}: ClassHealthIndicatorProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-500';
    if (s >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (s >= 75) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className={cn(
      'flex items-center justify-center rounded-full font-bold',
      getSizeClasses(),
      getScoreBg(score),
      getScoreColor(score),
      className
    )}>
      {score}
    </div>
  );
}