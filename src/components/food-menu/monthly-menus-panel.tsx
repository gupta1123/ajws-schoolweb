// src/components/food-menu/monthly-menus-panel.tsx
//
// The main Food Menu view: one uploaded file per month. Fetches a whole year
// once and filters by month on the client, so switching months is instant.
// Clicking a row opens the file in a side panel; signed download URLs are
// cached and pre-fetched on hover so the preview usually appears immediately.

'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { foodMenuServices, type MonthlyMenuAttachment, type MonthlyMenuDownload } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { EmptyState, IconChip, InlineError, Pill } from '@/components/ui/page-kit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFileSize, monthName } from '@/components/food-menu/monthly-menu-preview-dialog';
import { cn } from '@/lib/utils';
import { surface, type } from '@/lib/design/tokens';

type Kind = 'pdf' | 'image' | 'text' | 'other';

const kindOf = (mime?: string | null): Kind => {
  if (!mime) return 'other';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('text/')) return 'text';
  return 'other';
};

const extOf = (name: string) => name.split('.').pop()?.toUpperCase() ?? '';

interface RowProps {
  a: MonthlyMenuAttachment;
  active: boolean;
  lang: string;
  updatedLabel: string;
  defaultTitle: string;
  onOpen: (id: string) => void;
  onWarm: (id: string) => void;
}

const MenuRow = memo(function MenuRow({ a, active, lang, updatedLabel, defaultTitle, onOpen, onWarm }: RowProps) {
  const image = kindOf(a.mime_type) === 'image';
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(a.id)}
        onPointerEnter={() => onWarm(a.id)}
        onFocus={() => onWarm(a.id)}
        className={cn(
          'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
          active && 'bg-tone-primary-soft/40'
        )}
      >
        <IconChip tone={image ? 'violet' : 'primary'} className="size-9">
          {image ? <FileImage /> : <FileText />}
        </IconChip>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{a.title || defaultTitle}</span>
          <span className={cn(type.caption, 'block truncate')}>
            {a.file_name} · {formatFileSize(a.file_size)} · {updatedLabel}
          </span>
        </span>
        <Pill tone="primary" className="hidden sm:inline-flex">
          {monthName(a.month - 1, lang)} {a.year}
        </Pill>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
});

