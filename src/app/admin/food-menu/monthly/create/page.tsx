'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, FileImage, FileText, FileUp, Loader2, Upload, X } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { foodMenuServices } from '@/lib/api';
import { IconChip } from '@/components/ui/page-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MONTHLY_MENU_ACCEPT,
  MONTHLY_MENU_MAX_SIZE,
  MONTHLY_MENU_TYPES,
  MonthlyMenuPreviewDialog,
  monthName,
  type MonthlyMenuPreview,
  formatFileSize,
} from '@/components/food-menu/monthly-menu-preview-dialog';
import { cn } from '@/lib/utils';
import { type } from '@/lib/design/tokens';

export default function CreateMonthlyMenuPage() {
  const { user, token } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<MonthlyMenuPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'principal';
  const years = [now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1];

  const selectFile = (selected: File | null | undefined) => {
    setError(null);
    if (!selected) return;
    const reset = () => {
      if (inputRef.current) inputRef.current.value = '';
    };
    if (selected.size > MONTHLY_MENU_MAX_SIZE) {
      setError(t('foodMenu.upload.tooBig', '{name} exceeds the 10 MB file limit.').replace('{name}', selected.name));
      reset();
      return;
    }
    if (!MONTHLY_MENU_TYPES.has(selected.type)) {
      setError(t('foodMenu.upload.badType', 'Unsupported file type. Use JPG, PNG, PDF, TXT, CSV, DOC or DOCX.'));
      reset();
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const previewFile = async () => {
    if (!file) return;
    if (file.type.startsWith('text/')) {
      setPreview({ name: file.name, type: file.type, size: file.size, text: await file.text() });
      return;
    }
    setPreview({ name: file.name, type: file.type, size: file.size, url: URL.createObjectURL(file), revokeOnClose: true });
  };

  const upload = async () => {
    if (!token || !file || !canManage) return;
    setSaving(true);
    setError(null);
    try {
      const response = await foodMenuServices.uploadMonthlyAttachment(token, { file, month, year, title });
      if (response instanceof Blob) throw new Error(t('foodMenu.upload.failed', 'Failed to upload monthly menu'));
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.upload.failed', 'Failed to upload monthly menu'));
      router.push(`/admin/food-menu?month=${month}&year=${year}&created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('foodMenu.upload.failed', 'Failed to upload monthly menu'));
      setSaving(false);
    }
  };

  if (user && !canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('foodMenu.upload.adminsOnly', 'Only administrators and principals can upload monthly menus.')}</p>
        </div>
      </div>
    );
  }

  const isImage = file?.type.startsWith('image/');

  return (
    <ProtectedRoute>
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* File */}
        <div className="space-y-3">
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border px-4 py-4">
              <IconChip tone={isImage ? 'violet' : 'primary'} className="size-10">
                {isImage ? <FileImage /> : <FileText />}
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className={type.caption}>{formatFileSize(file.size)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={previewFile}>
                <Eye />
                {t('foodMenu.upload.preview', 'Preview')}
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-tone-danger" onClick={clearFile} aria-label={t('foodMenu.upload.remove', 'Remove file')} title={t('foodMenu.upload.remove', 'Remove file')}>
                <X />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="menu-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                selectFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'flex min-h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring',
                dragging ? 'border-tone-primary bg-tone-primary-soft' : 'hover:bg-muted/40'
              )}
            >
              <span className="text-muted-foreground/70 [&_svg]:size-8">
                <FileUp />
              </span>
              <p className="text-sm font-medium">
                {t('foodMenu.upload.drop', 'Drop the menu file here, or')} <span className="text-tone-primary underline underline-offset-2">{t('foodMenu.upload.browse', 'browse')}</span>
              </p>
              <p className={type.caption}>{t('foodMenu.upload.hint', 'JPG, PNG, PDF, TXT, CSV, DOC or DOCX · up to 10 MB')}</p>
            </label>
          )}
          <input ref={inputRef} id="menu-file" type="file" className="sr-only" accept={MONTHLY_MENU_ACCEPT} onChange={(e) => selectFile(e.target.files?.[0])} />
          {error && (
            <p role="alert" className="text-sm text-tone-danger">
              {error}
            </p>
          )}
        </div>

        {/* Details */}
        <aside className="space-y-5 lg:border-l lg:pl-8">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="menu-month">{t('foodMenu.monthlyPage.month', 'Month')}</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger id="menu-month" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {monthName(i, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menu-year">{t('foodMenu.monthlyPage.year', 'Year')}</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger id="menu-year" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="menu-title">
              {t('foodMenu.upload.title', 'Display title')} <span className="font-normal text-muted-foreground">· {t('foodMenu.form.optional', 'optional')}</span>
            </Label>
            <Input id="menu-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('foodMenu.monthlyPage.defaultTitle', '{month} Food Menu').replace('{month}', monthName(month - 1, lang))} />
          </div>

          <p className={type.caption}>{t('foodMenu.upload.visibleTo', 'Visible to admins, principals and parents.')}</p>

          <div className="flex flex-col gap-2 border-t pt-4">
            <Button onClick={upload} disabled={saving || !file}>
              {saving ? <Loader2 className="animate-spin" /> : <Upload />}
              {saving ? t('foodMenu.upload.uploading', 'Uploading...') : t('foodMenu.upload.submit', 'Upload menu')}
            </Button>
            <Button variant="ghost" asChild disabled={saving}>
              <Link href="/admin/food-menu">{t('actions.cancel', 'Cancel')}</Link>
            </Button>
          </div>
        </aside>
      </div>
      <MonthlyMenuPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </ProtectedRoute>
  );
}
