'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Eye, FileUp, Loader2, Upload } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { foodMenuServices } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MONTHLY_MENU_ACCEPT,
  MONTHLY_MENU_MAX_SIZE,
  MONTHLY_MENU_TYPES,
  MONTH_NAMES,
  MonthlyMenuPreviewDialog,
  type MonthlyMenuPreview,
  formatFileSize,
} from '@/components/food-menu/monthly-menu-preview-dialog';

export default function CreateMonthlyMenuPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MonthlyMenuPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'principal';

  const selectFile = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MONTHLY_MENU_MAX_SIZE) {
      setError(`${selected.name} exceeds the 10 MB file limit.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (!MONTHLY_MENU_TYPES.has(selected.type)) {
      setError('Unsupported file type. Use JPG, PNG, PDF, TXT, CSV, DOC, or DOCX.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected);
  };

  const previewFile = async () => {
    if (!file) return;
    if (file.type.startsWith('text/')) {
      setPreview({ name: file.name, type: file.type, size: file.size, text: await file.text() });
      return;
    }
    setPreview({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      revokeOnClose: true,
    });
  };

  const upload = async () => {
    if (!token || !file || !canManage) return;
    if (year < 2000 || year > 2100) {
      setError('Year must be between 2000 and 2100.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await foodMenuServices.uploadMonthlyAttachment(token, { file, month, year, title });
      if (response instanceof Blob) throw new Error('Unexpected response from monthly menu API');
      if (response.status === 'error') throw new Error(response.message || 'Failed to upload monthly menu');
      router.push(`/admin/food-menu/monthly?month=${month}&year=${year}&created=1`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload monthly menu');
    } finally {
      setSaving(false);
    }
  };

  if (user && !canManage) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-[60vh] items-center justify-center text-center">
          <div><h2 className="text-2xl font-bold">Access Denied</h2><p className="mt-2 text-muted-foreground">Only administrators and principals can upload monthly menus.</p></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-3 -ml-3"><Link href="/admin/food-menu/monthly"><ArrowLeft className="mr-2 h-4 w-4" />Back to Monthly Menus</Link></Button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3"><FileUp className="h-7 w-7 text-primary" /></div>
            <div><h1 className="text-3xl font-bold">Upload Monthly Menu</h1><p className="text-muted-foreground">Publish one complete food-menu file for a selected month.</p></div>
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Menu Details</CardTitle>
            <CardDescription>The uploaded menu will be available to administrators, principals, and parents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="menu-month">Month *</Label>
                <select id="menu-month" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                  {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-year">Year *</Label>
                <Input id="menu-year" type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-title">Display title</Label>
              <Input id="menu-title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`${MONTH_NAMES[month - 1]} Food Menu`} />
              <p className="text-xs text-muted-foreground">Optional. If omitted, the file name will identify the menu.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-file">Menu attachment *</Label>
              <div className="rounded-lg border border-dashed p-5">
                <Input ref={inputRef} id="menu-file" type="file" accept={MONTHLY_MENU_ACCEPT} onChange={(event) => selectFile(event.target.files?.[0] || null)} />
                <p className="mt-2 text-xs text-muted-foreground">Maximum 10 MB. JPG, PNG, PDF, TXT, CSV, DOC, and DOCX.</p>
                {file && (
                  <div className="mt-4 flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="truncate font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
                    <Button type="button" variant="outline" size="sm" onClick={previewFile}><Eye className="mr-2 h-4 w-4" />Preview</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Button variant="outline" asChild><Link href="/admin/food-menu/monthly">Cancel</Link></Button>
              <Button onClick={upload} disabled={saving || !file || year < 2000 || year > 2100}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {saving ? 'Uploading...' : 'Upload Monthly Menu'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <MonthlyMenuPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </ProtectedRoute>
  );
}
