'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { createAnnouncementsAPI, type Announcement, type AnnouncementType } from '@/lib/api/announcements';
import { AnnouncementForm, type AnnouncementFormValues } from '@/components/announcements/announcement-form';
import { AnnouncementAttachments } from '@/components/announcements/announcement-attachments';
import { emptyAnnouncementFormat } from '@/components/announcements/formatted-text';
import { toISODate } from '@/components/calendar/event-pickers';
import { Skeleton } from '@/components/ui/skeleton';

const SUPPORTED: AnnouncementType[] = ['circular', 'general', 'urgent', 'academic', 'administrative'];
const supportedType = (type: string): AnnouncementType =>
  SUPPORTED.includes(type as AnnouncementType) ? (type as AnnouncementType) : 'general';

export default function AdminEditAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const { t } = useI18n();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id || !token) return;
    (async () => {
      try {
        const response = await createAnnouncementsAPI(token).getAnnouncementById(params.id as string);
        if (response.status !== 'success') throw new Error('Failed to fetch announcement');
        setAnnouncement(response.data.announcement);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        toast({ title: 'Error', description: 'Failed to fetch announcement details', variant: 'error' });
        router.push('/admin/announcements');
      }
    })();
  }, [params.id, token, toast, router]);

  const handleSubmit = async (v: AnnouncementFormValues) => {
    if (!announcement) return;
    try {
      setSaving(true);
      const at = new Date(`${v.announcement_date}T${v.announcement_time}`).toISOString();
      const response = await createAnnouncementsAPI(token!).editAnnouncement(announcement.id, {
        title: v.title,
        content: v.content,
        announcement_type: v.announcement_type,
        priority: v.priority,
        target_roles: v.target_roles,
        target_classes: v.target_classes,
        publish_at: at,
        expires_at: at,
        title_format: v.title_format,
        content_format: v.content_format,
      });
      if (response.status !== 'success') throw new Error(response.message || 'Failed to update announcement');
      toast({
        title: 'Success',
        description: 'Announcement updated successfully and moved to pending for re-approval',
      });
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({ title: 'Error', description: 'Failed to update announcement', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!announcement) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const publishAt = new Date(announcement.publish_at);
  return (
    <AnnouncementForm
      mode="edit"
      priorities={['low', 'medium', 'high']}
      initial={{
        title: announcement.title,
        content: announcement.content,
        announcement_type: supportedType(announcement.announcement_type),
        priority: announcement.priority,
        target_roles: announcement.target_roles,
        target_classes: announcement.target_classes ?? [],
        announcement_date: toISODate(publishAt),
        announcement_time: publishAt.toTimeString().slice(0, 5),
        title_format: announcement.title_format || emptyAnnouncementFormat(),
        content_format: announcement.content_format || emptyAnnouncementFormat(),
      }}
      attachments={<AnnouncementAttachments announcementId={announcement.id} token={token!} canManage />}
      note={{
        text: t('announcements.edit.reapprovalNote', 'Saving moves this announcement back to pending for re-approval.'),
        tone: 'warning',
      }}
      submitting={saving}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/announcements')}
    />
  );
}
