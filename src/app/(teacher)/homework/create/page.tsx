// src/app/(teacher)/homework/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { homeworkServices } from '@/lib/api/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { HomeworkForm, type HomeworkFormValues } from '@/components/homework/homework-form';
import { HomeworkAccess } from '@/components/homework/homework-access';
import { useHomeworkOptions } from '@/components/homework/use-homework-options';
import { AnnouncementFilePicker } from '@/components/announcements/announcement-attachments';

export default function CreateHomeworkPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const options = useHomeworkOptions();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (v: HomeworkFormValues) => {
    if (!token) return;
    setSubmitting(true);
    try {
      // due dates run to the end of the chosen day
      const due = v.due_date ? new Date(`${v.due_date}T00:00:00`) : null;
      due?.setHours(23, 59, 59, 999);

      const response = await homeworkServices.createHomework(
        {
          class_division_id: v.class_division_id,
          subject: v.subject,
          title: v.title.trim(),
          description: v.description,
          due_date: due ? due.toISOString() : null,
          target_type: v.target_type,
          ...(v.target_type === 'students' ? { student_ids: v.student_ids } : {}),
        },
        token
      );
      if (response.status !== 'success' || !('data' in response) || !response.data?.homework?.id) {
        throw new Error('Failed to create homework');
      }

      if (files.length > 0) {
        try {
          const upload = await homeworkServices.uploadAttachments(response.data.homework.id, files, token);
          if (upload.status !== 'success') throw new Error('upload failed');
        } catch (uploadError) {
          console.error('Error uploading homework files:', uploadError);
          toast({
            title: t('homeworkTeacher.form.uploadFailed', 'Homework created, but file upload failed'),
            description: t('homeworkTeacher.form.retryEdit', 'You can add the files again from the edit page.'),
            variant: 'error',
          });
        }
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('homeworkTeacher.create.success', 'Homework created successfully!'),
        variant: 'success',
      });
      router.push('/homework');
    } catch (error) {
      console.error('Error creating homework:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.create.failed', 'Failed to create homework assignment'),
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HomeworkAccess>
      <HomeworkForm
        mode="create"
        attachments={<AnnouncementFilePicker files={files} onChange={setFiles} disabled={submitting} />}
        {...options}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/homework')}
      />
    </HomeworkAccess>
  );
}
