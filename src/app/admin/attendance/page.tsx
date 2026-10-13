// src/app/admin/attendance/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RefreshCw, TriangleAlert } from 'lucide-react';
import { usePrincipalAttendance } from '@/hooks/use-principal-attendance';
import { AttendanceOverviewCards } from '@/components/attendance/attendance-overview-cards';
import { ClassAttendanceTable, type ClassFilter } from '@/components/attendance/class-attendance-table';
import { byGrade, classStatus, detailHref } from '@/components/attendance/attendance-utils';
import { DateField, parseISODate, toISODate } from '@/components/calendar/event-pickers';
import { InlineError } from '@/components/ui/page-kit';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

const shiftDay = (iso: string, days: number) => {
  const d = parseISODate(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export default function AdminAttendancePage() {
  const { t } = useI18n();
  const { allClassesSummary, loading, error, selectedDate, setSelectedDate, loadAllClassesSummary, classAttendanceList } = usePrincipalAttendance();
  const [filter, setFilter] = useState<ClassFilter>('all');

  const today = toISODate(new Date());
  const pending = classAttendanceList.filter((c) => classStatus(c) === 'pending').sort(byGrade);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* Day picker */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="size-9" onClick={() => setSelectedDate(shiftDay(selectedDate, -1))} aria-label={t('attendanceMgmt.prevDay', 'Previous day')}>
            <ChevronLeft />
          </Button>
          <div className="w-52">
            <DateField id="attendance-date" value={selectedDate} onChange={(v) => v && setSelectedDate(v)} />
          </div>
          <Button variant="outline" size="icon" className="size-9" onClick={() => setSelectedDate(shiftDay(selectedDate, 1))} aria-label={t('attendanceMgmt.nextDay', 'Next day')}>
            <ChevronRight />
          </Button>
          {selectedDate !== today && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>
              {t('attendanceMgmt.today', 'Today')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {allClassesSummary?.academic_year && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{allClassesSummary.academic_year}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => loadAllClassesSummary(selectedDate)} disabled={loading}>
            <RefreshCw className={cn(loading && 'animate-spin')} />
            {t('actions.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border">
          <InlineError
            title={error}
            onRetry={() => loadAllClassesSummary(selectedDate)}
            retryLabel={t('actions.refresh', 'Refresh')}
          />
        </div>
      ) : (
        <>
          <AttendanceOverviewCards classes={classAttendanceList} loading={loading} />

          {pending.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-tone-warning-soft px-4 py-2.5 text-sm">
              <TriangleAlert className="size-4 shrink-0 text-tone-warning" />
              <p className="font-medium text-tone-warning">
                {pending.length === 1
                  ? t('attendanceMgmt.banner.one', "1 class hasn't marked attendance")
                  : t('attendanceMgmt.banner.many', "{n} classes haven't marked attendance").replace('{n}', String(pending.length))}
              </p>
              <ul className="flex flex-1 flex-wrap items-center gap-1.5">
                {pending.slice(0, 6).map((c) => (
                  <li key={c.class_division_id}>
                    <Link
                      href={detailHref(c, selectedDate)}
                      className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.class_name}
                    </Link>
                  </li>
                ))}
                {pending.length > 6 && <li className="text-xs text-muted-foreground">+{pending.length - 6}</li>}
              </ul>
              {filter !== 'pending' && (
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className="text-xs font-medium text-tone-warning underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('attendanceMgmt.banner.show', 'Show pending')}
                </button>
              )}
            </div>
          )}

          <ClassAttendanceTable classAttendanceList={classAttendanceList} filter={filter} onFilterChange={setFilter} loading={loading} selectedDate={selectedDate} />
        </>
      )}
    </div>
  );
}
