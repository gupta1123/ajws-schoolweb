// src/app/(teacher)/homework/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { homeworkServices } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { Homework } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
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

  // Fetch teacher assignments (subjects + classes) once
  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
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
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
    }
  }, [token]);

  // Fetch homework with pagination/filters
  const fetchHomework = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const homeworkResponse = await homeworkServices.getHomework(token, {
        page: currentPage,
        limit,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
      });
      if (homeworkResponse.status === 'success' && homeworkResponse.data) {
        const homeworkWithAttachments = homeworkResponse.data.homework.map(hw => ({
          ...hw,
          attachments: hw.attachments || []
        }));
        // Sort latest to oldest by created_at
        const sortedHomework = homeworkWithAttachments.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setHomework(sortedHomework);
        setPagination(homeworkResponse.data.pagination || null);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast({ title: t('common.error', 'Error'), description: t('homeworkTeacher.list.fetchFailed', 'Failed to fetch data'), variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, limit, selectedSubject, t]);



  // Fetch assignments once, then homework when pagination/filters change
  useEffect(() => {
    if (token) fetchAssignments();
  }, [token, fetchAssignments]);

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

  // Filter homework based on search term, filters, and teacher assignments
  useEffect(() => {
    // First filter by teacher's assigned classes and subjects
    const filteredByTeacher = homework.filter(hw => {
      const classKey = `${hw.class_division.level.name} - Section ${hw.class_division.division}`;
      return teacherClasses.includes(classKey) && 
             (teacherSubjects.includes(hw.subject) || teacherSubjects.length === 0);
    });

    // Then apply search and filter criteria
    const filtered = filteredByTeacher.filter((assignment: Homework) =>
      (assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              `${assignment.class_division.level.name} - Section ${assignment.class_division.division}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedClass === 'all' || `${assignment.class_division.level.name} - Section ${assignment.class_division.division}` === selectedClass)
    );

    // Sort filtered results latest to oldest by created_at
    const sortedFiltered = filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredHomework(sortedFiltered);
  }, [homework, teacherClasses, teacherSubjects, searchTerm, selectedSubject, selectedClass]);

  // Debug: Log authentication state
  console.log('Auth state:', { user, token: !!token, isAuthenticated, authLoading });

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.teachersOnlyPage', 'Only teachers can access this page.')}</p>
        </div>
      </div>
    );
  }

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
    }
  };



  // Date formatting is now handled by the formatDate utility function from @/lib/utils



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('homeworkTeacher.list.loading', 'Loading homework...')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('homeworkTeacher.list.search', 'Search homework...')} 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedSubject}
                  onChange={(e) => { setSelectedSubject(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">{t('homeworkTeacher.filters.allSubjects', 'All Subjects')}</option>
                  {teacherSubjects.length > 0 ? (
                    teacherSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))
                  ) : (
                    <option value="" disabled>{t('homeworkTeacher.filters.noSubjects', 'No subjects assigned')}</option>
                  )}
                </select>
                <select 
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="all">{t('homeworkTeacher.filters.allClasses', 'All Classes')}</option>
                  {teacherClasses.length > 0 ? (
                    teacherClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))
                  ) : (
                    <option value="" disabled>{t('homeworkTeacher.filters.noClasses', 'No classes assigned')}</option>
                  )}
                </select>
              </div>
              <Button asChild size="lg">
                <Link href="/homework/create">
                  <Plus className="mr-2 h-5 w-5" />
                  {t('homeworkTeacher.create.cta', 'Create Homework')}
                </Link>
              </Button>

            </div>
          </CardContent>
        </Card>

        {/* Homework Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('homeworkTeacher.list.title', 'Homework Assignments')}</CardTitle>
            <CardDescription>
              {t('homeworkTeacher.list.subtitle', "List of homework assignments you've created")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('homeworkTeacher.table.subject', 'Subject')}</TableHead>
                    <TableHead>{t('homeworkTeacher.table.title', 'Title')}</TableHead>
                    <TableHead>{t('homeworkTeacher.table.class', 'Class')}</TableHead>
                    <TableHead>{t('homeworkTeacher.table.dueDate', 'Due Date')}</TableHead>
                    <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHomework.map((assignment) => (
                    <TableRow key={assignment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {assignment.subject}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium truncate cursor-help">{assignment.title}</div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-medium">{assignment.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-sm text-muted-foreground truncate">{assignment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{`${assignment.class_division.level.name} - Section ${assignment.class_division.division}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(assignment.due_date)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" asChild>
                          <Link href={`/homework/edit/${assignment.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredHomework.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('homeworkTeacher.empty.title', 'No homework found')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? t('homeworkTeacher.empty.noMatch', 'No homework matches your search.') : t('homeworkTeacher.empty.none', "You haven't created any homework yet.")}
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/homework/create">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('homeworkTeacher.create.cta', 'Create Homework')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  {t('pagination.showing', 'Showing')} {((currentPage - 1) * limit) + 1} {t('pagination.to', 'to')} {Math.min(currentPage * limit, pagination.total)} {t('pagination.of', 'of')} {pagination.total} {t('pagination.results', 'results')}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.has_prev}
                  >
                    {t('pagination.previous', 'Previous')}
                  </Button>
                  <span className="flex items-center px-3 py-2 text-sm">
                    {t('pagination.page', 'Page')} {currentPage} {t('pagination.of', 'of')} {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next}
                  >
                    {t('pagination.next', 'Next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