export function MonthlyMenusPanel({ lead, canManage }: { lead?: ReactNode; canManage: boolean }) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const thisYear = new Date().getFullYear();
  const initialMonth = Number(searchParams.get('month'));
  const initialYear = Number(searchParams.get('year'));
  const [month, setMonth] = useState(initialMonth >= 1 && initialMonth <= 12 ? String(initialMonth) : 'all');
  const [year, setYear] = useState(initialYear >= 2000 && initialYear <= 2100 ? initialYear : thisYear);

  const [attachments, setAttachments] = useState<MonthlyMenuAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [download, setDownload] = useState<{ id: string; data?: MonthlyMenuDownload; error?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MonthlyMenuAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // signed URLs, plus in-flight requests so hover + click share one call
  const cache = useRef(new Map<string, MonthlyMenuDownload>());
  const inflight = useRef(new Map<string, Promise<MonthlyMenuDownload>>());

  const years = useMemo(() => Array.from(new Set([thisYear + 1, thisYear, thisYear - 1, thisYear - 2, year])).sort((a, b) => b - a), [thisYear, year]);

  const syncUrl = (m: string, y: number) => {
    const q = new URLSearchParams(window.location.search);
    q.set('year', String(y));
    if (m === 'all') q.delete('month');
    else q.set('month', m);
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await foodMenuServices.getMonthlyAttachments(token, { year });
      if (response instanceof Blob) throw new Error(t('foodMenu.monthlyPage.failed', 'Failed to load monthly menus'));
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.monthlyPage.failed', 'Failed to load monthly menus'));
      if (!('data' in response)) throw new Error(t('foodMenu.monthlyPage.failed', 'Failed to load monthly menus'));
      const list = response.data.attachments?.length ? response.data.attachments : response.data.attachment ? [response.data.attachment] : [];
      setAttachments([...list].sort((a, b) => b.year - a.year || b.month - a.month || b.updated_at.localeCompare(a.updated_at)));
    } catch (err) {
      setAttachments([]);
      setError(err instanceof Error ? err.message : t('foodMenu.monthlyPage.failed', 'Failed to load monthly menus'));
    } finally {
      setLoading(false);
    }
  }, [t, token, year]);

  useEffect(() => {
    void load();
  }, [load]);

  // arriving from the upload page
  useEffect(() => {
    if (searchParams.get('created') === '1') {
      toast({ title: t('foodMenu.upload.success', 'Monthly menu uploaded'), variant: 'success' });
      const q = new URLSearchParams(window.location.search);
      q.delete('created');
      window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => (month === 'all' ? attachments : attachments.filter((a) => a.month === Number(month))), [attachments, month]);
  const selectedIndex = visible.findIndex((a) => a.id === selectedId);
  const selected = selectedIndex >= 0 ? visible[selectedIndex] : null;

  const fetchDownload = useCallback(
    (id: string): Promise<MonthlyMenuDownload> => {
      const hit = cache.current.get(id);
      if (hit && new Date(hit.expires_at).getTime() - Date.now() > 60_000) return Promise.resolve(hit);
      const running = inflight.current.get(id);
      if (running) return running;
      const p = (async () => {
        if (!token) throw new Error('Not signed in');
        const response = await foodMenuServices.getMonthlyAttachmentDownload(id, token);
        if (response instanceof Blob) throw new Error(t('foodMenu.monthlyPage.openFailed', 'Unable to open monthly menu'));
        if (response.status === 'error') throw new Error(response.message || t('foodMenu.monthlyPage.openFailed', 'Unable to open monthly menu'));
        if (!('data' in response)) throw new Error(t('foodMenu.monthlyPage.openFailed', 'Unable to open monthly menu'));
        cache.current.set(id, response.data);
        return response.data;
      })().finally(() => inflight.current.delete(id));
      inflight.current.set(id, p);
      return p;
    },
    [t, token]
  );

  const warm = useCallback(
    (id: string) => {
      void fetchDownload(id).catch(() => undefined);
    },
    [fetchDownload]
  );

  // load the file for whichever menu the panel is showing
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setFrameReady(false);
    setDownload({ id: selectedId });
    fetchDownload(selectedId)
      .then((data) => !cancelled && setDownload({ id: selectedId, data }))
      .catch((err) => !cancelled && setDownload({ id: selectedId, error: err instanceof Error ? err.message : String(err) }));
    return () => {
      cancelled = true;
    };
  }, [selectedId, fetchDownload, attempt]);

  // warm the neighbours so ‹ › feels instant
  useEffect(() => {
    if (selectedIndex < 0) return;
    [visible[selectedIndex - 1], visible[selectedIndex + 1]].forEach((n) => n && warm(n.id));
  }, [selectedIndex, visible, warm]);

  const remove = async () => {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      const response = await foodMenuServices.deleteMonthlyAttachment(pendingDelete.id, token);
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.monthlyPage.deleteFailed', 'Failed to delete monthly menu'));
      setAttachments((cur) => cur.filter((i) => i.id !== pendingDelete.id));
      if (selectedId === pendingDelete.id) setSelectedId(null);
      toast({ title: t('foodMenu.monthlyPage.deleted', 'Monthly menu deleted'), variant: 'success' });
      setPendingDelete(null);
    } catch (err) {
      toast({ title: t('common.error', 'Error'), description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const defaultTitle = (a: MonthlyMenuAttachment) => t('foodMenu.monthlyPage.defaultTitle', '{month} Food Menu').replace('{month}', monthName(a.month - 1, lang));
  const updated = (v: string) => t('foodMenu.monthlyPage.updated', 'Updated {date}').replace('{date}', new Date(v).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }));
  const trigger = 'h-9 w-auto min-w-[8.5rem] gap-2';

  const kind = kindOf(download?.data?.mime_type || selected?.mime_type);
  const dl = download?.id === selected?.id ? download : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {lead}
          <Select
            value={month}
            onValueChange={(v) => {
              setMonth(v);
              syncUrl(v, year);
            }}
          >
            <SelectTrigger aria-label={t('foodMenu.monthlyPage.month', 'Month')} className={trigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('foodMenu.monthlyPage.allMonths', 'All months')}</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {monthName(i, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => {
              setYear(Number(v));
              syncUrl(month, Number(v));
            }}
          >
            <SelectTrigger aria-label={t('foodMenu.monthlyPage.year', 'Year')} className="h-9 w-auto min-w-[6.5rem] gap-2">
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
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" onClick={load} disabled={loading} aria-label={t('actions.refresh', 'Refresh')} title={t('actions.refresh', 'Refresh')}>
            <RefreshCw className={cn(loading && 'animate-spin')} />
          </Button>
          {canManage && (
            <Button asChild>
              <Link href="/admin/food-menu/monthly/create">
                <Upload />
                {t('foodMenu.upload.cta', 'Upload menu')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border">
          <InlineError title={error} onRetry={load} retryLabel={t('actions.refresh', 'Refresh')} />
        </div>
      ) : (
        <section className={cn(surface.panel, 'overflow-hidden')}>
          {loading && attachments.length === 0 ? (
            <ul className="divide-y" aria-busy>
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-4">
                  <Skeleton className="size-9" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </li>
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={t('foodMenu.monthlyPage.empty', 'No monthly menus found')}
              help={canManage ? t('foodMenu.monthlyPage.emptyHelp', 'Upload a menu file for the month so parents can view it.') : undefined}
            />
          ) : (
            <ul className={cn('divide-y transition-opacity', loading && 'opacity-60')}>
              {visible.map((a) => (
                <MenuRow key={a.id} a={a} active={a.id === selectedId} lang={lang} updatedLabel={updated(a.updated_at)} defaultTitle={defaultTitle(a)} onOpen={setSelectedId} onWarm={warm} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Viewer */}
      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl lg:max-w-3xl">
          {selected && (
            <>
              <SheetHeader className="gap-3 border-b px-5 py-4 pr-12">
                <div className="flex items-start gap-3">
                  <IconChip tone={kind === 'image' ? 'violet' : 'primary'} className="size-10">
                    {kind === 'image' ? <FileImage /> : <FileText />}
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate text-base">{selected.title || defaultTitle(selected)}</SheetTitle>
                    <SheetDescription className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {monthName(selected.month - 1, lang)} {selected.year}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{extOf(selected.file_name)}</span>
                      <span aria-hidden>·</span>
                      <span>{formatFileSize(selected.file_size)}</span>
                      <span aria-hidden>·</span>
                      <span>{updated(selected.updated_at)}</span>
                    </SheetDescription>
                  </div>
                </div>
                {visible.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="size-8" disabled={selectedIndex <= 0} onClick={() => setSelectedId(visible[selectedIndex - 1].id)} aria-label={t('foodMenu.monthlyPage.newer', 'Newer menu')}>
                      <ChevronLeft />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={selectedIndex >= visible.length - 1} onClick={() => setSelectedId(visible[selectedIndex + 1].id)} aria-label={t('foodMenu.monthlyPage.older', 'Older menu')}>
                      <ChevronRight />
                    </Button>
                    <span className={type.caption}>
                      {selectedIndex + 1} / {visible.length}
                    </span>
                  </div>
                )}
              </SheetHeader>

              {/* Preview */}
              <div className="relative min-h-0 flex-1 bg-muted/30">
                {dl?.error ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <InlineError title={dl.error} onRetry={() => setAttempt((n) => n + 1)} retryLabel={t('actions.refresh', 'Refresh')} />
                  </div>
                ) : !dl?.data ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : kind === 'image' ? (
                  <div className="flex h-full items-center justify-center overflow-auto p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dl.data.file_url} alt={selected.file_name} decoding="async" onLoad={() => setFrameReady(true)} className="max-h-full max-w-full rounded-lg object-contain shadow-sm" />
                  </div>
                ) : kind === 'pdf' || kind === 'text' ? (
                  <>
                    {!frameReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin" />
                      </div>
                    )}
                    <iframe
                      key={dl.data.attachment_id}
                      src={kind === 'pdf' ? `${dl.data.file_url}#toolbar=0&navpanes=0&view=FitH` : dl.data.file_url}
                      title={selected.file_name}
                      onLoad={() => setFrameReady(true)}
                      className={cn('size-full bg-white transition-opacity', frameReady ? 'opacity-100' : 'opacity-0')}
                    />
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                    <span className="text-muted-foreground/60 [&_svg]:size-12">
                      <FileText />
                    </span>
                    <p className="text-sm font-medium">{t('foodMenu.monthlyPage.noPreview', 'This file type cannot be previewed in the browser.')}</p>
                    <p className={type.caption}>{t('foodMenu.monthlyPage.noPreviewHelp', 'Download it to view the menu.')}</p>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-0 flex-row items-center justify-between gap-2 border-t px-5 py-3">
                {canManage ? (
                  <Button variant="ghost" className="text-tone-danger hover:bg-tone-danger-soft hover:text-tone-danger" onClick={() => setPendingDelete(selected)}>
                    <Trash2 />
                    {t('actions.delete', 'Delete')}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={!dl?.data} onClick={() => dl?.data && window.open(dl.data.file_url, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink />
                    {t('foodMenu.monthlyPage.openTab', 'Open in new tab')}
                  </Button>
                  <Button asChild disabled={!dl?.data}>
                    <a href={dl?.data?.file_url} download={selected.file_name} target="_blank" rel="noopener noreferrer" aria-disabled={!dl?.data}>
                      <Download />
                      {t('foodMenu.monthlyPage.download', 'Download')}
                    </a>
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('foodMenu.monthlyPage.deleteTitle', 'Delete this menu?')}</DialogTitle>
            <DialogDescription>
              {t('foodMenu.monthlyPage.deleteDesc', '"{name}" will be removed for everyone, including parents.').replace('{name}', pendingDelete?.title || pendingDelete?.file_name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              {t('actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
