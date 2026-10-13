// src/app/(teacher)/timetable/page.tsx

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/page-kit';
import { useTimetable } from '@/hooks/use-timetable';
import { useI18n } from '@/lib/i18n/context';
import { periodStartTime, subjectBar, subjectSoft, subjectText } from '@/components/timetable/timetable-grid';
import { surface, type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function TimetablePage() {
  const { user } = useAuth();
  const { timetableData, loading, error, refreshTimetable } = useTimetable();
  const { t } = useI18n();

  const todayKey = DAY_KEYS[(new Date().getDay() || 7) - 1] ?? 'Monday';
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  const timetable = timetableData?.timetable;

  // Show Saturday only if the teacher actually teaches on it
  const days = useMemo(
    () => DAY_KEYS.filter((d) => d !== 'Saturday' || (timetable?.Saturday?.length ?? 0) > 0),
    [timetable]
  );
  const periodCount = useMemo(() => {
    const all = Object.values(timetable ?? {}).flat();
    return Math.max(6, ...all.map((e) => e.period_number));
  }, [timetable]);
  const total = useMemo(() => Object.values(timetable ?? {}).flat().length, [timetable]);

  if (user?.role !== 'teacher') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState
          title={t('access.deniedTitle', 'Access Denied')}
          help={t('access.teachersOnlyPage', 'Only teachers can access this page.')}
        />
      </div>
    );
  }

  const dayLabel = (d: string) => t(`days.${d.toLowerCase()}`, d);
  const classLabel = (e: { class_division?: { class_level: { name: string }; division: string }; class_division_id: string }) =>
    e.class_division ? `${e.class_division.class_level.name} ${e.class_division.division}` : `Class ${e.class_division_id}`;

  const renderCell = (day: string, period: number) => {
    const entry = (timetable?.[day] || []).find((e) => e.period_number === period);
    if (!entry) return <div className="h-full min-h-[3.75rem]" />;
    return (
      <div className={cn('flex h-full min-h-[3.75rem] overflow-hidden rounded-lg', subjectSoft(entry.subject))}>
        <span aria-hidden className={cn('w-1 shrink-0', subjectBar(entry.subject))} />
        <div className="min-w-0 px-2.5 py-1.5">
          <p className={cn('truncate text-sm font-semibold leading-tight', subjectText(entry.subject))}>{entry.subject}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{classLabel(entry)}</p>
        </div>
      </div>
    );
  };

  const body = () => {
    if (loading) return <Skeleton className="h-96 w-full" />;
    if (error) {
      return (
        <div className={surface.panel}>
          <EmptyState
            icon={<AlertCircle />}
            title={t('timetableTeacher.errorTitle', 'Error Loading Timetable')}
            help={
              <span className="flex flex-col items-center gap-3">
                {error}
                <Button onClick={refreshTimetable} variant="outline" size="sm">
                  <RefreshCw />
                  {t('timetableTeacher.tryAgain', 'Try Again')}
                </Button>
              </span>
            }
          />
        </div>
      );
    }
    if (total === 0) {
      return (
        <div className={surface.panel}>
          <EmptyState
            icon={<CalendarDays />}
            title={t('timetableTeacher.noClasses', 'No Classes Scheduled')}
            help={t('timetableTeacher.subtitle', 'Your weekly teaching schedule')}
          />
        </div>
      );
    }

    const periods = Array.from({ length: periodCount }, (_, i) => i + 1);
    return (
      <>
        {/* Desktop: full week */}
        <div className="hidden overflow-x-auto rounded-xl border md:block">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-24 px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t('timetableTeacher.table.period', 'Period')}</th>
                {days.map((d) => (
                  <th key={d} className={cn('px-2 py-2 text-center text-xs font-semibold', d === todayKey ? 'text-tone-primary' : 'text-muted-foreground')}>
                    {dayLabel(d)}
                    {d === todayKey && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {periods.map((p) => (
                <tr key={p}>
                  <th scope="row" className="px-3 text-left align-middle">
                    <span className="block text-sm font-semibold">P{p}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">{periodStartTime(p)}</span>
                  </th>
                  {days.map((d) => (
                    <td key={d} className={cn('p-1 align-top', d === todayKey && 'bg-tone-primary-soft/30')}>
                      {renderCell(d, p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: one day at a time */}
        <div className="space-y-3 md:hidden">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {days.map((d) => {
              const count = timetable?.[d]?.length ?? 0;
              const active = selectedDay === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-primary font-medium text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  {dayLabel(d).slice(0, 3)}
                  <span className="text-xs tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          {(timetable?.[selectedDay]?.length ?? 0) === 0 ? (
            <p className="rounded-xl border px-4 py-8 text-center text-sm text-muted-foreground">
              {t('timetableTeacher.noClassesDesc', 'You have no classes scheduled for {day}').replace('{day}', dayLabel(selectedDay))}
            </p>
          ) : (
            <ul className="space-y-2">
              {[...(timetable?.[selectedDay] ?? [])]
                .sort((a, b) => a.period_number - b.period_number)
                .map((e) => (
                  <li key={e.id} className="flex items-stretch gap-3">
                    <div className="w-16 shrink-0 pt-1.5">
                      <p className="text-sm font-semibold">P{e.period_number}</p>
                      <p className="text-[11px] text-muted-foreground">{periodStartTime(e.period_number)}</p>
                    </div>
                    <div className="min-w-0 flex-1">{renderCell(selectedDay, e.period_number)}</div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </>
    );
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className={type.pageSubtitle}>
            {(timetableData?.teacher?.full_name || t('common.teacher', 'Teacher')) + ' · ' + t('timetableTeacher.weekly', 'Weekly Schedule')}
          </p>
          <Button onClick={refreshTimetable} variant="outline" size="icon" aria-label={t('actions.refresh', 'Refresh')} title={t('actions.refresh', 'Refresh')} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
        {body()}
      </div>
    </ProtectedRoute>
  );
}
