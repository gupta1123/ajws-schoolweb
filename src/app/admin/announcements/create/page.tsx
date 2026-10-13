'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { createAnnouncementsAPI } from '@/lib/api/announcements';
import { AnnouncementForm, type AnnouncementFormValues } from '@/components/announcements/announcement-form';
import { AnnouncementFilePicker } from '@/components/announcements/announcement-attachments';

export default function AdminCreateAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (v: AnnouncementFormValues) => {
    try {
      setLoading(true);
      const api = createAnnouncementsAPI(token!);
      const at = new Date(`${v.announcement_date}T${v.announcement_time}`).toISOString();
      const response = await api.createAnnouncement({
        title: v.title,
        content: v.content,
        announcement_type: v.announcement_type,
        priority: v.priority as 'low' | 'high',
        target_roles: v.target_roles,
        target_classes: v.target_classes,
        publish_at: at,
        expires_at: at,
        title_format: v.title_format,
        content_format: v.content_format,
      });
      if (response.status !== 'success') throw new Error('Failed to create announcement');

      if (files.length > 0) {
        try {
          await api.uploadAttachments(response.data.announcement.id, files);
        } catch (attachmentError) {
          toast({
            title: t('announcements.attachments.uploadFailed', 'Announcement created, but file upload failed'),
            description:
              attachmentError instanceof Error
                ? attachmentError.message
                : t('announcements.attachments.retryEdit', 'You can retry from the edit page.'),
            variant: 'error',
          });
        }
      }
      toast({
        title: t('common.success', 'Success'),
        description: t('announcements.create.autoApproved', 'Announcement created and auto-approved successfully'),
      });
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.create.failed', 'Failed to create announcement'),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnnouncementForm
      mode="create"
      priorities={['low', 'high']}
      attachments={<AnnouncementFilePicker files={files} onChange={setFiles} disabled={loading} />}
      note={{ text: t('announcements.create.autoApprovedNote', 'Published automatically, no approval needed.'), tone: 'info' }}
      submitting={loading}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/announcements')}
    />
  );
}
