'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { MonthlyMenusPanel } from '@/components/food-menu/monthly-menus-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// the legacy daily view is only fetched when its tab is first opened
const DailyMenusPanel = dynamic(() => import('@/components/food-menu/daily-menus-panel').then((m) => m.DailyMenusPanel), {
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});

type Tab = 'monthly' | 'daily';

function FoodMenuContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const canManage = user?.role === 'admin' || user?.role === 'principal';
  const canView = canManage || user?.role === 'parent';

  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'daily' ? 'daily' : 'monthly');
  // once opened, a panel stays mounted (hidden) so switching back is instant
  const [visited, setVisited] = useState<Record<Tab, boolean>>({ monthly: true, daily: tab === 'daily' });

  const choose = (next: Tab) => {
    setTab(next);
    setVisited((v) => ({ ...v, [next]: true }));
    const q = new URLSearchParams(window.location.search);
    if (next === 'daily') q.set('tab', 'daily');
    else q.delete('tab');
    window.history.replaceState(null, '', `${window.location.pathname}${q.size ? `?${q}` : ''}`);
  };

  if (user && !canView) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('access.adminsOnlySection', 'Only admins and principals can access this section.')}</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'monthly', label: t('foodMenu.tabs.monthly', 'Monthly menus') },
    { key: 'daily', label: t('foodMenu.tabs.daily', 'Daily menus (legacy)') },
  ];

  // parents only ever see the monthly files
  const lead = canManage ? (
    <div role="tablist" className="mr-1 flex items-center gap-1 rounded-lg bg-muted p-[3px]">
      {tabs.map((x) => (
        <button
          key={x.key}
          type="button"
          role="tab"
          aria-selected={tab === x.key}
          onClick={() => choose(x.key)}
          className={cn(
            'inline-flex h-8 items-center rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tab === x.key ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {x.label}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div hidden={tab !== 'monthly'}>
        <MonthlyMenusPanel lead={tab === 'monthly' ? lead : undefined} canManage={canManage} />
      </div>
      {canManage && visited.daily && (
        <div hidden={tab !== 'daily'}>
          <DailyMenusPanel lead={tab === 'daily' ? lead : undefined} canManage={canManage} />
        </div>
      )}
    </div>
  );
}

export default function AdminFoodMenuPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <FoodMenuContent />
      </Suspense>
    </ProtectedRoute>
  );
}
