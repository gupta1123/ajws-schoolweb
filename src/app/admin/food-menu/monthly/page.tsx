'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Eye, FileText, Filter, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { foodMenuServices, type MonthlyMenuAttachment } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MONTH_NAMES,
  MonthlyMenuPreviewDialog,
  type MonthlyMenuPreview,
  formatFileSize,
} from '@/components/food-menu/monthly-menu-preview-dialog';

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MonthlyMenuListContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const queryMonth = searchParams.get('month');
  const queryYear = Number(searchParams.get('year'));
  const [month, setMonth] = useState(queryMonth && Number(queryMonth) >= 1 && Number(queryMonth) <= 12 ? queryMonth : 'all');
  const [year, setYear] = useState(queryYear >= 2000 && queryYear <= 2100 ? queryYear : now.getFullYear());
  const [appliedMonth, setAppliedMonth] = useState(month);
  const [appliedYear, setAppliedYear] = useState(year);
  const [attachments, setAttachments] = useState<MonthlyMenuAttachment[]>([]);
  const [preview, setPreview] = useState<MonthlyMenuPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(searchParams.get('created') === '1' ? 'Monthly menu uploaded successfully.' : null);

  const canManage = user?.role === 'admin' || user?.role === 'principal';
  const canView = canManage || user?.role === 'parent';

  const load = useCallback(async () => {
    if (!token || !canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await foodMenuServices.getMonthlyAttachments(token, {
        month: appliedMonth === 'all' ? undefined : Number(appliedMonth),
        year: appliedYear,
      });
      if (response instanceof Blob) throw new Error('Unexpected response from monthly menu API');
      if (response.status === 'error') throw new Error(response.message || 'Failed to load monthly menus');
      if (!('data' in response)) throw new Error('Monthly menu data was not returned');
      const list = response.data.attachments?.length
        ? response.data.attachments
        : response.data.attachment
          ? [response.data.attachment]
          : [];
      setAttachments([...list].sort((a, b) => b.year - a.year || b.month - a.month || b.updated_at.localeCompare(a.updated_at)));
    } catch (loadError) {
      setAttachments([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load monthly menus');
    } finally {
      setLoading(false);
    }
  }, [appliedMonth, appliedYear, canView, token]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = () => {
    if (year < 2000 || year > 2100) {
      setError('Year must be between 2000 and 2100.');
      return;
    }
    setSuccess(null);
    setAppliedMonth(month);
    setAppliedYear(year);
    const query = new URLSearchParams({ year: String(year) });
    if (month !== 'all') query.set('month', month);
    router.replace(`/admin/food-menu/monthly?${query.toString()}`);
  };

  const getDownload = async (attachment: MonthlyMenuAttachment, openPreview: boolean) => {
    if (!token) return;
    setWorkingId(attachment.id);
    setError(null);
    try {
      const response = await foodMenuServices.getMonthlyAttachmentDownload(attachment.id, token);
      if (response instanceof Blob) throw new Error('Unexpected response from download API');
      if (response.status === 'error') throw new Error(response.message || 'Unable to open monthly menu');
      if (!('data' in response)) throw new Error('Monthly menu download was not returned');
      if (openPreview) {
        setPreview({
          name: response.data.file_name,
          type: response.data.mime_type || response.data.file_type,
          size: response.data.file_size,
          url: response.data.file_url,
        });
      } else {
        window.open(response.data.file_url, '_blank', 'noopener,noreferrer');
      }
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to open monthly menu');
    } finally {
      setWorkingId(null);
    }
  };

  const remove = async (attachment: MonthlyMenuAttachment) => {
    if (!token || !canManage) return;
    if (!window.confirm(`Delete ${attachment.title || attachment.file_name}?`)) return;
    setWorkingId(attachment.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await foodMenuServices.deleteMonthlyAttachment(attachment.id, token);
      if (response.status === 'error') throw new Error(response.message || 'Failed to delete monthly menu');
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      setSuccess('Monthly menu deleted successfully.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete monthly menu');
    } finally {
      setWorkingId(null);
    }
  };

  if (user && !canView) {
    return <div className="flex min-h-[60vh] items-center justify-center text-center"><div><h2 className="text-2xl font-bold">Access Denied</h2><p className="mt-2 text-muted-foreground">You do not have access to monthly menus.</p></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {canManage && <Button variant="ghost" asChild className="mb-2 -ml-3"><Link href="/admin/food-menu"><ArrowLeft className="mr-2 h-4 w-4" />Daily Menus</Link></Button>}
              <div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2"><FileText className="h-6 w-6 text-primary" /></div><div><h1 className="text-3xl font-bold">Monthly Food Menus</h1><p className="text-muted-foreground">Find and view uploaded monthly menu attachments.</p></div></div>
            </div>
            {canManage && <Button asChild><Link href="/admin/food-menu/monthly/create"><Upload className="mr-2 h-4 w-4" />Upload Monthly Menu</Link></Button>}
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5 text-primary" />Filter Menus</CardTitle><CardDescription>Select a month and year, then apply the filter.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2"><Label htmlFor="filter-month">Month</Label><select id="filter-month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"><option value="all">All months</option>{MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="filter-year">Year</Label><Input id="filter-year" type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} /></div>
            <div className="flex items-end gap-2"><Button onClick={applyFilters}><Filter className="mr-2 h-4 w-4" />Apply Filter</Button><Button variant="outline" onClick={load} disabled={loading} aria-label="Refresh menus"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Uploaded Menus</CardTitle><CardDescription>{appliedMonth === 'all' ? `All uploaded menus for ${appliedYear}` : `${MONTH_NAMES[Number(appliedMonth) - 1]} ${appliedYear}`}</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Title</TableHead><TableHead>File</TableHead><TableHead>Size</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center"><div className="flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading monthly menus...</div></TableCell></TableRow>
                ) : attachments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No monthly menus found for the selected filter.</TableCell></TableRow>
                ) : attachments.map((attachment) => (
                  <TableRow key={attachment.id}>
                    <TableCell className="font-medium">{MONTH_NAMES[attachment.month - 1]} {attachment.year}</TableCell>
                    <TableCell>{attachment.title || '-'}</TableCell>
                    <TableCell><button type="button" onClick={() => getDownload(attachment, true)} className="max-w-[240px] truncate text-left text-primary underline-offset-4 hover:underline">{attachment.file_name}</button></TableCell>
                    <TableCell>{formatFileSize(attachment.file_size)}</TableCell>
                    <TableCell>{formatDate(attachment.updated_at)}</TableCell>
                    <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => getDownload(attachment, true)} disabled={workingId === attachment.id}>{workingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Preview</span></Button><Button variant="ghost" size="sm" onClick={() => getDownload(attachment, false)} disabled={workingId === attachment.id}><Download className="h-4 w-4" /><span className="sr-only">Download</span></Button>{canManage && <Button variant="ghost" size="sm" onClick={() => remove(attachment)} disabled={workingId === attachment.id} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <MonthlyMenuPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

export default function MonthlyMenuListPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <MonthlyMenuListContent />
      </Suspense>
    </ProtectedRoute>
  );
}
