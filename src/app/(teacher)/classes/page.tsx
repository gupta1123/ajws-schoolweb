// src/app/(teacher)/classes/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClassCard } from '@/components/classes/class-card';
import { academicServices } from '@/lib/api/academic';
import { useI18n } from '@/lib/i18n/context';

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
  const { t } = useI18n();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);

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
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.teachersOnlyPage', 'Only teachers can access this page.')}</p>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">{t('classes.loading', 'Loading classes...')}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('classes.title', 'My Classes')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('classes.subtitle', 'Manage your classes and view student information')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Class Cards Grid */}
            {classes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('classes.emptyTitle', 'No classes found')}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('classes.noAssigned', "You don't have any classes assigned to you yet.")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
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
