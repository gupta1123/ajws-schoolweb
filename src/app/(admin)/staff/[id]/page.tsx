// src/app/(admin)/staff/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Subject } from '@/types/academic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ArrowLeft,
  Shield,
  Users,
  GraduationCap,
  AlertTriangle,
  Plus,
  Edit,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
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

  // Subject management state
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('replace');
  const [subjectAssignmentLoading, setSubjectAssignmentLoading] = useState(false);

  // Available subjects state
  const [availableSubjects, setAvailableSubjects] = useState<Array<{id: string, name: string, code: string, is_active: boolean}>>([]);
  const [availableSubjectsLoading, setAvailableSubjectsLoading] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch available subjects
  const fetchAvailableSubjects = useCallback(async () => {
    if (!token) return;

    try {
      setAvailableSubjectsLoading(true);

      const response = await fetch('https://ajws-school-ba8ae5e3f955.herokuapp.com/api/academic/subjects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Filter only active subjects
        const activeSubjects = result.data.subjects.filter((subject: Subject) => subject.is_active);
        setAvailableSubjects(activeSubjects);
      } else {
        console.error('Failed to fetch subjects:', result);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setAvailableSubjectsLoading(false);
    }
  }, [token]);

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

  // Fetch staff details function
  const fetchStaffDetails = useCallback(async () => {
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
  }, [token, staffId]);

  // Fetch staff details effect
  useEffect(() => {
    if (token && staffId) {
      fetchStaffDetails();
    }
  }, [token, staffId, fetchStaffDetails]);

  // Fetch available subjects effect
  useEffect(() => {
    if (token && staff?.role === 'teacher') {
      fetchAvailableSubjects();
    }
  }, [token, staff?.role, fetchAvailableSubjects]);

  // Fetch teacher subjects
  const fetchTeacherSubjects = useCallback(async () => {
    if (!token || !staffId || !staff || staff.role !== 'teacher' || !staff.teacher_id) return;

    try {
      setSubjectsLoading(true);
      // For now, we'll get subjects from the staff teaching_details
      // In a real scenario, you might want to call a separate API to get current subjects
      if (staff.teaching_details?.subjects_taught) {
        setTeacherSubjects(staff.teaching_details.subjects_taught);
      } else {
        setTeacherSubjects([]);
      }
    } catch (err) {
      console.error('Error fetching teacher subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  }, [token, staffId, staff]);

  // Assign subjects to teacher
  const assignSubjectsToTeacher = async () => {
    if (!token || !staff?.teacher_id || selectedSubjects.length === 0) return;

    try {
      setSubjectAssignmentLoading(true);

      const payload = {
        subjects: selectedSubjects,
        mode: assignmentMode
      };

      const response = await fetch(`https://ajws-school-ba8ae5e3f955.herokuapp.com/api/academic/teachers/${staff.teacher_id}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Update local state with new subjects
        if (assignmentMode === 'replace') {
          setTeacherSubjects(selectedSubjects);
        } else {
          // For append mode, merge with existing subjects
          setTeacherSubjects(prev => [...new Set([...prev, ...selectedSubjects])]);
        }

        // Reset form
        setSelectedSubjects([]);
        setAssignmentMode('replace');
        setShowSubjectDialog(false);

        console.log('Subjects assigned successfully:', result.data);
      } else {
        console.error('Failed to assign subjects:', result);
      }
    } catch (error) {
      console.error('Error assigning subjects:', error);
    } finally {
      setSubjectAssignmentLoading(false);
    }
  };

  // Handle subject selection
  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

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
      fetchTeacherSubjects();
      fetchAvailableSubjects();
    } else {
      console.log('Not fetching teacher assignments because:', {
        hasToken: !!token,
        hasStaffId: !!staffId,
        hasStaff: !!staff,
        isTeacher: staff?.role === 'teacher',
        hasTeacherId: !!staff?.teacher_id
      });
    }
  }, [token, staffId, staff, fetchTeacherSubjects, fetchAvailableSubjects]);



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

 
  const classTeacherAssignments = teacherAssignments.filter(assignment => assignment.assignment_type === 'class_teacher');


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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/staff/${staff.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Edit
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Delete
          </Button>
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

          {/* Subject Management - Only for teachers */}
          {staff?.role === 'teacher' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Teaching Subjects
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubjectDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Manage Subjects
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading subjects...</span>
                  </div>
                ) : teacherSubjects.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {teacherSubjects.map((subject) => (
                        <Badge key={subject} variant="secondary" className="px-3 py-1">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {teacherSubjects.length} subject{teacherSubjects.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">No subjects assigned</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSubjectDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Assign Subjects
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>


        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Delete Staff Member
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{staff?.full_name}&rdquo;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Deleting this staff member will also remove all their assignments and cannot be recovered.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // Handle delete logic here
                  console.log('Delete staff member:', staff?.id);
                  setShowDeleteModal(false);
                }}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Delete Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subject Management Dialog */}
        <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Manage Teaching Subjects
              </DialogTitle>
              <DialogDescription>
                Select subjects for {staff?.full_name} to teach
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Current subjects */}
              {teacherSubjects.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Currently assigned subjects:</Label>
                  <div className="flex flex-wrap gap-1">
                    {teacherSubjects.map((subject) => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Mode */}
              <div className="space-y-2">
                <Label>Assignment Mode</Label>
                <Select
                  value={assignmentMode}
                  onValueChange={(value: 'replace' | 'append') => setAssignmentMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Replace existing subjects
                      </div>
                    </SelectItem>
                    <SelectItem value="append">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Add to existing subjects
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {assignmentMode === 'replace'
                    ? 'This will replace all existing subjects with the selected ones.'
                    : 'This will add the selected subjects to the existing ones.'
                  }
                </p>
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                <Label>Select Subjects *</Label>
                {availableSubjectsLoading ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading subjects...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                    {availableSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.name)}
                          onCheckedChange={() => handleSubjectToggle(subject.name)}
                        />
                        <Label
                          htmlFor={`subject-${subject.id}`}
                          className="text-sm cursor-pointer flex-1 truncate"
                        >
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected subjects preview */}
              {selectedSubjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected subjects ({selectedSubjects.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSubjects.map((subject) => (
                      <Badge key={subject} variant="default" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubjectDialog(false);
                  setSelectedSubjects([]);
                  setAssignmentMode('replace');
                }}
                disabled={subjectAssignmentLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={assignSubjectsToTeacher}
                disabled={subjectAssignmentLoading || selectedSubjects.length === 0}
                className="flex items-center gap-2"
              >
                {subjectAssignmentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Assign {selectedSubjects.length} Subject{selectedSubjects.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
