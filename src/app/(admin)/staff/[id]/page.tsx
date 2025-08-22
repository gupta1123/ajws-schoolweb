// src/app/(admin)/staff/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BookOpen,
  ArrowLeft,
  Shield,
  Users,
  GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { staffServices } from '@/lib/api/staff';
import type { Staff } from '@/types/staff';

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

interface TeacherAssignment {
  assignment_id: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary: boolean;
  assigned_date: string;
  class_info: {
    class_division_id: string;
    division: string;
    class_name: string;
    class_level: string;
    sequence_number: number;
    academic_year: string;
  };
  subject?: string;
}

interface TeacherClassAssignment {
  assignment_id: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_date: string;
  class_info: {
    class_division_id: string;
    division: string;
    class_name: string;
    class_level: string;
    sequence_number: number;
    academic_year: string;
  };
  subject?: string;
}

interface TeacherClassesResponse {
  status: string;
  data?: {
    primary_classes?: TeacherClassAssignment[];
    assignments?: TeacherClassAssignment[];
  };
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [staffId, setStaffId] = useState<string>('');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Extract staff ID from params
  useEffect(() => {
    const extractId = async () => {
      try {
        const resolvedParams = await params;
        setStaffId(resolvedParams.id);
      } catch (error) {
        console.error('Error extracting params:', error);
      }
    };
    extractId();
  }, [params]);

  // Fetch staff details
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!token || !staffId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch staff list with teacher mapping (same as main staff list)
        const staffResponse = await staffServices.getStaff(token, { page: 1, limit: 1000 });
        
