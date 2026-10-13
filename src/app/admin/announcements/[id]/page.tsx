'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarClock, Eye, Megaphone, Pencil, Star, Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, Pill } from '@/components/ui/page-kit';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { createAnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { FormattedText } from '@/components/announcements/formatted-text';
import { AnnouncementAttachments } from '@/components/announcements/announcement-attachments';
import { surface, type, type Tone } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

// Literal classes so Tailwind generates them.
const priorityBar: Record<Announcement['priority'], string> = {
  high: 'bg-tone-danger',
  medium: 'bg-tone-warning',
  low: 'bg-tone-info',
};
const priorityTone: Record<Announcement['priority'], Tone> = { high: 'danger', medium: 'warning', low: 'info' };
const statusTone: Record<Announcement['status'], Tone> = { pending: 'warning', approved: 'success', rejected: 'danger' };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={type.caption}>{label}</p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function AdminAnnouncementViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncement = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const response = await createAnnouncementsAPI(token!).getAnnouncementById(id);
        if (response.status !== 'success') throw new Error('Failed to fetch announcement');
        setAnnouncement(response.data.announcement);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        toast({ title: 'Error', description: 'Failed to fetch announcement details', variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [token, toast]
  );

  useEffect(() => {
    if (params.id && token) fetchAnnouncement(params.id as string);
  }, [params.id, token, fetchAnnouncement]);

  const handleDelete = async () => {
    if (!announcement) return;
    try {
      setDeleting(true);
      const response = await createAnnouncementsAPI(token!).deleteAnnouncement(announcement.id);
      if (response.status !== 'success') throw new Error('Failed to delete announcement');
      toast({ title: 'Success', description: 'Announcement deleted successfully' });
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ title: 'Error', description: 'Failed to delete announcement', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (iso: string, withTime = true) =>
    new Date(iso).toLocaleString(lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className={surface.panel}>
          <EmptyState
            icon={<Megaphone />}
            title={t('announcements.notFound', 'Announcement not found')}
            help={t('announcements.notFoundHelp', "It may have been deleted, or the link is wrong.")}
          />
        </div>
      </div>
    );
  }

  const a = announcement;
  const classNames = a.target_class_names || a.target_classes_detailed?.map((c) => c.name) || a.target_classes || [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article>
          <div className="flex gap-4">
            <span aria-hidden className={cn('w-1 shrink-0 self-stretch rounded-full', priorityBar[a.priority])} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill tone={statusTone[a.status]}>{t(`announcements.status.${a.status}`, cap(a.status))}</Pill>
                <Pill tone="primary">{t(`announcements.type.${a.announcement_type}`, cap(a.announcement_type))}</Pill>
                <Pill tone={priorityTone[a.priority]}>{t(`announcements.priority.${a.priority}`, cap(a.priority))}</Pill>
                {a.is_featured && (
                  <Pill tone="warning">
                    <Star className="mr-1 size-3 fill-current" />
                    {t('announcements.featured', 'Featured')}
                  </Pill>
                )}
              </div>

              <h1 className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight">
                <FormattedText text={a.title} format={a.title_format} />
              </h1>
              <p className={cn(type.caption, 'mt-1')}>
                {a.creator.full_name} · {cap(a.creator.role)} · {fmt(a.created_at, false)}
              </p>

              {a.status === 'rejected' && a.rejection_reason && (
                <div className="mt-4 rounded-lg border border-tone-danger/30 bg-tone-danger-soft p-3">
                  <p className="text-xs font-semibold text-tone-danger">{t('announcements.rejectionReason', 'Rejection reason')}</p>
                  <p className="mt-0.5 text-sm">{a.rejection_reason}</p>
                </div>
              )}

              <div className="mt-5 border-t pt-5 text-[15px] leading-relaxed">
                <FormattedText text={a.content} format={a.content_format} className="whitespace-pre-wrap break-words" />
              </div>

              <div className="mt-8 border-t pt-6">
                <h2 className={cn(type.sectionTitle, 'mb-3')}>{t('announcements.attachments.title', 'Attachments')}</h2>
                <AnnouncementAttachments announcementId={a.id} token={token!} canManage={false} />
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:border-l lg:pl-8">
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => router.push(`/admin/announcements/${a.id}/edit`)}>
              <Pencil />
              {t('actions.edit', 'Edit')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-tone-danger hover:text-tone-danger"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 />
              {t('actions.delete', 'Delete')}
            </Button>
          </div>

          <section className="space-y-4">
            <Row icon={<CalendarClock />} label={t('announcements.details.publishAt', 'Publishes')}>
              {fmt(a.publish_at)}
            </Row>
            <Row icon={<User />} label={t('announcements.details.createdBy', 'Created by')}>
              {a.creator.full_name}
              <span className="ml-1.5 font-normal text-muted-foreground">{cap(a.creator.role)}</span>
            </Row>
            {a.status === 'approved' && a.approver && (
              <Row icon={<User />} label={t('announcements.details.approvedBy', 'Approved by')}>
                {a.approver.full_name}
                {a.approved_at && <span className="ml-1.5 font-normal text-muted-foreground">{fmt(a.approved_at, false)}</span>}
              </Row>
            )}
            <Row icon={<Eye />} label={t('announcements.details.views', 'Views')}>
              {a.view_count ?? 0}
            </Row>
          </section>

          <section className="space-y-3 border-t pt-6">
            <h2 className={type.sectionTitle}>
              <Users className="mr-1.5 inline size-4 text-muted-foreground" />
              {t('announcements.details.audience', 'Audience')}
            </h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {a.target_roles.map((r) => (
                  <Pill key={r} tone="primary">
                    {r === 'student' ? t('announcements.roles.student', 'Specific Class Parents') : r === 'parent' ? t('announcements.roles.parent', 'All Parents') : t(`announcements.roles.${r}`, cap(r))}
                  </Pill>
                ))}
              </div>
              {classNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {classNames.map((name, i) => (
                    <Pill key={`${name}-${i}`}>{name}</Pill>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('announcements.deleteTitle', 'Delete announcement?')}</DialogTitle>
            <DialogDescription>
              {t('announcements.deleteDescription', 'This permanently removes the announcement and its attachments. This cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {t('actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
