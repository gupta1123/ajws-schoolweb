// src/components/ui/notification-badge.tsx

'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  maxCount?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function NotificationBadge({
  count,
  maxCount = 99,
  variant = 'destructive',
  className,
  ...props
}: NotificationBadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  if (count === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[18px] h-4.5 px-1',
        getVariantClasses(),
        className
      )}
      {...props}
    >
      {displayCount}
    </span>
  );
}