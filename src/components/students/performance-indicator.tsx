// src/components/students/performance-indicator.tsx

'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceIndicatorProps {
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function PerformanceIndicator({
  value,
  label,
  trend,
  className,
}: PerformanceIndicatorProps) {
  const getValueColor = (val: number) => {
    if (val >= 90) return 'text-green-500';
    if (val >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('text-lg font-bold', getValueColor(value))}>
        {value}%
      </div>
      <div className="text-xs text-muted-foreground text-center">
        {label}
      </div>
      {trend && (
        <div className="mt-1">
          {getTrendIcon()}
        </div>
      )}
    </div>
  );
}