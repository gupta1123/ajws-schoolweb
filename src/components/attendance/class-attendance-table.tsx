// src/components/attendance/class-attendance-table.tsx
//
// One row per class for the chosen day: how many came, as a bar you can scan
// down the page. The whole row opens that class's student-by-student view.

import Link from 'next/link';
import { useState } from 'react';
import { CalendarOff, ChevronRight, Search, Users } from 'lucide-react';
import type { ClassAttendanceSummary } from '@/lib/api/attendance';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Pill } from '@/components/ui/page-kit';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { surface, type } from '@/lib/design/tokens';
import { byGrade, classStatus, detailHref, rateTone, type ClassStatus } from './attendance-utils';

export type ClassFilter = 'all' | ClassStatus;

interface ClassAttendanceTableProps {
  classAttendanceList: ClassAttendanceSummary[];
  filter: ClassFilter;
  onFilterChange: (filter: ClassFilter) => void;
  loading?: boolean;
  selectedDate: string;
}

export function ClassAttendanceTable({ classAttendanceList, filter, onFilterChange, loading = false, selectedDate }: ClassAttendanceTableProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const counts: Record<ClassFilter, number> = {
    all: classAttendanceList.length,
    marked: classAttendanceList.filter((c) => classStatus(c) === 'marked').length,
    pending: classAttendanceList.filter((c) => classStatus(c) === 'pending').length,
    holiday: classAttendanceList.filter((c) => classStatus(c) === 'holiday').length,
  };
  const tabs: { key: ClassFilter; label: string }[] = [
    { key: 'all', label: t('attendanceMgmt.filters.all', 'All') },
    { key: 'marked', label: t('attendanceMgmt.filters.marked', 'Marked') },
    { key: 'pending', label: t('attendanceMgmt.filters.pending', 'Pending') },
    { key: 'holiday', label: t('attendanceMgmt.filters.holiday', 'Holiday') },
  ];

  const q = query.trim().toLowerCase();
  const rows = classAttendanceList
    .filter((c) => (filter === 'all' || classStatus(c) === filter) && (!q || c.class_name.toLowerCase().includes(q)))
    .sort(byGrade);

  return (
    <section className={cn(surface.panel, 'overflow-hidden')}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div role="tablist" className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(tab.key)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-tone-primary-soft font-medium text-tone-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn('text-xs tabular-nums', active ? 'text-tone-primary' : 'text-muted-foreground')}>{counts[tab.key]}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('attendanceMgmt.table.searchPlaceholder', 'Search classes...')}
            className="h-8 pl-8"
          />
        </div>
      </header>

      {loading && classAttendanceList.length === 0 ? (
        <ul className="divide-y" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-4 w-12" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Users />} title={t('attendanceMgmt.table.empty', 'No classes found matching your criteria')} />
      ) : (
        <ul className={cn('divide-y transition-opacity', loading && 'opacity-60')}>
          {rows.map((c) => {
            const status = classStatus(c);
            const tone = rateTone(c.attendance_percentage);
            return (
              <li key={c.class_division_id}>
                <Link
                  href={detailHref(c, selectedDate)}
                  className="group grid grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none md:grid-cols-[9rem_minmax(0,1fr)_4.5rem_1rem]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">{c.class_name}</p>
                    <p className={type.caption}>
                      {c.total_students > 0
                        ? t('attendanceMgmt.row.students', '{n} students').replace('{n}', String(c.total_students))
                        : t('attendanceMgmt.row.noStudents', 'No students')}
                    </p>
                  </div>

                  {status === 'marked' ? (
                    <div className="order-last col-span-3 space-y-1 md:order-none md:col-span-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${Math.min(100, Math.max(0, c.attendance_percentage))}%` }} />
                      </div>
                      <p className={type.caption}>
                        {t('attendanceMgmt.row.present', '{n} present').replace('{n}', String(c.present_count))}
                        {' · '}
                        <span className={c.absent_count > 0 ? 'text-tone-danger' : undefined}>
                          {t('attendanceMgmt.row.absent', '{n} absent').replace('{n}', String(c.absent_count))}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="order-last col-span-3 flex items-center gap-1.5 text-xs text-muted-foreground md:order-none md:col-span-1">
                      {status === 'holiday' ? <CalendarOff className="size-3.5 text-tone-violet" /> : <span className="size-1.5 rounded-full bg-tone-warning" aria-hidden />}
                      {status === 'holiday' ? t('attendanceMgmt.status.holiday', 'Holiday') : t('attendanceMgmt.row.notMarked', 'Not marked yet')}
                    </p>
                  )}

                  <div className="text-right">
                    {status === 'marked' ? (
                      <span className={cn('text-sm font-semibold tabular-nums', tone.text)}>{c.attendance_percentage.toFixed(0)}%</span>
                    ) : (
                      <Pill tone={status === 'holiday' ? 'violet' : 'warning'}>
                        {status === 'holiday' ? t('attendanceMgmt.status.holiday', 'Holiday') : t('attendanceMgmt.status.pending', 'Pending')}
                      </Pill>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
