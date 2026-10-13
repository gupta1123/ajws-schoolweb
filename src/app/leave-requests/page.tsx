// src/app/leave-requests/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState, Field, IconChip, InlineError, Pill } from '@/components/ui/page-kit';
import { surface, type, type Tone } from '@/lib/design/tokens';
import { Search, Check, X, Loader2, Inbox, Phone, Mail, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useLayoutEffect, Suspense } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useLeaveRequests } from '@/hooks/use-leave-requests';
import { useSearchParams } from 'next/navigation';
import { cn, formatDate } from '@/lib/utils';
import { TeacherLeaveRequests } from '@/components/leave-requests/teacher-leave-requests';
import type { LeaveRequest } from '@/types/leave-requests';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type RangePreset = 'any' | 'month' | 'custom';

const statusTone: Record<LeaveRequest['status'], Tone> = {
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

const toISO = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const dayCount = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
};

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-IN', opts);

/** "29 Sep", "27 – 29 Sep", "30 Sep – 2 Oct" (+ year when not the current year). */
const formatRange = (startStr: string, endStr: string) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const thisYear = new Date().getFullYear();
  const yr = (d: Date) => (d.getFullYear() !== thisYear ? ` ${d.getFullYear()}` : '');
  if (start.toDateString() === end.toDateString()) {
    return `${fmt(start, { day: 'numeric', month: 'short' })}${yr(start)}`;
  }
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${fmt(end, { day: 'numeric', month: 'short' })}${yr(end)}`;
  }
  return `${fmt(start, { day: 'numeric', month: 'short' })}${yr(start)} – ${fmt(end, { day: 'numeric', month: 'short' })}${yr(end)}`;
};

const rowGrid = 'lg:grid lg:grid-cols-[minmax(0,15rem)_9.5rem_minmax(0,1fr)_auto] lg:items-center lg:gap-x-4';

/** Reason text clamped to 2 lines; shows a toggle only when it actually overflows. */
function ExpandableReason({ text }: { text: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="min-w-0">
      <p ref={ref} className={cn('whitespace-pre-wrap break-words text-sm', !expanded && 'line-clamp-2')}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-0.5 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? t('leave.showLess', 'Show less') : t('leave.showMore', 'Show more')}
        </button>
      )}
    </div>
  );
}

const selectClass =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

// Component that uses useSearchParams - must be wrapped in Suspense
function LeaveRequestsContent() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [classFilter, setClassFilter] = useState('all');
  const [rangePreset, setRangePreset] = useState<RangePreset>('any');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get student ID from URL params if filtering by student
  const studentId = searchParams.get('studentId');

  const { leaveRequests, loading, error, fetchLeaveRequests, approveLeaveRequest, rejectLeaveRequest, clearError } =
    useLeaveRequests({ autoFetch: false });

  // Date range sent to the API (status is filtered client-side so tab counts stay accurate)
  const dateRange = useMemo(() => {
    if (rangePreset === 'month') {
      const now = new Date();
      return {
        start: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    }
    if (rangePreset === 'custom' && customRange.start && customRange.end) return customRange;
    return { start: '', end: '' };
  }, [rangePreset, customRange]);

  const handleStartDateChange = (value: string) =>
    setCustomRange((prev) => ({ start: value, end: prev.end && prev.end < value ? value : prev.end || value }));
  const handleEndDateChange = (value: string) =>
    setCustomRange((prev) => ({ end: value, start: prev.start && prev.start > value ? value : prev.start || value }));

  // Fetch data when filters change
  useEffect(() => {
    if (user?.role === 'teacher') return;
    const params: { student_id?: string; start_date?: string; end_date?: string } = {};
    if (studentId) params.student_id = studentId;
    if (dateRange.start && dateRange.end) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }
    fetchLeaveRequests(params);
  }, [studentId, dateRange.start, dateRange.end, fetchLeaveRequests, user?.role]);

  const classLabelOf = (request: LeaveRequest) => {
    const division = request.student?.student_academic_records?.[0]?.class_division;
    if (!division) return null;
    return division.level?.name
      ? `${division.level.name} - ${t('timetable.section')} ${division.division}`
      : `${t('timetable.section')} ${division.division}`;
  };

  const classKeyOf = (request: LeaveRequest) =>
    request.student?.student_academic_records?.[0]?.class_division?.id || '';

  const withStudent = useMemo(() => leaveRequests.filter((r) => r.student), [leaveRequests]);

  const availableClasses = useMemo(() => {
    const map = new Map<string, string>();
    withStudent.forEach((r) => {
      const key = classKeyOf(r);
      const label = classLabelOf(r);
      if (key && label) map.set(key, label);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withStudent, t]);

  const counts = useMemo(
    () => ({
      all: withStudent.length,
      pending: withStudent.filter((r) => r.status === 'pending').length,
      approved: withStudent.filter((r) => r.status === 'approved').length,
      rejected: withStudent.filter((r) => r.status === 'rejected').length,
    }),
    [withStudent]
  );

  const filteredLeaveRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return withStudent.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (classFilter !== 'all' && classKeyOf(r) !== classFilter) return false;
      if (!q) return true;
      return (
        (r.student?.full_name || '').toLowerCase().includes(q) ||
        (classLabelOf(r) || '').toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withStudent, statusFilter, classFilter, searchTerm, t]);

  const flash = (type: 'success' | 'error', message: string) => {
    setActionMessage({ type, message });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const markProcessing = (id: string, on: boolean) =>
    setProcessingRequests((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <EmptyState
        title={t('auth.required', 'Authentication Required')}
        help={t('leave.loginToAccess')}
      />
    );
  }

  // Allow admins, principals, and teachers to access this page.
  if (user?.role !== 'admin' && user?.role !== 'principal' && user?.role !== 'teacher') {
    return <EmptyState title={t('access.deniedTitle', 'Access Denied')} help={t('leave.noPermission')} />;
  }

  // Teachers use the self-service API and can manage only their own pending
  // requests. Admin/principal approval behavior below remains unchanged.
  if (user.role === 'teacher') {
    return (
      <ProtectedRoute>
        <TeacherLeaveRequests />
      </ProtectedRoute>
    );
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      markProcessing(requestId, true);
      const success = await approveLeaveRequest(requestId);
      flash(success ? 'success' : 'error', t(success ? 'leave.actions.approveSuccess' : 'leave.actions.approveError'));
    } catch (err) {
      console.error('Error approving request:', err);
      flash('error', t('leave.actions.approveGenericError'));
    } finally {
      markProcessing(requestId, false);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setRequestToReject(requestId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const confirmRejectRequest = async () => {
    if (!requestToReject || !rejectReason.trim()) return;
    try {
      markProcessing(requestToReject, true);
      const success = await rejectLeaveRequest(requestToReject, rejectReason.trim());
      flash(success ? 'success' : 'error', t(success ? 'leave.actions.rejectSuccess' : 'leave.actions.rejectError'));
      if (success) {
        setRejectModalOpen(false);
        setRejectReason('');
        setRequestToReject(null);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      flash('error', t('leave.actions.rejectGenericError'));
    } finally {
      markProcessing(requestToReject, false);
    }
  };

  const cancelRejectRequest = () => {
    setRejectModalOpen(false);
    setRejectReason('');
    setRequestToReject(null);
  };

  const selectedIndex = filteredLeaveRequests.findIndex((r) => r.id === selectedId);
  const selected = selectedIndex >= 0 ? filteredLeaveRequests[selectedIndex] : null;

  const today = new Date();
  const isOnLeaveToday = (r: LeaveRequest) =>
    r.status !== 'rejected' && new Date(r.start_date) <= today && new Date(r.end_date) >= today;

  const hasFilters = !!(searchTerm || classFilter !== 'all' || rangePreset !== 'any');
  const clearFilters = () => {
    setSearchTerm('');
    setClassFilter('all');
    setRangePreset('any');
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: t('leave.status.pending', 'Pending') },
    { key: 'approved', label: t('leave.status.approved', 'Approved') },
    { key: 'rejected', label: t('leave.status.rejected', 'Rejected') },
    { key: 'all', label: t('leave.filters.allStatuses', 'All') },
  ];

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* Status tabs with counts */}
        <div role="tablist" className="flex flex-wrap gap-1 border-b">
          {tabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-5',
                    active ? 'bg-tone-primary-soft text-tone-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {loading && leaveRequests.length === 0 ? '–' : counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('leave.searchPlaceholder')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('leave.searchPlaceholder')}
            />
          </div>
          <select
            className={cn(selectClass, 'max-w-[14rem]')}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label={t('leave.filters.class')}
          >
            <option value="all">{t('leave.filters.allClasses')}</option>
            {availableClasses.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value as RangePreset)}
            aria-label={t('leave.columns.dates')}
          >
            <option value="any">{t('leave.range.any', 'Any dates')}</option>
            <option value="month">{t('leave.range.month', 'This month')}</option>
            <option value="custom">{t('leave.range.custom', 'Custom range')}</option>
          </select>
          {rangePreset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                className="h-9 w-auto text-sm"
                value={customRange.start}
                onChange={(e) => handleStartDateChange(e.target.value)}
                aria-label={t('leave.filters.startDate')}
              />
              <span className={type.caption}>{t('pagination.to', 'to')}</span>
              <Input
                type="date"
                className="h-9 w-auto text-sm"
                value={customRange.end}
                onChange={(e) => handleEndDateChange(e.target.value)}
                aria-label={t('leave.filters.endDate')}
              />
            </div>
          )}
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

        {actionMessage && (
          <div
            role="status"
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium',
              actionMessage.type === 'success'
                ? 'border-tone-success/30 bg-tone-success-soft text-tone-success'
                : 'border-tone-danger/30 bg-tone-danger-soft text-tone-danger'
            )}
          >
            {actionMessage.message}
            <button onClick={() => setActionMessage(null)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        )}

        {error && (
          <section className={surface.panel}>
            <InlineError title={error} onRetry={clearError} retryLabel={t('common.dismiss', 'Dismiss')} />
          </section>
        )}

        {/* Request list */}
        <section className={cn(surface.panel, 'overflow-hidden')}>
          {loading && leaveRequests.length === 0 ? (
            <ul className="divide-y">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li key={idx} className="flex items-start gap-3 px-4 py-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-8 w-40" />
                </li>
              ))}
            </ul>
          ) : filteredLeaveRequests.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title={
                statusFilter === 'pending' && !hasFilters
                  ? t('leave.empty.caughtUp', 'No pending requests')
                  : t('leave.empty.title')
              }
              help={
                hasFilters || statusFilter !== 'pending'
                  ? t('leave.empty.adjust')
                  : t('leave.empty.caughtUpHelp', 'New requests from parents will show up here.')
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  rowGrid,
                  'hidden border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
                )}
              >
                <span>{t('leave.columns.student')}</span>
                <span>{t('leave.columns.dates')}</span>
                <span>{t('leave.columns.reason')}</span>
                <span className="text-right">{t('leave.columns.actions')}</span>
              </div>
              <ul className="divide-y">
                {filteredLeaveRequests.map((request) => {
                  const classLabel = classLabelOf(request);
                  const days = dayCount(request.start_date, request.end_date);
                  const busy = processingRequests.has(request.id);
                  const weekday =
                    days === 1 ? fmt(new Date(request.start_date), { weekday: 'short' }) : null;
                  return (
                    <li
                      key={request.id}
                      onClick={() => setSelectedId(request.id)}
                      className={cn(rowGrid, 'flex cursor-pointer flex-col gap-2 px-4 py-3', surface.rowHover)}
                    >
                      {/* Student */}
                      <div className="flex min-w-0 items-center gap-3">
                        <IconChip className="size-8 rounded-full text-xs font-semibold">
                          {initialsOf(request.student?.full_name)}
                        </IconChip>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(request.id);
                            }}
                            className={cn(type.rowTitle, 'block max-w-full truncate text-left hover:text-primary hover:underline')}
                          >
                            {request.student?.full_name || t('leave.unknownStudent')}
                          </button>
                          <p className={cn(type.caption, 'truncate')}>{classLabel || t('students.na', 'N/A')}</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-baseline gap-2 lg:block">
                        <p className="text-sm font-medium tabular-nums">
                          {formatRange(request.start_date, request.end_date)}
                        </p>
                        <p className={cn(type.caption, 'tabular-nums')}>
                          {weekday ? `${weekday} · ` : ''}
                          {days} {days === 1 ? t('leave.day', 'day') : t('leave.days', 'days')}
                        </p>
                      </div>

                      {/* Reason */}
                      <div className="min-w-0">
                        <ExpandableReason text={request.reason} />
                        <p className={cn(type.caption, 'mt-0.5')}>
                          {t('leave.requestedOn', 'Requested')} {formatDate(request.created_at)}
                        </p>
                      </div>

                      {/* Status / actions */}
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {isOnLeaveToday(request) && <Pill tone="warning">{t('leave.currentlyOnLeave')}</Pill>}
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={busy}
                              className="text-tone-danger hover:text-tone-danger"
                            >
                              <X />
                              {t('leave.actions.reject', 'Reject')}
                            </Button>
                            <Button size="sm" onClick={() => handleApproveRequest(request.id)} disabled={busy}>
                              {busy ? <Loader2 className="animate-spin" /> : <Check />}
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

        {/* Detail side panel */}
        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
            {selected && (
              <>
                <SheetHeader className="space-y-1 border-b p-4 pr-12">
                  <div className="flex items-center gap-3">
                    <IconChip className="size-10 rounded-full text-sm font-semibold">
                      {initialsOf(selected.student?.full_name)}
                    </IconChip>
                    <div className="min-w-0">
                      <SheetTitle className="truncate text-base">
                        {selected.student?.full_name || t('leave.unknownStudent')}
                      </SheetTitle>
                      <SheetDescription className="truncate">
                        {classLabelOf(selected) || t('students.na', 'N/A')}
                        {selected.student?.admission_number ? ` · ${selected.student.admission_number}` : ''}
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Pill tone={statusTone[selected.status]}>
                      {t(`leave.status.${selected.status}`, selected.status)}
                    </Pill>
                    {selected.urgency === 'urgent' && <Pill tone="danger">{t('leave.urgent', 'urgent')}</Pill>}
                    {isOnLeaveToday(selected) && <Pill tone="warning">{t('leave.currentlyOnLeave')}</Pill>}
                  </div>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto p-4">
                  <dl className="grid grid-cols-2 gap-4">
                    <Field
                      label={t('leave.columns.dates')}
                      value={formatRange(selected.start_date, selected.end_date)}
                      hint={`${dayCount(selected.start_date, selected.end_date)} ${
                        dayCount(selected.start_date, selected.end_date) === 1 ? t('leave.day', 'day') : t('leave.days', 'days')
                      }`}
                    />
                    <Field label={t('leave.columns.requestedDate')} value={formatDate(selected.created_at)} />
                  </dl>

                  <div>
                    <p className={type.label}>{t('leave.columns.reason')}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{selected.reason}</p>
                    {selected.additional_notes && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {selected.additional_notes}
                      </p>
                    )}
                  </div>

                  {selected.parent && (
                    <div className="rounded-lg border p-3">
                      <p className={type.label}>{t('leave.parent', 'Parent')}</p>
                      <p className="mt-1 text-sm font-medium">{selected.parent.full_name}</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        {selected.parent.phone_number && (
                          <a href={`tel:${selected.parent.phone_number}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Phone className="size-3.5" />
                            {selected.parent.phone_number}
                          </a>
                        )}
                        {selected.parent.email && (
                          <a href={`mailto:${selected.parent.email}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Mail className="size-3.5" />
                            <span className="truncate">{selected.parent.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={selectedIndex <= 0}
                      onClick={() => setSelectedId(filteredLeaveRequests[selectedIndex - 1].id)}
                      aria-label={t('pagination.previous', 'Previous')}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={selectedIndex < 0 || selectedIndex >= filteredLeaveRequests.length - 1}
                      onClick={() => setSelectedId(filteredLeaveRequests[selectedIndex + 1].id)}
                      aria-label={t('pagination.next', 'Next')}
                    >
                      <ChevronDown />
                    </Button>
                    <span className={cn(type.caption, 'ml-1 tabular-nums')}>
                      {selectedIndex + 1} / {filteredLeaveRequests.length}
                    </span>
                  </div>
                  {selected.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(selected.id)}
                        disabled={processingRequests.has(selected.id)}
                        className="text-tone-danger hover:text-tone-danger"
                      >
                        <X />
                        {t('leave.actions.reject', 'Reject')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(selected.id)}
                        disabled={processingRequests.has(selected.id)}
                      >
                        {processingRequests.has(selected.id) ? <Loader2 className="animate-spin" /> : <Check />}
                        {t('leave.actions.approve', 'Approve')}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Rejection Reason Modal */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('leave.actions.rejectTitle', 'Reject Leave Request')}</DialogTitle>
              <DialogDescription>
                {t('leave.actions.rejectDescription', 'Please provide a reason for rejecting this leave request.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="reject-reason" className="text-sm font-medium">
                {t('leave.actions.rejectionReason', 'Rejection Reason')} *
              </Label>
              <Textarea
                id="reject-reason"
                placeholder={t('leave.actions.rejectionPlaceholder', 'Enter the reason for rejection...')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="text-right text-xs text-muted-foreground">{rejectReason.length}/500</div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={cancelRejectRequest}
                disabled={processingRequests.has(requestToReject || '')}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRejectRequest}
                disabled={!rejectReason.trim() || processingRequests.has(requestToReject || '')}
                className="min-w-[100px]"
              >
                {processingRequests.has(requestToReject || '') ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {t('common.rejecting', 'Rejecting...')}
                  </>
                ) : (
                  <>
                    <X />
                    {t('common.reject', 'Reject')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function LeaveRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LeaveRequestsContent />
    </Suspense>
  );
}
