// src/components/ui/progress-indicator.tsx

'use client';

import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const progressIndicatorVariants = cva(
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ProgressIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressIndicatorVariants> {
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  showIcon?: boolean;
}

export function ProgressIndicator({
  className,
  variant,
  size,
  status,
  showIcon = true,
  ...props
}: ProgressIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { 
          variant: 'success' as const, 
          icon: <Check className="h-3 w-3" />,
          text: 'Completed'
        };
      case 'failed':
        return { 
          variant: 'error' as const, 
          icon: <X className="h-3 w-3" />,
          text: 'Failed'
        };
      case 'in-progress':
        return { 
          variant: 'info' as const, 
          icon: <Clock className="h-3 w-3 animate-spin" />,
          text: 'In Progress'
        };
      case 'pending':
        return { 
          variant: 'warning' as const, 
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending'
        };
      case 'cancelled':
        return { 
          variant: 'default' as const, 
          icon: <X className="h-3 w-3" />,
          text: 'Cancelled'
        };
      default:
        return { 
          variant: 'default' as const, 
          icon: null,
          text: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={cn(
        progressIndicatorVariants({ 
          variant: variant || config.variant, 
          size, 
          className 
        })
      )}
      {...props}
    >
      {showIcon && config.icon}
      {config.text}
    </div>
  );
}