// src/app/(teacher)/classwork/page.tsx

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
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Plus, Edit, Trash2, BookOpen, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { classworkServices } from '@/lib/api/classwork';
import { academicServices } from '@/lib/api/academic';
import { Classwork } from '@/types/classwork';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { TruncatedTableCell } from '@/components/ui/truncated-text';

// Interface for the API response structure
interface AssignedClass {
  assignment_id: string;
  class_division_id: string;
  division: string;
  class_name: string;
  class_level: string;
  sequence_number: number;
  academic_year: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary: boolean;
  assigned_date: string;
  subject?: string;
}

// Subject icon mapping
const subjectIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Mathematics: BookOpen,
  Science: BookOpen,
  English: BookOpen,
  History: BookOpen,
  Geography: BookOpen,
  Art: BookOpen,
  Music: BookOpen,
  PE: BookOpen,
  'Foreign Language': BookOpen,
  default: BookOpen
};



export default function ClassworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [classwork, setClasswork] = useState<Classwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchClasswork = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // First fetch teacher assignments
      const teacherResponse = await academicServices.getMyTeacherClasses(token);
      if (teacherResponse.status === 'success' && teacherResponse.data) {

        // Filter for only subject teacher assignments
        const subjectTeacherClasses = teacherResponse.data.assigned_classes.filter(
          (assignment: AssignedClass) => assignment.assignment_type === 'subject_teacher'
        );

        // Extract unique subjects
        const subjects = [...new Set(
          subjectTeacherClasses
            .map((assignment: AssignedClass) => assignment.subject)
            .filter((subject: string | undefined): subject is string => !!subject)
        )];
        setTeacherSubjects(subjects);

        // Extract unique classes
        const classes = [...new Set(
          subjectTeacherClasses
            .map((assignment: AssignedClass) => `${assignment.class_level} - Section ${assignment.division}`)
        )];
        setTeacherClasses(classes);
      }

      // Then fetch classwork data
      const response = await classworkServices.getClasswork(token, currentPage, itemsPerPage, {
        subject: subjectFilter === 'all' ? undefined : subjectFilter,
        class_division_id: classFilter === 'all' ? undefined : classFilter,
      });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        throw new Error('Unexpected response format from API');
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        throw new Error(response.message || 'Failed to fetch classwork');
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        // Sort by date in descending order (newest first)
        const sortedClasswork = response.data.classwork.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setClasswork(sortedClasswork);
        setTotalItems(response.data.total_count);
      }
    } catch (err: unknown) {
      setError('Failed to fetch classwork');
      toast({
        title: 'Error fetching classwork',
        description: err instanceof Error ? err.message : 'Failed to fetch classwork',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, subjectFilter, classFilter, token]);

  useEffect(() => {
    if (token) {
      fetchClasswork();
    }
  }, [fetchClasswork, token]);

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await classworkServices.deleteClasswork(id, token);
      toast({
        title: 'Classwork deleted',
        description: 'Classwork entry deleted successfully!',
        variant: 'success',
      });
      fetchClasswork(); // Refresh the list
    } catch (err: unknown) {
      toast({
        title: 'Error deleting classwork',
        description: err instanceof Error ? err.message : 'Failed to delete classwork',
        variant: 'error',
      });
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Classwork Entries</CardTitle>
            <CardDescription>
              List of classwork entries you&apos;ve recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex justify-end mb-4 md:mb-0 md:order-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/classwork/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Classwork
                  </Link>
                </Button>
              </div>
              <div className="relative w-full md:w-64 md:order-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search classwork..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm w-full md:w-auto"
                >
                  <option value="all">All Subjects</option>
                  {teacherSubjects.length > 0 ? (
                    teacherSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))
                  ) : (
                    <option value="" disabled>No subjects assigned</option>
                  )}
                </select>
                <select 
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm w-full md:w-auto"
                >
                  <option value="all">All Classes</option>
                  {teacherClasses.length > 0 ? (
                    teacherClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))
                  ) : (
                    <option value="" disabled>No classes assigned</option>
                  )}
                </select>
              </div>
            </div>
              
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="ml-4 text-gray-500 dark:text-gray-400">Loading classwork...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
              </div>
            ) : classwork.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>

                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classwork.map((entry) => {
                      const SubjectIcon = subjectIcons[entry.subject] || subjectIcons.default;
                      const classDisplayName = entry.class_division ? `${entry.class_division.level.name} - Section ${entry.class_division.division}` : 'Unknown Class';

                      return (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded">
                                <SubjectIcon className="h-3 w-3 text-primary" />
                              </div>
                              {entry.subject}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                <TruncatedTableCell 
                                  text={entry.summary} 
                                  maxLines={2} 
                                  maxLength={60}
                                />
                              </div>
                              {entry.topics_covered.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm text-muted-foreground cursor-help">
                                        <div className="flex flex-wrap gap-1">
                                          <span className="text-muted-foreground">Topics:</span>
                                          {entry.topics_covered.slice(0, 2).map((topic, index) => (
                                            <span key={index} className="text-primary px-2 py-0.5 text-xs">
                                              {topic.length > 15 ? topic.substring(0, 15) + '...' : topic}
                                            </span>
                                          ))}
                                          {entry.topics_covered.length > 2 && (
                                            <span className="text-muted-foreground text-xs">
                                              +{entry.topics_covered.length - 2} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      className="max-w-xs p-3 bg-black text-white border border-border text-sm shadow-lg"
                                    >
                                      <div className="space-y-2">
                                        <div className="font-medium">All Topics:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {entry.topics_covered.map((topic, index) => (
                                            <span key={index} className="text-white px-2 py-1 text-xs">
                                              {topic}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{classDisplayName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(entry.date)}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/classwork/edit/${entry.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No classwork entries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || subjectFilter !== 'all' || classFilter !== 'all' 
                    ? 'Try adjusting your filters or search term' 
                    : 'Get started by recording your first classwork entry'}
                </p>
                {!(searchTerm || subjectFilter !== 'all' || classFilter !== 'all') && (
                  <Button asChild>
                    <Link href="/classwork/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Classwork
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="mr-2"
                >
                  Previous
                </Button>
                <span className="mx-2 text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-2"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}