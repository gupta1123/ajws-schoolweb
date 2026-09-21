'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { leaveRequestServices } from '@/lib/api/leave-requests';
import type {
  LeaveRequestPagination,
  TeacherLeaveRequest,
  TeacherLeaveRequestPayload,
} from '@/types/leave-requests';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const EMPTY_FORM: TeacherLeaveRequestPayload = {
  start_date: '',
  end_date: '',
  reason: '',
};

function statusClass(status: TeacherLeaveRequest['status']) {
  if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  if (status === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
}

export function TeacherLeaveRequests() {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TeacherLeaveRequest[]>([]);
  const [pagination, setPagination] = useState<LeaveRequestPagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | TeacherLeaveRequest['status']>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TeacherLeaveRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<TeacherLeaveRequest | null>(null);
  const [form, setForm] = useState<TeacherLeaveRequestPayload>(EMPTY_FORM);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await leaveRequestServices.listMyTeacherLeaves({
        status: status === 'all' ? undefined : status,
        page,
        limit: 20,
      }, token);

      if (response instanceof Blob) {
        setError(t('leave.teacher.fetchError', 'Failed to load your leave requests.'));
        setRequests([]);
        return;
      }

      if ('statusCode' in response && response.status === 'error') {
        setError(response.message || t('leave.teacher.fetchError', 'Failed to load your leave requests.'));
        setRequests([]);
        return;
      }

      if ('data' in response) {
        setRequests(response.data.leave_requests || []);
        setPagination(response.data.pagination || null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('leave.teacher.fetchError', 'Failed to load your leave requests.'));
    } finally {
      setLoading(false);
    }
  }, [page, status, t, token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const counts = useMemo(() => ({
    pending: requests.filter(request => request.status === 'pending').length,
    approved: requests.filter(request => request.status === 'approved').length,
    rejected: requests.filter(request => request.status === 'rejected').length,
  }), [requests]);

  const openCreateDialog = () => {
    setEditingRequest(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (request: TeacherLeaveRequest) => {
    setEditingRequest(request);
    setForm({
      start_date: request.start_date.slice(0, 10),
      end_date: request.end_date.slice(0, 10),
      reason: request.reason,
    });
    setError(null);
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      return t('leave.teacher.required', 'Start date, end date, and reason are required.');
    }
    if (form.end_date < form.start_date) {
      return t('leave.teacher.invalidRange', 'End date cannot be before the start date.');
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!token) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    const payload = { ...form, reason: form.reason.trim() };

    try {
      const response = editingRequest
        ? await leaveRequestServices.updateTeacherLeave(editingRequest.id, payload, token)
        : await leaveRequestServices.createTeacherLeave(payload, token);

      if (response instanceof Blob) {
        setError(t('leave.teacher.saveError', 'Failed to save leave request.'));
        return;
      }

      if ('statusCode' in response && response.status === 'error') {
        // The backend trigger is the source of truth for the three-active-leaves-per-day rule.
        // Its 409 response includes both the human-readable reason and conflicting date.
        const conflictDate = response.statusCode === 409
          && response.details
          && typeof response.details === 'object'
          && 'leave_date' in response.details
          ? String(response.details.leave_date)
          : null;
        const message = conflictDate
          ? `${response.message} (${formatDate(conflictDate)})`
          : response.message;
        setError(message || t('leave.teacher.saveError', 'Failed to save leave request.'));
        return;
      }

      setDialogOpen(false);
      setEditingRequest(null);
      setForm(EMPTY_FORM);
      toast({
        title: t('common.success', 'Success'),
        description: editingRequest
          ? t('leave.teacher.updated', 'Leave request updated successfully.')
          : t('leave.teacher.created', 'Leave request submitted successfully.'),
      });
      if (page !== 1) setPage(1);
      else await fetchRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('leave.teacher.saveError', 'Failed to save leave request.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !requestToDelete) return;
    setDeleting(true);
    setError(null);

    try {
      const response = await leaveRequestServices.deleteTeacherLeave(requestToDelete.id, token);
      if (response.status === 'error') {
        setError(response.message || t('leave.teacher.deleteError', 'Failed to delete leave request.'));
        return;
      }

      setRequestToDelete(null);
      toast({
        title: t('common.success', 'Success'),
        description: response.message || t('leave.teacher.deleted', 'Leave request deleted successfully.'),
      });
      await fetchRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('leave.teacher.deleteError', 'Failed to delete leave request.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('leave.teacher.title', 'My Leave Requests')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('leave.teacher.subtitle', 'Submit leave requests and track their approval status.')}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('leave.teacher.newRequest', 'New Leave Request')}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('leave.teacher.dailyLimitTitle', 'Daily leave limit')}</AlertTitle>
        <AlertDescription>
          {t('leave.teacher.dailyLimit', 'Only three active teacher leave requests are allowed for any date. A fourth request is automatically blocked by the system.')}
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t('leave.status.pending', 'Pending')}</p><p className="text-2xl font-bold">{counts.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t('leave.status.approved', 'Approved')}</p><p className="text-2xl font-bold">{counts.approved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t('leave.status.rejected', 'Rejected')}</p><p className="text-2xl font-bold">{counts.rejected}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t('leave.teacher.history', 'Request History')}</CardTitle>
            <CardDescription>{t('leave.teacher.pendingHint', 'Pending requests can be edited or deleted.')}</CardDescription>
          </div>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={event => { setStatus(event.target.value as typeof status); setPage(1); }}
            aria-label={t('leave.filters.status', 'Status')}
          >
            <option value="all">{t('leave.filters.allStatuses', 'All Statuses')}</option>
            <option value="pending">{t('leave.status.pending', 'Pending')}</option>
            <option value="approved">{t('leave.status.approved', 'Approved')}</option>
            <option value="rejected">{t('leave.status.rejected', 'Rejected')}</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('leave.loading', 'Loading leave requests...')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('leave.columns.dates', 'Dates')}</TableHead>
                    <TableHead>{t('leave.columns.reason', 'Reason')}</TableHead>
                    <TableHead>{t('leave.columns.requestedDate', 'Requested Date')}</TableHead>
                    <TableHead>{t('leave.columns.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('leave.columns.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-50" />
                        {t('leave.teacher.empty', 'You have no leave requests matching this filter.')}
                      </TableCell>
                    </TableRow>
                  ) : requests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(request.start_date)} – {formatDate(request.end_date)}</TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap">{request.reason}</TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(request.status)}`}>{t(`leave.status.${request.status}`, request.status)}</span></TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(request)} aria-label={t('common.edit', 'Edit')}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setRequestToDelete(request)} aria-label={t('common.delete', 'Delete')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('pagination.page', 'Page')} {pagination.page} {t('pagination.of', 'of')} {pagination.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!pagination.has_prev || loading} onClick={() => setPage(value => value - 1)}>{t('pagination.previous', 'Previous')}</Button>
                <Button variant="outline" size="sm" disabled={!pagination.has_next || loading} onClick={() => setPage(value => value + 1)}>{t('pagination.next', 'Next')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRequest ? t('leave.teacher.editTitle', 'Edit Leave Request') : t('leave.teacher.createTitle', 'New Leave Request')}</DialogTitle>
            <DialogDescription>{t('leave.teacher.formDescription', 'Choose the leave dates and provide a clear reason.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher-leave-start">{t('leave.filters.startDate', 'Start Date')}</Label>
                <Input id="teacher-leave-start" type="date" value={form.start_date} onChange={event => setForm(value => ({ ...value, start_date: event.target.value, end_date: value.end_date && value.end_date < event.target.value ? event.target.value : value.end_date }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-leave-end">{t('leave.filters.endDate', 'End Date')}</Label>
                <Input id="teacher-leave-end" type="date" min={form.start_date || undefined} value={form.end_date} onChange={event => setForm(value => ({ ...value, end_date: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-leave-reason">{t('leave.columns.reason', 'Reason')}</Label>
              <Textarea id="teacher-leave-reason" className="min-h-28" maxLength={1000} value={form.reason} onChange={event => setForm(value => ({ ...value, reason: event.target.value }))} placeholder={t('leave.teacher.reasonPlaceholder', 'Explain why you need leave...')} />
              <p className="text-right text-xs text-muted-foreground">{form.reason.length}/1000</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button disabled={saving} onClick={handleSubmit}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingRequest ? t('common.save', 'Save Changes') : t('leave.teacher.submit', 'Submit Request')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!requestToDelete} onOpenChange={open => { if (!open && !deleting) setRequestToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave.teacher.deleteTitle', 'Delete leave request?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('leave.teacher.deleteDescription', 'This pending request will be permanently removed.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={event => { event.preventDefault(); handleDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