        if (staffResponse.status === 'success') {
          // Fetch teachers mapping to get teacher_id for each staff member
          try {
            const teachersResponse = await staffServices.getTeachersMapping(token);
            
            if (teachersResponse.status === 'success') {
              // Create a map of staff_id/user_id to teacher_id
              const teacherMap = new Map<string, string>();
              
              teachersResponse.data.teachers.forEach(teacher => {
                // Map by staff_id (preferred) or user_id
                if (teacher.staff_id) {
                  teacherMap.set(teacher.staff_id, teacher.teacher_id);
                }
                if (teacher.user_id) {
                  teacherMap.set(teacher.user_id, teacher.teacher_id);
                }
              });
              
              console.log('Teacher mapping:', Object.fromEntries(teacherMap));
              
              // Find the specific staff member and enrich with teacher_id
              const foundStaff = staffResponse.data.staff.find(s => s.id === staffId);
              if (foundStaff) {
                const enrichedStaff = {
                  ...foundStaff,
                  teacher_id: teacherMap.get(foundStaff.id) || teacherMap.get(foundStaff.user_id || '') || undefined
                };
                
                console.log('Staff member found:', enrichedStaff);
                console.log('Teacher ID:', enrichedStaff.teacher_id);
                console.log('User ID:', enrichedStaff.user_id);
                console.log('Role:', enrichedStaff.role);
                setStaff(enrichedStaff);
              } else {
                setError('Staff member not found');
              }
            } else {
              // If teachers mapping fails, still show staff data without teacher_id
              const foundStaff = staffResponse.data.staff.find(s => s.id === staffId);
              if (foundStaff) {
                console.log('Staff member found (without teacher mapping):', foundStaff);
                setStaff(foundStaff);
              } else {
                setError('Staff member not found');
              }
            }
          } catch (teachersErr) {
            console.warn('Failed to fetch teachers mapping, showing staff without teacher_id:', teachersErr);
            // Still show staff data without teacher_id
            const foundStaff = staffResponse.data.staff.find(s => s.id === staffId);
          if (foundStaff) {
              console.log('Staff member found (without teacher mapping):', foundStaff);
            setStaff(foundStaff);
          } else {
            setError('Staff member not found');
            }
          }
        } else {
          setError('Failed to fetch staff details');
        }
      } catch (err) {
        console.error('Fetch staff details error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staff details');
      } finally {
        setLoading(false);
      }
    };

    if (token && staffId) {
      fetchStaffDetails();
    }
  }, [token, staffId]);

  // Fetch teacher assignments
  useEffect(() => {
    const fetchTeacherAssignments = async () => {
      if (!token || !staffId || !staff || staff.role !== 'teacher' || !staff.teacher_id) return;

      console.log('Fetching teacher assignments for teacher_id:', staff.teacher_id);
      console.log('Staff data in fetchTeacherAssignments:', staff);

      try {
        setAssignmentsLoading(true);
        // Fetch teacher assignments using the teacher_id
        const response: TeacherClassesResponse = await staffServices.getTeacherClasses(staff.teacher_id, token);

        console.log('Teacher classes API response:', response);

        if (response?.status === 'success' && response.data) {
          console.log('Full API response data:', response.data);
          
          // Transform the response to match our interface
          const allAssignments: TeacherAssignment[] = [];
          
          // Handle primary class assignments (class_teacher)
          if (response.data.primary_classes && response.data.primary_classes.length > 0) {
            const primaryAssignments = response.data.primary_classes.map((assignment: TeacherClassAssignment) => ({
              assignment_id: assignment.assignment_id,
              assignment_type: 'class_teacher' as const,
              is_primary: assignment.is_primary,
              assigned_date: assignment.assigned_date,
              class_info: {
                class_division_id: assignment.class_info.class_division_id,
                division: assignment.class_info.division,
                class_name: assignment.class_info.class_name,
                class_level: assignment.class_info.class_level,
                sequence_number: assignment.class_info.sequence_number,
                academic_year: assignment.class_info.academic_year
              }
            }));
            allAssignments.push(...primaryAssignments);
          }
          
          // Handle subject teacher assignments
          if (response.data.assignments && response.data.assignments.length > 0) {
            const subjectAssignments = response.data.assignments
              .filter((assignment: TeacherClassAssignment) => assignment.assignment_type === 'subject_teacher')
              .map((assignment: TeacherClassAssignment) => ({
                assignment_id: assignment.assignment_id,
                assignment_type: 'subject_teacher' as const,
                is_primary: assignment.is_primary,
                assigned_date: assignment.assigned_date,
                class_info: {
                  class_division_id: assignment.class_info.class_division_id,
                  division: assignment.class_info.division,
                  class_name: assignment.class_info.class_name,
                  class_level: assignment.class_info.class_level,
                  sequence_number: assignment.class_info.sequence_number,
                  academic_year: assignment.class_info.academic_year
                },
                subject: assignment.subject
              }));
            allAssignments.push(...subjectAssignments);
          }
          
          console.log('Transformed assignments:', allAssignments);
          setTeacherAssignments(allAssignments);
        } else {
          console.error('Error fetching teacher assignments:', response);
        }
      } catch (err) {
        console.error('Fetch teacher assignments error:', err);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    if (token && staffId && staff?.role === 'teacher' && staff.teacher_id) {
      fetchTeacherAssignments();
    } else {
      console.log('Not fetching teacher assignments because:', {
        hasToken: !!token,
        hasStaffId: !!staffId,
        hasStaff: !!staff,
        isTeacher: staff?.role === 'teacher',
        hasTeacherId: !!staff?.teacher_id
      });
    }
  }, [token, staffId, staff]);

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading staff details...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !staff) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Staff
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Shield className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Staff Details</h2>
              <p className="text-gray-600 mb-4">{error || 'Staff member not found'}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Get class teacher assignments
  const classTeacherAssignments = teacherAssignments.filter(assignment => assignment.assignment_type === 'class_teacher');

  // Get subject teacher assignments
  const subjectTeacherAssignments = teacherAssignments.filter(assignment => assignment.assignment_type === 'subject_teacher');

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                  {staff.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl font-bold text-foreground">{staff.full_name}</h1>
                <p className="text-muted-foreground mt-1">{staff.phone_number}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Class Assignments - Only for teachers */}
          {staff?.role === 'teacher' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Class Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {assignmentsLoading ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading assignments...</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Class Teacher assignments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Class Teacher
                        </h4>
                      </div>

                                            {classTeacherAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {classTeacherAssignments.map((assignment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div>
                                <p className="font-medium">
                                  {assignment.class_info?.class_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.class_info?.academic_year}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-muted/30 rounded-lg">
                          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No class teacher assignments</p>
                        </div>
                      )}
                    </div>

                    {/* Subject Teacher assignments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Subject Teaching
                        </h4>
                      </div>

                                            {subjectTeacherAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {subjectTeacherAssignments.map((assignment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                              <div>
                                <p className="font-medium">
                                  {assignment.class_info?.class_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.subject || 'Subject Teacher'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-muted/30 rounded-lg">
                          <GraduationCap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">No subject teaching assignments</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
