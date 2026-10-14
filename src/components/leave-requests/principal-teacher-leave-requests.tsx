'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, GraduationCap, Inbox, Loader2, Search, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { leaveRequestServices } from '@/lib/api/leave-requests';
import type { LeaveRequestPagination, TeacherLeaveRequest } from '@/types/leave-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, IconChip, InlineError, Pill, PanelSkeleton } from '@/components/ui/page-kit';
import { surface, type, type Tone } from '@/lib/design/tokens';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type StatusFilter = 'all' | TeacherLeaveRequest['status'];

const statusTone: Record<TeacherLeaveRequest['status'], Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const initialsOf = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const dayCount = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

export function PrincipalTeacherLeaveRequests({
  onShowStudentLeaves,
}: {
  onShowStudentLeaves: () => void;
}) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TeacherLeaveRequest[]>([]);
  const [pagination, setPagination] = useState<LeaveRequestPagination | null>(null);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(new Set());

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await leaveRequestServices.listTeacherLeaves(
        {
          status: status === 'all' ? undefined : status,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          page,
          limit: 20,
        },
        token
      );

      if (response instanceof Blob) {
        setRequests([]);
        setError(t('leave.teacher.adminFetchError', 'Failed to load teacher leave requests.'));
        return;
      }

      if (!('data' in response)) {
        setRequests([]);
        setError(response.message || t('leave.teacher.adminFetchError', 'Failed to load teacher leave requests.'));
        return;
      }

      setRequests(response.data.leave_requests || []);
      setPagination(response.data.pagination || null);
    } catch (caught) {
      setRequests([]);
      setError(
        caught instanceof Error
          ? caught.message
          : t('leave.teacher.adminFetchError', 'Failed to load teacher leave requests.')
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, page, status, t, toDate, token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const reviewRequest = async (request: TeacherLeaveRequest, nextStatus: 'approved' | 'rejected') => {
    if (!token || request.status !== 'pending') return;
    setReviewingIds((current) => new Set(current).add(request.id));
    setError(null);

    try {
      const response = await leaveRequestServices.reviewTeacherLeave(request.id, nextStatus, token);
      if (!('data' in response)) {
        setError(response.message || t('leave.teacher.reviewError', 'Failed to review teacher leave request.'));
        return;
      }

      setRequests((current) =>
        status === 'pending'
          ? current.filter((item) => item.id !== request.id)
          : current.map((item) => (item.id === request.id ? response.data.leave_request : item))
      );
      toast({
        title: t('common.success', 'Success'),
        description:
          nextStatus === 'approved'
            ? t('leave.teacher.approved', 'Teacher leave request approved.')
            : t('leave.teacher.rejected', 'Teacher leave request rejected.'),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('leave.teacher.reviewError', 'Failed to review teacher leave request.')
      );
    } finally {
      setReviewingIds((current) => {
        const next = new Set(current);
        next.delete(request.id);
        return next;
      });
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter(
      (request) =>
        (request.teacher?.full_name || '').toLowerCase().includes(query) ||
        request.reason.toLowerCase().includes(query)
    );
  }, [requests, search]);

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasFilters = !!(search || fromDate || toDate);
  const statuses: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: t('leave.status.pending', 'Pending') },
    { key: 'approved', label: t('leave.status.approved', 'Approved') },
    { key: 'rejected', label: t('leave.status.rejected', 'Rejected') },
    { key: 'all', label: t('leave.filters.allStatuses', 'All') },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="inline-flex rounded-lg border bg-muted/30 p-1" aria-label={t('leave.audience', 'Leave request type')}>
        <button
          type="button"
          onClick={onShowStudentLeaves}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <GraduationCap className="size-4" />
          {t('leave.studentLeaves', 'Student Leaves')}
        </button>
        <button
          type="button"
          aria-current="page"
          className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
        >
          <Users className="size-4" />
          {t('leave.teacherLeaves', 'Teacher Leaves')}
        </button>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1 border-b">
        {statuses.map((item) => {
          const active = item.key === status;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(item.key);
                setPage(1);
              }}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
            placeholder={t('leave.teacher.search', 'Search teacher or reason')}
          />
        </div>
        <Input
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={(event) => {
            setFromDate(event.target.value);
            setPage(1);
          }}
          className="h-9 w-auto"
          aria-label={t('leave.filters.startDate', 'Start date')}
        />
        <span className={type.caption}>{t('pagination.to', 'to')}</span>
        <Input
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(event) => {
            setToDate(event.target.value);
            setPage(1);
          }}
          className="h-9 w-auto"
          aria-label={t('leave.filters.endDate', 'End date')}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="size-3.5" />
            {t('students.clearFilters', 'Clear filters')}
          </button>
        )}
      </div>

      <section className={cn(surface.panel, 'overflow-hidden')}>
        {loading && requests.length === 0 ? (
          <PanelSkeleton rows={4} />
        ) : error ? (
          <InlineError
            title={t('leave.teacher.adminFetchError', 'Failed to load teacher leave requests.')}
            detail={error}
            onRetry={fetchRequests}
            retryLabel={t('common.retry', 'Try again')}
          />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title={t('leave.teacher.noRequests', 'No teacher leave requests found')}
            help={t('leave.teacher.noRequestsHelp', 'New requests submitted by teachers will appear here.')}
          />
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,15rem)_11rem_minmax(0,1fr)_auto] gap-4 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
              <span>{t('common.teacher', 'Teacher')}</span>
              <span>{t('leave.columns.dates', 'Dates')}</span>
              <span>{t('leave.columns.reason', 'Reason')}</span>
              <span className="text-right">{t('leave.columns.actions', 'Actions')}</span>
            </div>
            <ul className="divide-y">
              {filteredRequests.map((request) => {
                const teacherName = request.teacher?.full_name || t('leave.unknownTeacher', 'Unknown teacher');
                const days = dayCount(request.start_date, request.end_date);
                const reviewing = reviewingIds.has(request.id);
                return (
                  <li
                    key={request.id}
                    className={cn(
                      'flex flex-col gap-2 px-4 py-3 lg:grid lg:grid-cols-[minmax(0,15rem)_11rem_minmax(0,1fr)_auto] lg:items-center lg:gap-4',
                      surface.rowHover
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip className="size-8 rounded-full text-xs font-semibold">
                        {initialsOf(teacherName)}
                      </IconChip>
                      <div className="min-w-0">
                        <p className={cn(type.rowTitle, 'truncate')}>{teacherName}</p>
                        <p className={type.caption}>{t('roles.teacher', 'Teacher')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
                        <CalendarDays className="size-3.5 text-muted-foreground" />
                        {formatDate(request.start_date)}
                      </p>
                      <p className={cn(type.caption, 'tabular-nums')}>
                        {request.start_date.slice(0, 10) === request.end_date.slice(0, 10)
                          ? `${days} ${t('leave.day', 'day')}`
                          : `${t('pagination.to', 'to')} ${formatDate(request.end_date)} · ${days} ${t('leave.days', 'days')}`}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm">{request.reason}</p>
                      <p className={cn(type.caption, 'mt-0.5')}>
                        {t('leave.requestedOn', 'Requested')} {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {request.status === 'pending' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={reviewing}
                            onClick={() => reviewRequest(request, 'rejected')}
                            className="text-tone-danger hover:text-tone-danger"
                          >
                            <X />
                            {t('leave.actions.reject', 'Reject')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={reviewing}
                            onClick={() => reviewRequest(request, 'approved')}
                          >
                            {reviewing ? <Loader2 className="animate-spin" /> : <Check />}
                            {t('leave.actions.approve', 'Approve')}
                          </Button>
                        </>
                      ) : (
                        <Pill tone={statusTone[request.status]}>
                          {t(`leave.status.${request.status}`, request.status)}
                        </Pill>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className={type.caption}>
            {t('pagination.page', 'Page')} {pagination.page} {t('pagination.of', 'of')} {pagination.total_pages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!pagination.has_prev || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('pagination.previous', 'Previous')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!pagination.has_next || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('pagination.next', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
