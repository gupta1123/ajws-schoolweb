// src/app/dashboard/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

import { Card, CardContent } from '@/components/ui/card';
import { ErrorBoundary, ApiErrorFallback } from '@/components/ui/error-boundary';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  UserCheck,
  User,
  GraduationCap,
  Building2
} from 'lucide-react';

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



const DashboardPage = () => {
  const { user } = useAuth();

  // Memoize admin cards to prevent re-creation on every render
  const adminQuickAccessCards = useMemo(() => [
    {
      title: 'Students',
      icon: <GraduationCap className="h-5 w-5" />,
      href: '/students'
    },
    {
      title: 'Parents',
      icon: <UserCheck className="h-5 w-5" />,
      href: '/parents'
    },
    {
      title: 'Staff',
      icon: <User className="h-5 w-5" />,
      href: '/staff'
    },
    {
      title: 'Academic',
      icon: <Building2 className="h-5 w-5" />,
      href: '/academic'
    }
  ], []);

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <WelcomeBanner />
        
        {user?.role === 'teacher' ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                <ClassOverviewCard />
              </Suspense>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ErrorBoundary fallback={ApiErrorFallback}>
                  <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                    <UpcomingEvents />
                  </Suspense>
                </ErrorBoundary>
                <ErrorBoundary fallback={ApiErrorFallback}>
                  <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                    <UpcomingBirthdays />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        ) : user?.role === 'admin' || user?.role === 'principal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {adminQuickAccessCards.map((card, index) => (
                    <Link key={index} href={card.href}>
                      <Card className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer h-20 flex items-center justify-center">
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {card.icon}
                            </div>
                            <div className="text-sm font-medium text-center">{card.title}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>


            </div>

            {/* Right Pane - Events and Birthdays */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <ErrorBoundary fallback={ApiErrorFallback}>
                <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                  <UpcomingEvents />
                </Suspense>
              </ErrorBoundary>

              {/* Upcoming Birthdays */}
              <ErrorBoundary fallback={ApiErrorFallback}>
                <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                  <UpcomingBirthdays />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;