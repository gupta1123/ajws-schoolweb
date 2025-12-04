// src/components/dashboard/metric-card.tsx

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  icon: ReactNode;
  loading?: boolean;
}

export const MetricCard = ({ label, value, icon, loading = false }: MetricCardProps) => {
  const hasValue = typeof value === 'number';

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading && !hasValue ? (
            <Skeleton className="mt-3 h-7 w-24" />
          ) : (
            <p className="mt-2 text-2xl font-semibold">
              {hasValue ? value.toLocaleString() : '—'}
            </p>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};
