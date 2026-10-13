// src/components/homework/homework-access.tsx
//
// Gate for the create / edit pages: signed in, and a role that may manage homework.

'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/context';

export function HomeworkAccess({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
        <h2 className="text-lg font-semibold">{t('auth.title', 'Sign in to your account')}</h2>
        <p className="text-sm text-muted-foreground">{t('homeworkTeacher.authRequired', 'Please log in to access this page.')}</p>
        <Button onClick={() => router.push('/login')}>{t('homeworkTeacher.goToLogin', 'Go to Login')}</Button>
      </div>
    );
  }

  if (user?.role !== 'teacher' && user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
        <h2 className="text-lg font-semibold">{t('access.deniedTitle', 'Access Denied')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('homeworkTeacher.access.manageOnly', 'Only teachers, admins, and principals can access this page.')}
        </p>
      </div>
    );
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
