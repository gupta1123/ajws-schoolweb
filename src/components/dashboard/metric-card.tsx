// src/components/dashboard/metric-card.tsx
// Thin wrapper kept for existing imports; the visual lives in the shared page kit.

import type { ReactNode } from 'react';
import { StatTile } from '@/components/ui/page-kit';

interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  icon: ReactNode;
  loading?: boolean;
}

export const MetricCard = ({ label, value, icon, loading = false }: MetricCardProps) => (
  <StatTile label={label} value={value} icon={icon} loading={loading} />
);
