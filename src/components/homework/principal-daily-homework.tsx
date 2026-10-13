// src/components/homework/principal-daily-homework.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BookOpen,
  Calendar,
  Users,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { homeworkServices } from '@/lib/api/homework';
import { Homework } from '@/types/homework';
import {
  formatDate,
  formatDateTime,
  isDateOnLocalDay,
  isHomeworkVisibleByExpiry,
  sortHomeworkLatestFirst,
} from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { Panel, RowList, ListRow, Pill, EmptyState, InlineError, PanelSkeleton } from '@/components/ui/page-kit';
import type { Tone } from '@/lib/design/tokens';
import { toast } from '@/hooks/use-toast';

export function PrincipalDailyHomework() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayHomework = useCallback(async () => {
    if (!token) return;
    
    try {
      setError(null);
      const today = new Date();

      // The updated backend guarantees latest-first ordering for this call.
      // Fetch the first (newest) page, then isolate entries created today for
      // the principal's daily portal.
      const homeworkResponse = await homeworkServices.getHomework(token, {
        page: 1,
        limit: 100,
      });

      if (homeworkResponse.status === 'success' && homeworkResponse.data) {
        const todayHomework = sortHomeworkLatestFirst(homeworkResponse.data.homework
          .filter(hw => isDateOnLocalDay(hw.created_at, today))
          .filter(isHomeworkVisibleByExpiry)
          .map(hw => ({
            ...hw,
            attachments: hw.attachments || []
          })));
        setHomework(todayHomework);
      } else {
        const message = homeworkResponse.message || t('homework.principal.fetchFailed', 'Failed to fetch homework data');
        setError(message);
        setHomework([]);
      }
    } catch (error) {
      console.error('Error fetching today homework:', error);
      setError(t('homework.principal.fetchFailed', 'Failed to fetch homework data'));
      toast({ 
        title: t('common.error', 'Error'), 
        description: t('homework.principal.fetchFailed', 'Failed to fetch homework data'), 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchTodayHomework();
  }, [fetchTodayHomework]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodayHomework();
  };

  const getAssignedToText = (assignment: Homework) => {
    if ((assignment.target_type || 'class') === 'class') {
      return `${assignment.class_division.level.name} - Section ${assignment.class_division.division}`;
    }

    const studentNames = assignment.student_targets
      ?.map(target => target.student?.full_name)
      .filter((name): name is string => !!name) || [];

    if (studentNames.length > 0) {
      return studentNames.join(', ');
    }

    const count = assignment.target_student_ids?.length || 0;
    return count > 0
      ? `${count} ${t('homework.principal.students', 'students')}`
      : t('homework.principal.noStudentsAssigned', 'No students assigned');
  };

  const getSubjectTone = (subject: string): Tone => {
    const tones: Record<string, Tone> = {
      Mathematics: 'primary',
      Science: 'success',
      English: 'violet',
      Hindi: 'warning',
      'Social Studies': 'rose',
    };
    return tones[subject] || 'neutral';
  };

  const panelProps = {
    title: t('homework.principal.title', "Today's Homework"),
    icon: <FileText />,
    count: loading ? undefined : `${homework.length} ${t('homework.principal.assignments', 'assignments')}`,
    href: '/homework',
    hrefLabel: t('homework.principal.viewAll', 'View All Homework'),
    flush: true,
    action: (
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleRefresh}
        disabled={refreshing || loading}
        aria-label={t('actions.refresh', 'Refresh')}
      >
        <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>
    ),
  };

  if (loading) {
    return (
      <Panel {...panelProps}>
        <PanelSkeleton />
      </Panel>
    );
  }

  return (
    <Panel {...panelProps}>
      {error ? (
        <InlineError title={error} />
      ) : homework.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('homework.principal.noHomework', 'No homework assigned today')}
          help={t('homework.principal.checkBack', 'Check back later for new assignments')}
        />
      ) : (
        <RowList>
          {homework.map((assignment) => (
            <ListRow
              key={assignment.id}
              title={assignment.title}
              subtitle={assignment.description ? <span className="line-clamp-1">{assignment.description}</span> : undefined}
              trailing={<Pill tone={getSubjectTone(assignment.subject)}>{assignment.subject}</Pill>}
              meta={[
                <span key="u" className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  {getAssignedToText(assignment)}
                </span>,
                <span key="t">
                  {t('homework.principal.teacher', 'Teacher')}: {assignment.teacher?.full_name || t('common.unknown', 'Unknown')}
                </span>,
                assignment.due_date && (
                  <span key="due" className="inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {t('homework.principal.due', 'Due')}: {formatDate(assignment.due_date)}
                  </span>
                ),
                assignment.attachments.length > 0 && (
                  <span key="a" className="inline-flex items-center gap-1">
                    <FileText className="size-3" />
                    {assignment.attachments.length} {t('homework.principal.attachments', 'attachments')}
                  </span>
                ),
                <span key="c">{formatDateTime(assignment.created_at)}</span>,
              ]}
            />
          ))}
        </RowList>
      )}
    </Panel>
  );
}
