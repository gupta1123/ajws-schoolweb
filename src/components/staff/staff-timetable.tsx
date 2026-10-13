// src/components/staff/staff-timetable.tsx
//
// A teacher's week at a glance: periods down the side, days across the top.
// Loaded only when the Timetable tab is opened.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { EmptyState, InlineError } from '@/components/ui/page-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { timetableApi, type TimetableEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { surface, type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

// Re-opening the tab (or the page) shouldn't re-download the same week.
type Week = Record<string, TimetableEntry[]>;
const cache = new Map<string, { at: number; data: Week }>();
const inflight = new Map<string, Promise<Week>>();
const CACHE_MS = 60_000;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function StaffTimetable({ teacherId }: { teacherId: string }) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const [byDay, setByDay] = useState<Record<string, TimetableEntry[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setError(null);
    const hit = cache.get(teacherId);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      setByDay(hit.data);
      return;
    }
    setByDay(null);
    // one request per teacher, even if the component mounts twice
    let request = inflight.get(teacherId);
    if (!request) {
      request = timetableApi.getTeacherTimetable(teacherId, token).then((r) => {
        if (r.status !== 'success') throw new Error(t('staff.timetable.failed', 'Could not load the timetable'));
        const data = r.data.timetable ?? {};
        cache.set(teacherId, { at: Date.now(), data });
        return data;
      });
      inflight.set(teacherId, request);
      const clear = () => inflight.delete(teacherId);
      request.then(clear, clear);
    }
    request.then((data) => !cancelled && setByDay(data)).catch((e) => !cancelled && setError(e instanceof Error ? e.message : t('staff.timetable.failed', 'Could not load the timetable')));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, teacherId, attempt]);

  const grid = useMemo(() => {
    if (!byDay) return null;
    const days = DAYS.filter((d) => (byDay[d]?.length ?? 0) > 0);
    const periods = Array.from(new Set(days.flatMap((d) => byDay[d].map((e) => e.period_number)))).sort((a, b) => a - b);
    return { days, periods };
  }, [byDay]);

  // Monday 1 Jan 2024, so Intl can name the days in the active language
  const dayLabel = (name: string) => new Date(2024, 0, 1 + DAYS.indexOf(name)).toLocaleDateString(lang, { weekday: 'short' });

  if (error) return <InlineError title={t('staff.timetable.failed', 'Could not load the timetable')} detail={error} onRetry={() => setAttempt((a) => a + 1)} retryLabel={t('actions.refresh', 'Refresh')} />;
  if (!grid) return <Skeleton className="h-56 w-full rounded-lg" />;
  if (grid.days.length === 0) {
    return <EmptyState icon={<CalendarDays />} title={t('staff.timetable.empty', 'No periods scheduled')} help={t('staff.timetable.emptyHelp', 'This teacher is not in the timetable yet.')} />;
  }

  const today = DAYS[(new Date().getDay() + 6) % 7];
  const lessons = grid.days.reduce((n, d) => n + (byDay?.[d]?.length ?? 0), 0);

  return (
    <div className={cn(surface.panel, 'overflow-hidden')}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className={type.sectionTitle}>{t('staff.timetable.weekly', 'Weekly schedule')}</h3>
        <span className={type.caption}>{t('staff.timetable.periodsCount', '{n} periods a week').replace('{n}', String(lessons))}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              <th className={cn('w-16 px-4 py-2 font-medium', type.caption)}>{t('staff.timetable.period', 'Period')}</th>
              {grid.days.map((d) => (
                <th key={d} className={cn('px-3 py-2 text-xs font-medium', d === today ? 'text-tone-primary' : 'text-muted-foreground')}>
                  {dayLabel(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.periods.map((p) => (
              <tr key={p} className="border-b last:border-0">
                <td className="px-4 py-2 align-middle">
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{p}</span>
                </td>
                {grid.days.map((d) => {
                  const e = byDay?.[d]?.find((x) => x.period_number === p);
                  const klass = e?.class_division ? `${e.class_division.class_level?.name ?? ''} ${e.class_division.division ?? ''}`.trim() : '';
                  // the backend labels subjects it can't resolve "Free Period", so only trust real names
                  const name = e ? e.subject_info?.display_name || e.subject_info?.name || e.subject : '';
                  const subject = name && !/free/i.test(name) ? name : '';
                  return (
                    <td key={d} className={cn('px-3 py-1.5 align-middle', d === today && 'bg-tone-primary-soft/40')}>
                      {e && klass ? (
                        <div className="inline-flex min-w-[4.5rem] flex-col rounded-md border border-tone-primary/20 bg-tone-primary-soft px-2 py-1">
                          <span className="text-xs font-semibold leading-tight text-tone-primary">{klass}</span>
                          {subject && <span className="text-[11px] leading-tight text-muted-foreground">{subject}</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
