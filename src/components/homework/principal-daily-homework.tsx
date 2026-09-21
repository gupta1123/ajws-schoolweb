// src/components/homework/principal-daily-homework.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';
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

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Science': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'English': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Hindi': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Social Studies': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[subject] || colors['default'];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('homework.principal.title', 'Today\'s Homework')}
          </CardTitle>
          <CardDescription>
            {t('homework.principal.subtitle', 'Daily homework assigned across all classes')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('homework.principal.title', 'Today\'s Homework')}
            </CardTitle>
            <CardDescription>
              {t('homework.principal.subtitle', 'Daily homework assigned across all classes')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {homework.length} {t('homework.principal.assignments', 'assignments')}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : homework.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-2 text-sm font-medium text-muted-foreground">
              {t('homework.principal.noHomework', 'No homework assigned today')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {t('homework.principal.checkBack', 'Check back later for new assignments')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {homework.map((assignment) => (
              <div 
                key={assignment.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getSubjectColor(assignment.subject).split(' ')[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getSubjectColor(assignment.subject)}`}
                        >
                          {assignment.subject}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(assignment.created_at)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm truncate">{assignment.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{getAssignedToText(assignment)}</span>
                    </div>
                    <div className="truncate">
                      {t('homework.principal.teacher', 'Teacher')}: {assignment.teacher?.full_name || t('common.unknown', 'Unknown')}
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{t('homework.principal.due', 'Due')}: {formatDate(assignment.due_date)}</span>
                      </div>
                    )}
                    {assignment.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{assignment.attachments.length} {t('homework.principal.attachments', 'attachments')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Link href="/homework">
                <Button variant="outline" size="sm" className="w-full">
                  {t('homework.principal.viewAll', 'View All Homework')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
