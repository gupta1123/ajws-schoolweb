'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  Megaphone,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Pill } from '@/components/ui/page-kit';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { createAnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { useI18n } from '@/lib/i18n/context';
import { FormattedText } from '@/components/announcements/formatted-text';
import { cn } from '@/lib/utils';
import { surface, type, type Tone } from '@/lib/design/tokens';

type StatusTab = 'all' | 'pending' | 'approved' | 'rejected';

const announcementTypes = [
  { value: 'circular', label: 'Circular', icon: BookOpen },
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'urgent', label: 'Urgent', icon: AlertCircle },
  { value: 'academic', label: 'Academic', icon: BookOpen },
  { value: 'administrative', label: 'Administrative', icon: AlertCircle },
];

const priorities = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const priorityTone: Record<Announcement['priority'], Tone> = { high: 'danger', medium: 'warning', low: 'info' };
// Literal classes so Tailwind generates them.
const priorityBar: Record<Announcement['priority'], string> = {
  high: 'bg-tone-danger',
  medium: 'bg-tone-warning',
  low: 'bg-tone-info',
};
const statusTone: Record<Announcement['status'], Tone> = { pending: 'warning', approved: 'success', rejected: 'danger' };

const selectClass =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** One-line plain-text preview of formatted announcement content. */
const preview = (content: string) =>
  (content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_`#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<StatusTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { toast } = useToast();
  const { token, user } = useAuth();
  const router = useRouter();
  const { t, lang } = useI18n();
  const api = useMemo(() => (token ? createAnnouncementsAPI(token) : null), [token]);
  const isPrincipal = user?.role === 'principal';

  const fetchAll = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const [all, pending] = await Promise.all([
        api.getAnnouncements(),
        isPrincipal ? api.getAnnouncements({ status: 'pending' }) : Promise.resolve(null),
      ]);
      if (all.status === 'success') setAnnouncements(all.data.announcements);
      if (pending && pending.status === 'success') setPendingAnnouncements(pending.data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.fetchFailed', 'Failed to fetch announcements'),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [api, isPrincipal, toast, t]);

  useEffect(() => {
    if (token) fetchAll();
  }, [token, fetchAll]);

  const handleApprove = async (announcementId: string) => {
    if (!api) return;
    try {
      const response = await api.approveOrRejectAnnouncement(announcementId, { action: 'approve' });
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('announcements.list.approved', 'Announcement approved successfully'),
        });
        fetchAll();
      }
    } catch (error) {
      console.error('Error approving announcement:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.approveFailed', 'Failed to approve announcement'),
        variant: 'error',
      });
    }
  };

  // Union of the general list and the principal's pending list (by id)
  const merged = useMemo(() => {
    const map = new Map<string, Announcement>();
    [...announcements, ...pendingAnnouncements].forEach((a) => map.set(a.id, a));
    return [...map.values()];
  }, [announcements, pendingAnnouncements]);

  const counts = useMemo(
    () => ({
      all: merged.length,
      pending: merged.filter((a) => a.status === 'pending').length,
      approved: merged.filter((a) => a.status === 'approved').length,
      rejected: merged.filter((a) => a.status === 'rejected').length,
    }),
    [merged]
  );

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return merged
      .filter((a) => {
        const matchesSearch =
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.creator.full_name.toLowerCase().includes(q);
        return (
          matchesSearch &&
          (tab === 'all' || a.status === tab) &&
          (typeFilter === 'all' || a.announcement_type === typeFilter) &&
          (priorityFilter === 'all' || a.priority === priorityFilter)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [merged, searchTerm, tab, typeFilter, priorityFilter]);

  const typeLabel = (v: string) =>
    announcementTypes.find((x) => x.value === v)?.label || v.charAt(0).toUpperCase() + v.slice(1);
  const statusLabel = (s: Announcement['status']) => t(`announcements.common.${s}`, s.charAt(0).toUpperCase() + s.slice(1));
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });

  if (!user || (user.role !== 'admin' && user.role !== 'principal')) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <EmptyState
          title={t('common.accessDenied', 'Access Denied')}
          help={t('announcements.accessHelp', 'Only admins and principals can access this section.')}
        />
      </div>
    );
  }

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: t('announcements.filters.all', 'All') },
    ...(isPrincipal ? [{ key: 'pending' as const, label: statusLabel('pending') }] : []),
    { key: 'approved', label: statusLabel('approved') },
    { key: 'rejected', label: statusLabel('rejected') },
  ];
  const filtered = searchTerm.trim() !== '' || typeFilter !== 'all' || priorityFilter !== 'all';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* Status tabs + primary action */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div role="tablist" className="flex flex-wrap gap-1">
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-tone-primary-soft text-tone-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-5',
                    active ? 'bg-background/70' : 'bg-muted',
                    item.key === 'pending' && counts.pending > 0 && !active && 'bg-tone-warning-soft text-tone-warning'
                  )}
                >
                  {loading && merged.length === 0 ? '–' : counts[item.key]}
                </span>
              </button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => router.push('/admin/announcements/create')}>
          <Plus />
          {t('announcements.create.cta', 'Create Announcement')}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('announcements.list.search', 'Search announcements...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label={t('announcements.filters.type', 'Type')}
          className={selectClass}
        >
          <option value="all">{t('announcements.filters.allTypes', 'All Types')}</option>
          {announcementTypes.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label={t('announcements.filters.priority', 'Priority')}
          className={selectClass}
        >
          <option value="all">{t('announcements.filters.allPriorities', 'All Priorities')}</option>
          {priorities.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className={cn(surface.panel, 'overflow-hidden')}>
        {loading && merged.length === 0 ? (
          <ul className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-10 w-1 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Megaphone />}
            title={t('announcements.list.emptyTitle', 'No announcements found')}
            help={
              filtered || tab !== 'all'
                ? t('announcements.list.emptyHelp', 'No announcements match your current filters.')
                : t('announcements.list.emptyHelpTeacher', 'Create your first announcement to get started.')
            }
          />
        ) : (
          <ul className="divide-y">
            {visible.map((a) => {
              const text = preview(a.content);
              const canApprove = isPrincipal && a.status === 'pending';
              return (
                <li key={a.id} className="group relative flex items-stretch transition-colors hover:bg-muted/50">
                  <span aria-hidden className={cn('w-1 shrink-0', priorityBar[a.priority])} />
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/announcements/${a.id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">
                          <FormattedText text={a.title} format={a.title_format} />
                        </p>
                        {a.is_featured && <Star className="size-3.5 shrink-0 fill-current text-tone-warning" />}
                        {a.attachments?.length > 0 && (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground"
                            title={`${a.attachments.length} attachment(s)`}
                          >
                            <Paperclip className="size-3" />
                            {a.attachments.length}
                          </span>
                        )}
                      </div>
                      {text && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{text}</p>}
                      <p className={cn(type.caption, 'mt-1 flex flex-wrap items-center gap-x-1.5')}>
                        <span className="font-medium text-foreground/80">{a.creator.full_name}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{a.creator.role}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(a.created_at)}</span>
                      </p>
                    </div>
                    <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 sm:flex">
                      <Pill>{typeLabel(a.announcement_type)}</Pill>
                      <Pill tone={priorityTone[a.priority]}>
                        {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}
                      </Pill>
                      {tab === 'all' && <Pill tone={statusTone[a.status]}>{statusLabel(a.status)}</Pill>}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  {canApprove && (
                    <div className="flex items-center pr-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-tone-success hover:text-tone-success"
                        onClick={() => handleApprove(a.id)}
                      >
                        <Check />
                        {t('announcements.common.approve', 'Approve')}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
