// src/app/(teacher)/classes/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClassCard } from '@/components/classes/class-card';
import { academicServices } from '@/lib/api/academic';

interface TeacherClass {
  name: string;
  division: string;
  studentCount: number;
  teacherRole: 'class_teacher' | 'subject_teacher';
  subject?: string;
  classDivisionId: string;
  assignmentId: string;
}

export default function ClassesPage() {
  const { user, token } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!token || !user) return;

      try {
        setLoading(true);
        
        // Get teacher's assigned classes
        const response = await academicServices.getMyTeacherClasses(token);
        
        if (response.status === 'success' && response.data.assigned_classes) {
          // Transform the API data to match our interface
          const transformedClasses: TeacherClass[] = await Promise.all(
            response.data.assigned_classes.map(async (assignment) => {
              // Get student count for this class
              let studentCount = 0;
              try {
                const studentsResponse = await academicServices.getStudentsByClass(
                  assignment.class_division_id, 
                  token
                );
                if (studentsResponse.status === 'success') {
                  studentCount = studentsResponse.data.count;
                }
              } catch (error) {
                console.error('Error fetching student count:', error);
              }

              // Extract division from class_name (e.g., "Grade 1 B" -> "B")
              const division = assignment.division;
              
              // Extract grade name from class_name (e.g., "Grade 1 B" -> "Grade 1")
              const name = assignment.class_level;

              return {
                id: `${assignment.assignment_id}-${assignment.class_division_id}`, // Unique ID combining assignment and class
                name: name,
                division: division,
                studentCount: studentCount,
                teacherRole: assignment.assignment_type === 'class_teacher' ? 'class_teacher' : 'subject_teacher',
                subject: assignment.subject || undefined,
                classDivisionId: assignment.class_division_id,
                assignmentId: assignment.assignment_id
              };
            })
          );

          // Show all assignments - no deduplication needed
          // Each assignment represents a different role or subject for the teacher
          const uniqueClasses = transformedClasses;

          setClasses(uniqueClasses);
        }
      } catch (error) {
        console.error('Error fetching teacher classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherClasses();
  }, [token, user]);

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

  // Filter and sort classes
  const filteredAndSortedClasses = classes
    .filter(cls => 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.division.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'students') {
        return b.studentCount - a.studentCount;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading classes...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Classes</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your classes and view student information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search classes..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="border rounded-md px-3 py-2 text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Sort by Name</option>
                      <option value="students">Sort by Students</option>
                    </select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Cards Grid */}
            {filteredAndSortedClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No classes match your search.' : 'You don\'t have any classes assigned to you yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.assignmentId}
                    name={classItem.name}
                    division={classItem.division}
                    studentCount={classItem.studentCount}
                    teacherRole={classItem.teacherRole}
                    subject={classItem.subject}
                  />
                ))}
              </div>
            )}
          </div>
          

        </div>
      </div>
    </ProtectedRoute>
  );
}