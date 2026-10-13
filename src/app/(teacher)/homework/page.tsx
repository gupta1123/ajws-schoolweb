// src/app/(teacher)/homework/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, Pill } from '@/components/ui/page-kit';
import { Search, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { homeworkServices } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { Homework } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { cn, formatDate, isHomeworkVisibleByExpiry, sortHomeworkLatestFirst } from '@/lib/utils';
import { subjectText } from '@/components/timetable/timetable-grid';
import { surface } from '@/lib/design/tokens';

interface TeacherAssignment {
  assignment_id: string;
  class_division_id: string;
  division: string;
  class_name: string;
  class_level: string;
  sequence_number: number;
  academic_year: string;
  assignment_type: "class_teacher" | "subject_teacher" | "assistant_teacher" | "substitute_teacher";
  is_primary: boolean;
  assigned_date: string;
  subject?: string;
}



export default function HomeworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const canManageHomework = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'principal';
  const isTeacher = user?.role === 'teacher';
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTargetType, setSelectedTargetType] = useState<'all' | 'class' | 'students'>('all');
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null>(null);

  // Fetch role-specific filter options once
  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      if (user?.role === 'teacher') {
        const teacherResponse = await academicServices.getMyTeacherClasses(token);
        if (teacherResponse.status === 'success' && teacherResponse.data) {
          const subjects = Array.from(new Set(
            teacherResponse.data.assigned_classes
              .map((assignment: TeacherAssignment) => assignment.subject)
              .filter((subject): subject is string => subject !== undefined && subject !== null)
          ));
          setTeacherSubjects(subjects);

          const classes = Array.from(new Set(
            teacherResponse.data.assigned_classes
              .map((assignment: TeacherAssignment) => `${assignment.class_level} - Section ${assignment.division}`)
          ));
          setTeacherClasses(classes);
        } else {
          setTeacherSubjects([]);
          setTeacherClasses([]);
        }
        return;
      }

      if (user?.role === 'admin' || user?.role === 'principal') {
        const summaryResponse = await academicServices.getClassDivisionsSummary(token);
        if (summaryResponse.status === 'success' && summaryResponse.data) {
          const classes = Array.from(new Set(
            summaryResponse.data.divisions.map(
              division => `${division.level.name} - Section ${division.division}`
            )
          ));
          const subjects = Array.from(new Set(
            summaryResponse.data.divisions.flatMap(division =>
              (division.subjects || []).map(subject => subject.name).filter(Boolean)
            )
          ));
          setTeacherClasses(classes);
          setTeacherSubjects(subjects);
        } else {
          setTeacherSubjects([]);
          setTeacherClasses([]);
        }
        return;
      }

      setTeacherSubjects([]);
      setTeacherClasses([]);
    } catch (error) {
      console.error('Error fetching homework filters:', error);
      setTeacherSubjects([]);
      setTeacherClasses([]);
    }
  }, [token, user?.role]);
  // Fetch homework with pagination/filters
  const fetchHomework = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const homeworkResponse = await homeworkServices.getHomework(token, {
        page: currentPage,
        limit,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        target_type: selectedTargetType !== 'all' ? selectedTargetType : undefined,
      });
      if (homeworkResponse.status === 'success' && homeworkResponse.data) {
        const homeworkWithAttachments = homeworkResponse.data.homework
          .filter(isHomeworkVisibleByExpiry)
          .map(hw => ({
            ...hw,
            attachments: hw.attachments || []
          }));
        // The API returns created_at DESC, due_date DESC. Keep the same order
        // client-side as a safeguard when older backend deployments are used.
        const sortedHomework = sortHomeworkLatestFirst(homeworkWithAttachments);
        setHomework(sortedHomework);
        setPagination(homeworkResponse.data.pagination || null);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast({ title: t('common.error', 'Error'), description: t('homeworkTeacher.list.fetchFailed', 'Failed to fetch data'), variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, limit, selectedSubject, selectedTargetType, t]);



  // Fetch assignments once, then homework when pagination/filters change
  useEffect(() => {
    if (token && user?.role) fetchAssignments();
  }, [token, user?.role, fetchAssignments]);

  useEffect(() => {
    if (token) fetchHomework();
  }, [token, fetchHomework]);

  // Refresh homework when page becomes visible (e.g., returning from create/edit)
  useEffect(() => {
    const handleFocus = () => {
      if (token) fetchHomework();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, fetchHomework]);

  const handlePageChange = (page: number) => {
    if (!pagination) return;
    if (page < 1 || page > pagination.total_pages) return;
    setCurrentPage(page);
  };

  // Filter homework based on search term, filters, and role scope
  useEffect(() => {
    const roleScopedHomework = isTeacher ? homework.filter(hw => {
      const classKey = `${hw.class_division.level.name} - Section ${hw.class_division.division}`;
      return teacherClasses.includes(classKey) && 
             (teacherSubjects.includes(hw.subject) || teacherSubjects.length === 0);
    }) : homework;

    // Then apply search and filter criteria
    const filtered = roleScopedHomework.filter((assignment: Homework) =>
      (assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              `${assignment.class_division.level.name} - Section ${assignment.class_division.division}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedClass === 'all' || `${assignment.class_division.level.name} - Section ${assignment.class_division.division}` === selectedClass)
    );

    const sortedFiltered = sortHomeworkLatestFirst(filtered);

    setFilteredHomework(sortedFiltered);
  }, [homework, teacherClasses, teacherSubjects, searchTerm, selectedSubject, selectedClass, isTeacher]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('auth.loading', 'Loading authentication...')}</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('auth.title', 'Sign in to your account')}</h2>
          <p className="text-gray-600">{t('homeworkTeacher.authRequired', 'Please log in to access this page.')}</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4"
          >
            {t('homeworkTeacher.goToLogin', 'Go to Login')}
          </Button>
        </div>
      </div>
    );
  }

  if (!canManageHomework) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('homeworkTeacher.access.manageOnly', 'Only teachers, admins, and principals can access this page.')}</p>
        </div>
      </div>
    );
  }



  const handleDelete = async (id: string) => {
    try {
      const response = await homeworkServices.deleteHomework(id, token || '');
      if (response.status === 'success') {
        setHomework(prev => prev.filter(hw => hw.id !== id));
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.delete.success', 'Homework assignment deleted successfully!'),
        });
      }
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.delete.failed', 'Failed to delete homework assignment'),
        variant: "error",
      });
    } finally {
      setPendingDelete(null);
    }
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
      ? `${count} ${t('homeworkTeacher.list.students', 'students')}`
      : t('homeworkTeacher.list.noStudentsAssigned', 'No students assigned');
  };

  // Group by due date so "what's due next" reads first
  type GroupKey = 'today' | 'tomorrow' | 'week' | 'later' | 'none' | 'past';
  const groupMeta: Record<GroupKey, { label: string; urgent?: boolean; showDate?: boolean }> = {
    today: { label: t('homeworkTeacher.group.today', 'Due today'), urgent: true },
    tomorrow: { label: t('homeworkTeacher.group.tomorrow', 'Due tomorrow') },
    week: { label: t('homeworkTeacher.group.week', 'This week'), showDate: true },
    later: { label: t('homeworkTeacher.group.later', 'Later'), showDate: true },
    none: { label: t('homeworkTeacher.list.noDueDate', 'No due date') },
    past: { label: t('homeworkTeacher.group.past', 'Past due'), showDate: true },
  };
  const bucketOf = (date: string | null): GroupKey => {
    if (!date) return 'none';
    const due = new Date(date);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - startOfToday.getTime()) / 86400000);
    if (diff < 0) return 'past';
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    return diff <= 7 ? 'week' : 'later';
  };
  const groups = (['today', 'tomorrow', 'week', 'later', 'none', 'past'] as GroupKey[])
    .map((key) => ({
      key,
      ...groupMeta[key],
      items: filteredHomework
        .filter((hw) => bucketOf(hw.due_date) === key)
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')),
    }))
    .filter((g) => g.items.length > 0);

  const activeFilters = selectedSubject !== 'all' || selectedClass !== 'all' || selectedTargetType !== 'all' || !!searchTerm;
  const filterTrigger = 'h-9 w-auto min-w-[9.5rem] gap-2';

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('homeworkTeacher.list.search', 'Search homework...')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setCurrentPage(1); }}>
            <SelectTrigger aria-label={t('homeworkTeacher.table.subject', 'Subject')} className={filterTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('homeworkTeacher.filters.allSubjects', 'All Subjects')}</SelectItem>
              {teacherSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger aria-label={t('homeworkTeacher.table.class', 'Class')} className={filterTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('homeworkTeacher.filters.allClasses', 'All Classes')}</SelectItem>
              {teacherClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTargetType} onValueChange={(v) => { setSelectedTargetType(v as typeof selectedTargetType); setCurrentPage(1); }}>
            <SelectTrigger aria-label={t('homeworkTeacher.table.assignedTo', 'Assigned To')} className={filterTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('homeworkTeacher.filters.allTargets', 'All Assignments')}</SelectItem>
              <SelectItem value="class">{t('homeworkTeacher.filters.classTarget', 'Entire Class')}</SelectItem>
              <SelectItem value="students">{t('homeworkTeacher.filters.studentTarget', 'Selected Students')}</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/homework/create">
              <Plus />
              {t('homeworkTeacher.create.cta', 'Create Homework')}
            </Link>
          </Button>
        </div>

        {/* List, grouped by when the work is due */}
        <div className={cn(surface.panel, 'overflow-hidden')}>
          {loading ? (
            <ul className="divide-y" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filteredHomework.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={t('homeworkTeacher.empty.title', 'No homework found')}
              help={
                activeFilters
                  ? t('homeworkTeacher.empty.noMatch', 'No homework matches your search.')
                  : t('homeworkTeacher.empty.none', "You haven't created any homework yet.")
              }
            />
          ) : (
            groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <div className="flex items-baseline gap-2 border-b bg-muted/40 px-4 py-1.5">
                  <h3 className={cn('text-xs font-semibold uppercase tracking-wide', group.urgent ? 'text-tone-warning' : 'text-muted-foreground')}>
                    {group.label}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">{group.items.length}</span>
                </div>
                <ul className="divide-y border-b last:border-b-0">
                  {group.items.map((assignment) => {
                    const individual = (assignment.target_type || 'class') === 'students';
                    const classLabel = `${assignment.class_division.level.name} · ${assignment.class_division.division}`;
                    return (
                      <li
                        key={assignment.id}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[8rem_minmax(0,1fr)_auto]"
                      >
                        <p className="col-span-2 text-xs font-semibold tabular-nums text-foreground md:col-span-1 md:text-sm">
                          {classLabel}
                        </p>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-snug">{assignment.title}</p>
                          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={cn('shrink-0 font-medium', subjectText(assignment.subject))}>{assignment.subject}</span>
                            {assignment.description && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">{assignment.description}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {individual && (
                            <span title={getAssignedToText(assignment)}>
                              <Pill tone="violet">
                                {t('homeworkTeacher.target.individual', 'Individual')}
                                {' · '}
                                {assignment.student_targets?.length || assignment.target_student_ids?.length || 0}
                              </Pill>
                            </span>
                          )}
                          {group.showDate && assignment.due_date && (
                            <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{formatDate(assignment.due_date)}</span>
                          )}
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" asChild aria-label={t('actions.edit', 'Edit')} title={t('actions.edit', 'Edit')}>
                              <Link href={`/homework/edit/${assignment.id}`}>
                                <Edit />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:bg-tone-danger-soft hover:text-tone-danger"
                              aria-label={t('actions.delete', 'Delete')}
                              title={t('actions.delete', 'Delete')}
                              onClick={() => setPendingDelete(assignment.id)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
              <p className="text-xs text-muted-foreground tabular-nums">
                {((currentPage - 1) * limit) + 1}–{Math.min(currentPage * limit, pagination.total)} {t('pagination.of', 'of')} {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={!pagination.has_prev}>
                  {t('pagination.previous', 'Previous')}
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage} / {pagination.total_pages}
                </span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={!pagination.has_next}>
                  {t('pagination.next', 'Next')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('homeworkTeacher.delete.title', 'Delete this homework?')}</DialogTitle>
              <DialogDescription>
                {t('homeworkTeacher.delete.description', 'Students and parents will no longer see it. This cannot be undone.')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPendingDelete(null)}>
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button variant="destructive" onClick={() => pendingDelete && handleDelete(pendingDelete)}>
                {t('actions.delete', 'Delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
