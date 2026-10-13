// src/app/admin/attendance/[classId]/page.tsx

'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CalendarOff, ClipboardList, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { attendanceApi, type AttendanceStatusResponse, type StudentAttendanceRecord } from '@/lib/api/attendance';
import { parseISODate, toISODate } from '@/components/calendar/event-pickers';
import { useTopbarSlot } from '@/components/layout/topbar-slot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, InlineError, Pill } from '@/components/ui/page-kit';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { surface, type, type Tone } from '@/lib/design/tokens';

type Status = StudentAttendanceRecord['status'];
type Filter = 'all' | Status;

// exceptions first: those are what an admin opens this page to find
const ORDER: Status[] = ['absent', 'late', 'half_day', 'full_day'];
const TONE: Record<Status, Tone> = { full_day: 'success', absent: 'danger', late: 'warning', half_day: 'info' };
const DOT: Record<Status, string> = { full_day: 'bg-tone-success', absent: 'bg-tone-danger', late: 'bg-tone-warning', half_day: 'bg-tone-info' };

function Details() {
  const { classId } = useParams<{ classId: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { t, lang } = useI18n();

  const date = searchParams.get('date') || toISODate(new Date());
  const className = searchParams.get('name');

  const [data, setData] = useState<AttendanceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    if (!token || !classId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceApi.getAttendanceStatus(classId, date, token);
      if (response instanceof Blob) {
        setError(t('attendanceMgmt.details.failed', 'Failed to load attendance data'));
      } else if (response.status === 'success') {
        setData(response.data);
      } else {
        setError(response.message || t('attendanceMgmt.details.failed', 'Failed to load attendance data'));
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError(t('attendanceMgmt.details.failed', 'Failed to load attendance data'));
    } finally {
      setLoading(false);
    }
  }, [token, classId, date, t]);

  useEffect(() => {
    load();
  }, [load]);

  const label: Record<Status, string> = {
    full_day: t('attendanceMgmt.status.present', 'Present'),
    absent: t('attendanceMgmt.status.absent', 'Absent'),
    late: t('attendanceMgmt.status.late', 'Late'),
    half_day: t('attendanceMgmt.status.halfDay', 'Half Day'),
  };

  // the API reports a present student as 'present' in some responses and 'full_day' in others
  const records = useMemo(
    () => (data?.student_records ?? []).map((r) => ({ ...r, status: ((r.status as string) === 'present' ? 'full_day' : r.status) as Status })),
    [data]
  );
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: records.length, full_day: 0, absent: 0, late: 0, half_day: 0 };
    records.forEach((r) => {
      if (r.status in c) c[r.status] += 1;
    });
    return c;
  }, [records]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => (filter === 'all' || r.status === filter) && (!q || r.student?.full_name.toLowerCase().includes(q) || r.student?.admission_number.toLowerCase().includes(q)))
      .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (a.student?.full_name ?? '').localeCompare(b.student?.full_name ?? ''));
  }, [records, filter, query]);

  const dateLabel = (parseISODate(date) ?? new Date()).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tabs: Filter[] = ['all', ...ORDER.filter((s) => counts[s] > 0)];
  useTopbarSlot({
    title: `${t('topbar.attendanceDetails.title', 'Attendance Details')}: ${className || t('attendanceMgmt.details.title', 'Class attendance')}`,
    subtitle: dateLabel,
    actions: (
      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" onClick={load} disabled={loading} aria-label={t('actions.refresh', 'Refresh')} title={t('actions.refresh', 'Refresh')}>
        <RefreshCw className={cn(loading && 'animate-spin')} />
      </Button>
    ),
  });

  const cell = 'space-y-1 px-5 py-3.5';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {error ? (
        <div className="rounded-xl border">
          <InlineError title={error} onRetry={load} retryLabel={t('actions.refresh', 'Refresh')} />
        </div>
      ) : loading && !data ? (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : data?.is_holiday ? (
        <div className={surface.panel}>
          <EmptyState
            icon={<CalendarOff />}
            title={t('attendanceMgmt.status.holiday', 'Holiday')}
            help={data.holiday_reason || t('attendanceMgmt.details.noReason', 'No reason specified')}
          />
        </div>
      ) : records.length === 0 ? (
        <div className={surface.panel}>
          <EmptyState
            icon={<ClipboardList />}
            title={t('attendanceMgmt.details.notMarked', 'Attendance not marked')}
            help={t('attendanceMgmt.details.empty', 'No attendance records found for this date.')}
          />
        </div>
      ) : (
        <>
          <div className={cn(surface.panel, 'grid grid-cols-2 divide-x divide-y sm:grid-cols-5 sm:divide-y-0 [&>*:nth-child(odd)]:border-l-0')}>
            {([['all', t('attendanceMgmt.details.totalStudents', 'Total Students')], ...ORDER.map((s) => [s, label[s]])] as [Filter, string][]).map(([key, text]) => (
              <div key={key} className={cell}>
                <p className={type.label}>{text}</p>
                <p
                  className={cn(
                    'text-2xl font-semibold tabular-nums leading-none',
                    key === 'absent' && counts.absent > 0 && 'text-tone-danger',
                    key === 'late' && counts.late > 0 && 'text-tone-warning'
                  )}
                >
                  {counts[key]}
                </p>
              </div>
            ))}
          </div>

          <section className={cn(surface.panel, 'overflow-hidden')}>
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
              <div role="tablist" className="flex flex-wrap items-center gap-1">
                {tabs.map((key) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active ? 'bg-tone-primary-soft font-medium text-tone-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {key === 'all' ? t('attendanceMgmt.filters.all', 'All') : label[key]}
                      <span className="text-xs tabular-nums">{counts[key]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('attendanceMgmt.details.searchStudents', 'Search students...')}
                  className="h-8 pl-8"
                />
              </div>
            </header>

            {rows.length === 0 ? (
              <EmptyState icon={<Users />} title={t('attendanceMgmt.details.noMatch', 'No students match.')} />
            ) : (
              <ul className={cn('divide-y transition-opacity', loading && 'opacity-60')}>
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-2.5 md:grid-cols-[4.5rem_minmax(0,1.2fr)_5.5rem_minmax(0,1fr)_9rem]"
                  >
                    <p className="order-2 text-xs tabular-nums text-muted-foreground md:order-none md:text-sm">{r.student?.admission_number}</p>
                    <p className="order-1 flex min-w-0 items-center gap-2 text-sm font-medium md:order-none">
                      <span className={cn('size-2 shrink-0 rounded-full', DOT[r.status] ?? 'bg-muted-foreground')} aria-hidden />
                      <span className="truncate">{r.student?.full_name || t('attendanceMgmt.details.unknown', 'Unknown student')}</span>
                    </p>
                    <span className="order-3 justify-self-end md:order-none md:justify-self-start">
                      <Pill tone={TONE[r.status] ?? 'neutral'}>{label[r.status] ?? r.status}</Pill>
                    </span>
                    <p className="order-4 col-span-2 truncate text-xs text-muted-foreground empty:hidden md:order-none md:col-span-1">{r.remarks}</p>
                    <p className="hidden truncate text-xs text-muted-foreground md:block">
                      {r.marked_by_name || r.marked_by_user?.full_name || ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function AttendanceDetailsPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={null}>
      <Details />
    </Suspense>
  );
}
