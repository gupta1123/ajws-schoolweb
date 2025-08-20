// src/components/ui/toast.tsx

'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 w-full sm:max-w-[350px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'data-[swipe=move]:transition-none group data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[state=open]:animate-in data-[state=closed]:animate-out transition-all data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'bg-background border text-foreground',
        success: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200',
        error: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);



const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(
  (
    {
      className,
      variant,
      duration = 5000,
      onOpenChange,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        duration={duration}
        onOpenChange={onOpenChange}
        {...props}
      >
        <div className="flex items-start gap-2">
          <div className="grid flex-1 gap-1">{children}</div>
          <ToastPrimitives.Close className="text-foreground/50 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
            <XIcon className="h-4 w-4" />
          </ToastPrimitives.Close>
        </div>
      </ToastPrimitives.Root>
    );
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = 'ToastDescription';

interface ToastActionProps extends React.ComponentPropsWithoutRef<'button'> {
  altText: string;
}

const ToastAction = React.forwardRef<
  React.ElementRef<'button'>,
  ToastActionProps
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = 'ToastAction';

// Type for toast action element
type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Type for toast props
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

const ToastClose = React.forwardRef<
  React.ElementRef<'button'>,
  React.ComponentPropsWithoutRef<'button'>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      className
    )}
    {...props}
  >
    <XIcon className="h-4 w-4" />
  </button>
));
ToastClose.displayName = 'ToastClose';

export { Toast, ToastTitle, ToastDescription, ToastAction, ToastClose, ToastProvider, ToastViewport, type ToastActionElement, type ToastProps };