// src/components/ui/toast-provider.tsx

'use client';

import * as React from 'react';
import { Toast, ToastClose, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

function ToastProvider({ children }: ToastProviderProps) {
  const { toasts } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
          return (
            <Toast key={id} variant={variant} duration={duration} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
      </div>
    </>
  );
}

export { ToastProvider };