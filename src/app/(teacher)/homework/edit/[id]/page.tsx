// src/app/(teacher)/homework/edit/[id]/page.tsx

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/page-kit';
import { toISODate } from '@/components/calendar/event-pickers';
import { homeworkServices } from '@/lib/api/homework';
import type { Homework } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { HomeworkForm, type HomeworkFormValues } from '@/components/homework/homework-form';
import { HomeworkAccess } from '@/components/homework/homework-access';
import { HomeworkAttachments } from '@/components/homework/homework-attachments';
import { useHomeworkOptions } from '@/components/homework/use-homework-options';

type PageProps = { params: Promise<{ id: string }> };

export default function EditHomeworkPage({ params }: PageProps) {
  const { id } = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const options = useHomeworkOptions();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await homeworkServices.getHomeworkById(token, id);
        const found = response.status === 'success' && 'data' in response ? response.data?.homework : undefined;
        if (cancelled) return;
        if (found) setHomework(found);
        else setFailed(true);
      } catch (error) {
        console.error('Error fetching homework:', error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const handleSubmit = async (v: HomeworkFormValues) => {
    if (!token) return;
    setSaving(true);
    try {
      // due dates run to the end of the chosen day
      const due = v.due_date ? new Date(`${v.due_date}T00:00:00`) : null;
      due?.setHours(23, 59, 59, 999);

      const response = await homeworkServices.updateHomework(
        id,
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
      if (response.status !== 'success') throw new Error('Failed to update homework');
      toast({
        title: t('common.success', 'Success'),
        description: t('homeworkTeacher.edit.success', 'Homework updated successfully!'),
        variant: 'success',
      });
      router.push('/homework');
    } catch (error) {
      console.error('Error updating homework:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.edit.failed', 'Failed to update homework'),
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // keep the homework's current class selectable even if it is not in the user's list
  const classes =
    homework && !options.classes.some((c) => c.id === homework.class_division_id)
      ? [
          { id: homework.class_division_id, label: `${homework.class_division.level.name} · ${homework.class_division.division}` },
          ...options.classes,
        ]
      : options.classes;

  return (
    <HomeworkAccess>
      {loading ? (
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]" aria-busy>
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ) : failed || !homework ? (
        <div className="mx-auto w-full max-w-md py-10">
          <EmptyState
            icon={<BookOpen />}
            title={t('homeworkTeacher.edit.errorTitle', 'Error Loading Homework')}
            help={t('homeworkTeacher.edit.notFound', 'Homework not found')}
          />
          <div className="mt-2 text-center">
            <Button variant="outline" onClick={() => router.push('/homework')}>
              {t('homeworkTeacher.create.back', 'Back to Homework')}
            </Button>
          </div>
        </div>
      ) : (
        <HomeworkForm
          mode="edit"
          initial={{
            class_division_id: homework.class_division_id ?? '',
            subject: homework.subject ?? '',
            title: homework.title ?? '',
            description: homework.description ?? '',
            due_date: homework.due_date ? toISODate(new Date(homework.due_date)) : '',
            target_type: homework.target_type || 'class',
            student_ids:
              homework.target_student_ids || homework.student_targets?.map((s) => s.student_id).filter(Boolean) || [],
          }}
          attachments={token ? <HomeworkAttachments homeworkId={homework.id} token={token} /> : null}
          {...options}
          classes={classes}
          submitting={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/homework')}
        />
      )}
    </HomeworkAccess>
  );
}
