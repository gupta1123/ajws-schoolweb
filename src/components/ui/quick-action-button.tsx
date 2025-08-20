// src/components/ui/quick-action-button.tsx

'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { type VariantProps } from 'class-variance-authority';

interface QuickActionButtonProps extends 
  React.ComponentProps<"button">, 
  VariantProps<typeof buttonVariants> {
  href?: string;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

export function QuickActionButton({
  href,
  icon,
  label,
  description,
  variant = 'outline',
  className,
  ...props
}: QuickActionButtonProps) {
  const content = (
    <>
      {icon && <div className="mb-2">{icon}</div>}
      <span className="font-medium text-sm">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Button
        variant={variant}
        className={cn(
          'flex flex-col items-center justify-center h-auto p-4 rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow',
          className
        )}
        asChild
        {...props}
      >
        <Link href={href}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      className={cn(
        'flex flex-col items-center justify-center h-auto p-4 rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {content}
    </Button>
  );
}