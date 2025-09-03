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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);

  // Fetch teacher assignments and homework data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.log('No token available, skipping API call');
        return;
      }
    
    
      const teacherResponse = await academicServices.getMyTeacherClasses(token);
      if (teacherResponse.status === 'success' && teacherResponse.data) {
        // Extract unique subjects from teacher assignments
        const subjects = Array.from(new Set(
          teacherResponse.data.assigned_classes
            .map((assignment: TeacherAssignment) => assignment.subject)
            .filter((subject): subject is string => subject !== undefined && subject !== null) // Filter out undefined/null subjects
        ));
        setTeacherSubjects(subjects);
        
        // Extract unique classes from teacher assignments
        const classes = Array.from(new Set(
          teacherResponse.data.assigned_classes
            .map((assignment: TeacherAssignment) => `${assignment.class_level} - Section ${assignment.division}`)
        ));
        setTeacherClasses(classes);
        
        console.log('Teacher assignments:', teacherResponse.data);
        console.log('Teacher subjects:', subjects);
        console.log('Teacher classes:', classes);
      } else {
        console.log('No teacher assignments found or API error:', teacherResponse);
        // Set empty arrays as fallback
        setTeacherSubjects([]);
        setTeacherClasses([]);
      }
      
      // Fetch homework data
      const homeworkResponse = await homeworkServices.getHomework(token);
      if (homeworkResponse.status === 'success' && homeworkResponse.data) {
        // The homework response should already include attachments data
        // If not, we can fetch them individually as needed
        const homeworkWithAttachments = homeworkResponse.data.homework.map(hw => {
          // Ensure attachments array exists, even if empty
          return {
            ...hw,
            attachments: hw.attachments || []
          };
        });
        
        // Sort by due_date in descending order (newest first)
        const sortedHomework = homeworkWithAttachments.sort((a, b) =>
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );
        setHomework(sortedHomework);
        setFilteredHomework(sortedHomework);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);



  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      console.log('No token available, skipping API call');
    }
  }, [token, fetchData]);

  // Refresh data when page becomes visible (e.g., returning from create/edit)
  useEffect(() => {
    const handleFocus = () => {
      if (token && !loading) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, loading, fetchData]);

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

    // Sort filtered results by due_date in descending order (newest first)
    const sortedFiltered = filtered.sort((a, b) =>
      new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
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
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
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
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="flex items-center justify-center h-full">
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
      const response = await homeworkServices.deleteHomework(id, token || '');
      if (response.status === 'success') {
        setHomework(prev => prev.filter(hw => hw.id !== id));
        toast({
          title: "Success",
          description: "Homework assignment deleted successfully!",
        });
      }
    } catch (error) {
      console.error('Error deleting homework:', error);
        toast({
          title: "Error",
          description: "Failed to delete homework assignment",
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
          <p className="mt-2 text-gray-600">Loading homework...</p>
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
                  placeholder="Search homework..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
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
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
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
              <Button asChild size="lg">
                <Link href="/homework/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Homework
                </Link>
              </Button>

            </div>
          </CardContent>
        </Card>

        {/* Homework Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Homework Assignments</CardTitle>
            <CardDescription>
              List of homework assignments you&apos;ve created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-sm text-muted-foreground">{assignment.description}</div>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No homework found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No homework matches your search.' : 'You haven\'t created any homework yet.'}
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/homework/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Homework
                    </Link>
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