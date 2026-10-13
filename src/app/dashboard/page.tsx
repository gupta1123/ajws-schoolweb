// src/app/dashboard/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  UserCheck,
  User,
  GraduationCap,
  Building2,
  Key
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ActionTile, StatTile } from '@/components/ui/page-kit';
import { space, type } from '@/lib/design/tokens';
import { useSchoolStats } from '@/hooks/use-school-stats';

// Lazy load heavy components to improve initial load performance
const ClassOverviewCard = dynamic(() => import('@/components/dashboard/class-overview-card').then(mod => mod.ClassOverviewCard), {
  loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />
});

const UpcomingEvents = dynamic(() => import('@/components/dashboard/upcoming-events').then(mod => mod.UpcomingEvents), {
  loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />
});

const UpcomingBirthdays = dynamic(() => import('@/components/dashboard/upcoming-birthdays').then(mod => mod.UpcomingBirthdays), {
  loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />
});

const PrincipalDailyHomework = dynamic(() => import('@/components/homework/principal-daily-homework').then(mod => mod.PrincipalDailyHomework), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" />
});



const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const canViewAdminDashboard = user?.role === 'admin' || user?.role === 'principal';
  const {
    totalStudents,
    totalStaff,
    loading: statsLoading,
    error: statsError
  } = useSchoolStats({ enabled: canViewAdminDashboard });

  // Memoize admin cards to prevent re-creation on every render
  const adminQuickAccessCards = useMemo(() => [
    {
      title: t('dashboard.cards.students'),
      icon: <GraduationCap />,
      href: '/students'
    },
    {
      title: t('dashboard.cards.staff'),
      icon: <User  />,
      href: '/staff'
    },
    {
      title: t('dashboard.cards.academic'),
      icon: <Building2  />,
      href: '/academic/setup'
    },
    {
      title: t('dashboard.cards.passwords', 'Passwords'),
      icon: <Key  />,
      href: '/passwords'
    }
  ], [t]);

  const skeleton = <div className="h-32 animate-pulse rounded-lg bg-muted" />;

  const events = (
    <ErrorBoundary fallback={ApiErrorFallback}>
      <Suspense fallback={skeleton}>
        <UpcomingEvents />
      </Suspense>
    </ErrorBoundary>
  );

  const birthdays = (
    <ErrorBoundary fallback={ApiErrorFallback}>
      <Suspense fallback={skeleton}>
        <UpcomingBirthdays />
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <ProtectedRoute>
      <div className={space.page}>
        <WelcomeBanner />

        {user?.role === 'teacher' ? (
          <>
            <Suspense fallback={skeleton}>
              <ClassOverviewCard />
            </Suspense>
            <div className={`${space.grid} md:grid-cols-2`}>
              {events}
              {birthdays}
            </div>
          </>
        ) : canViewAdminDashboard ? (
          <>
            <div className={`${space.grid} grid-cols-2 lg:grid-cols-4`}>
              <StatTile
                label={t('common.totalStudents', 'Total Students')}
                value={totalStudents}
                icon={<GraduationCap />}
                loading={statsLoading}
              />
              <StatTile
                label={t('common.totalStaff', 'Total Staff')}
                value={totalStaff}
                icon={<UserCheck />}
                tone="success"
                loading={statsLoading}
              />
            </div>
            {statsError && (
              <Alert variant="destructive">
                <AlertDescription>{statsError}</AlertDescription>
              </Alert>
            )}

            <section>
              <h2 className={`${type.sectionTitle} mb-2`}>{t('dashboard.quickActions')}</h2>
              <div className={`${space.grid} grid-cols-2 lg:grid-cols-4`}>
                {adminQuickAccessCards.map((card) => (
                  <ActionTile key={card.href} href={card.href} icon={card.icon} label={card.title} />
                ))}
              </div>
            </section>

            {user?.role === 'principal' ? (
              <div className={`${space.grid} lg:grid-cols-3`}>
                <div className="lg:col-span-2">
                  <ErrorBoundary fallback={ApiErrorFallback}>
                    <PrincipalDailyHomework />
                  </ErrorBoundary>
                </div>
                <div className="space-y-4">
                  {events}
                  {birthdays}
                </div>
              </div>
            ) : (
              <div className={`${space.grid} md:grid-cols-2`}>
                {events}
                {birthdays}
              </div>
            )}
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
