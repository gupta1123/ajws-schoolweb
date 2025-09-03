// src/app/(teacher)/classes/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  User, 
  Phone, 
  BookOpen,
  Filter,
  Grid,
  List,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StudentCard } from '@/components/students/student-card';
import { classesServices } from '@/lib/api/classes';
import { ClassDivision, Student } from '@/types/classes';
import { formatDate } from '@/lib/utils';

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassDivision | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Extract class ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: classIdFromParams } = resolvedParams;
      
      // Fetch class and student data
      const fetchClassData = async () => {
        if (!token || !classIdFromParams) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // Fetch students for this class
          const response = await classesServices.getStudentsByClass(classIdFromParams, token);

          // Handle Blob response (shouldn't happen for JSON endpoints)
          if (response instanceof Blob) {
            setError('Unexpected response format from API');
            return;
          }

          // Handle error response
          if ('status' in response && response.status === 'error') {
            setError(response.message || 'Failed to fetch class data');
            return;
          }

          // Handle successful response
          if ('status' in response && response.status === 'success' && 'data' in response) {
            const successResponse = response as { data: { students: Student[]; count: number } };
            setStudents(successResponse.data.students);

            // For now, create a mock class structure since we don't have a specific API for class details
            // In a real implementation, you'd fetch class details separately
            setClassData({
              id: classIdFromParams,
              division: 'A', // This would come from the API
              class_level: { id: '1', name: 'Grade 5', sequence_number: 5 },
              teacher: { id: user?.id || '', full_name: user?.full_name || '' },
              student_count: successResponse.data.count
            });
          } else {
            setError('Failed to fetch class data');
          }
        } catch (err) {
          setError('An error occurred while fetching class data');
          console.error('Error fetching class data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchClassData();
    };
    
    extractId();
  }, [params, token, user?.id, user?.full_name]);

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

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-600">Loading class details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error || !classData) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Class</h2>
            <p className="text-gray-600 mb-4">{error || 'Class not found'}</p>
            <Button onClick={() => router.back()}>
              ← Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Filter and sort students based on search term and sort criteria
  const filteredAndSortedStudents = students
    .filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.includes(searchTerm) ||
      student.student_academic_records.find(record => 
        record.roll_number.includes(searchTerm)
      )
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'roll') {
        const aRoll = a.student_academic_records.find(record => record.class_division_id === classData?.id)?.roll_number || '';
        const bRoll = b.student_academic_records.find(record => record.class_division_id === classData?.id)?.roll_number || '';
        return aRoll.localeCompare(bRoll);
      }
      return 0;
    });

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back to Classes
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{classData.class_level.name} - {classData.division}</h1>
              <p className="text-gray-600 dark:text-gray-300">
                {classData.class_level.name} • {classData.student_count} students
              </p>
            </div>
            <Button asChild>
              <Link href="/homework/create">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Homework
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
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
                  <option value="roll">Sort by Roll Number</option>
                </select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {filteredAndSortedStudents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No students match your search.' : 'No students enrolled in this class.'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedStudents.map((student) => {
                const academicRecord = student.student_academic_records.find(record => record.class_division_id === classData?.id);
                return (
                  <StudentCard
                    key={student.id}
                    id={student.id}
                    name={student.full_name}
                    rollNumber={academicRecord?.roll_number || 'N/A'}
                    admissionNumber={student.admission_number}
                    dateOfBirth={student.date_of_birth}
                    phoneNumber="N/A" // Not available in current API response
                    attendanceRate={85} // Not available in current API response
                    homeworkCompletion={80} // Not available in current API response
                    recentClasswork="N/A" // Not available in current API response
                    upcomingBirthdays={false} // Not available in current API response
                    unreadMessages={0} // Not available in current API response
                    behaviorScore={85} // Not available in current API response
                  />
                );
              })}
            </div>
          ) : (
            // List View
            <Card>
              <CardHeader>
                <CardTitle>Student List</CardTitle>
                <CardDescription>
                  Detailed list of students in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium">Roll Number</th>
                        <th className="text-left p-4 font-medium">Admission Number</th>
                        <th className="text-left p-4 font-medium">Date of Birth</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedStudents.map((student) => {
                        const academicRecord = student.student_academic_records.find(record => record.class_division_id === classData?.id);
                        return (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <div className="font-medium">{student.full_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {academicRecord?.roll_number ? `Roll #${academicRecord.roll_number}` : 'No roll number'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium">
                                {academicRecord?.roll_number || 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium">
                                {student.admission_number}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium">
                                {formatDate(student.date_of_birth)}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className={`font-medium ${
                                student.status === 'active' ? 'text-green-500' : 
                                student.status === 'inactive' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                {student.status}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="outline" size="sm" className="mr-2" asChild>
                                <Link href={`/messages?studentId=${student.id}`}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Message
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/students/${student.id}`}>
                                  View
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Class Summary</CardTitle>
              <CardDescription>
                Overview of class performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{classData.student_count}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {students.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {students.filter(s => s.status === 'inactive').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inactive Students</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">
                    {classData.class_level.sequence_number}
                  </div>
                  <div className="text-sm text-muted-foreground">Grade Level</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}