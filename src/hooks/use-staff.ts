import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { staffServices } from '@/lib/api';
import type { Staff, CreateStaffRequest, CreateStaffWithUserRequest, UpdateStaffRequest } from '@/types/staff';

interface TeacherClassesResponse {
  status: string;
  data: {
    teacher: {
      id: string;
      full_name: string;
    };
    assignments: Array<{
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
    }>;
    primary_classes: Array<{
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
    }>;
    total_assignments: number;
    has_assignments: boolean;
  };
}

interface TeacherDivisionSummaryResponse {
  status: string;
  data: {
    summary: {
      total_students: number;
      total_classes: number;
      subjects_taught: string[];
      class_assignments: Array<{
        class_name: string;
        student_count: number;
        subjects: string[];
      }>;
    };
  };
}

interface UseStaffReturn {
  // Data
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
  
  // Actions
  fetchStaff: (params?: {
    department?: string;
    role?: string;
    subject?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createStaff: (data: CreateStaffRequest) => Promise<boolean>;
  createStaffWithUser: (data: CreateStaffWithUserRequest) => Promise<boolean>;
  updateStaff: (id: string, data: UpdateStaffRequest) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  syncTeachersToStaff: () => Promise<boolean>;
  assignSubjectsToTeacher: (teacherId: string, data: { subjects: string[]; mode: 'replace' | 'append' }) => Promise<{
    status: string;
    data: {
      teacher_id: string;
      teacher_name: string;
      assigned_subjects: string[];
      total_subjects: number;
      mode: string;
      previous_subjects: string[];
      message: string;
    };
  } | null>;
  
  // Teacher-specific data
  getTeacherClasses: (teacherId: string) => Promise<TeacherClassesResponse | null>;
  getTeacherDivisionSummary: (teacherId: string) => Promise<TeacherDivisionSummaryResponse | null>;
  
  // Utility functions
  clearError: () => void;
  refreshStaff: () => Promise<void>;
}

export const useStaff = (): UseStaffReturn => {
  const { token } = useAuth();
  
  // Data states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null>(null);

  // Fetch staff members
  const fetchStaff = useCallback(async (params?: {
    department?: string;
    role?: string;
    subject?: string;
    page?: number;
    limit?: number;
  }) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch staff list
      const staffResponse = await staffServices.getStaff(token, params);
      
      if (staffResponse.status === 'success') {
        // Fetch teachers mapping to get teacher_id for each staff member
        try {
          const teachersResponse = await staffServices.getTeachersMapping(token);
          
          if (teachersResponse.status === 'success') {
            // Create a map of staff_id/user_id to teacher data (includes subjects_taught)
            const teacherMap = new Map<string, { teacher_id: string; subjects_taught?: string[] }>();

            teachersResponse.data.teachers.forEach((teacher) => {
              const value = { teacher_id: teacher.teacher_id, subjects_taught: teacher.subjects_taught };
              if (teacher.staff_id) {
                teacherMap.set(teacher.staff_id, value);
              }
              if (teacher.user_id) {
                teacherMap.set(teacher.user_id, value);
              }
            });

            // Enrich staff data with teacher_id and subjects_taught from teachers API
            const enrichedStaff = staffResponse.data.staff.map((staffMember) => {
              const mapEntry = teacherMap.get(staffMember.id) || teacherMap.get(staffMember.user_id || '');
              const subjectsFromTeachers = mapEntry?.subjects_taught || [];

              return {
                ...staffMember,
                teacher_id: mapEntry?.teacher_id || undefined,
                teaching_details: {
                  ...staffMember.teaching_details,
                  // Always prefer teachers API subjects, if provided
                  subjects_taught: subjectsFromTeachers.length > 0
                    ? subjectsFromTeachers
                    : (staffMember.teaching_details?.subjects_taught || []),
                },
              };
            });

            setStaff(enrichedStaff);
            setPagination(staffResponse.data.pagination);
          } else {
            // If teachers mapping fails, still show staff data without teacher_id
            setStaff(staffResponse.data.staff);
            setPagination(staffResponse.data.pagination);
          }
        } catch (teachersErr) {
          console.warn('Failed to fetch teachers mapping, showing staff without teacher_id:', teachersErr);
          // Still show staff data without teacher_id
          setStaff(staffResponse.data.staff);
          setPagination(staffResponse.data.pagination);
        }
      } else {
        setError('Failed to fetch staff');
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create staff member (without user account)
  const createStaff = useCallback(async (data: CreateStaffRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.createStaff(data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to create staff member');
        return false;
      }
    } catch (err) {
      console.error('Create staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Create staff member with user account
  const createStaffWithUser = useCallback(async (data: CreateStaffWithUserRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.createStaffWithUser(data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to create staff member with user account');
        return false;
      }
    } catch (err) {
      console.error('Create staff with user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create staff member with user account');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Update staff member
  const updateStaff = useCallback(async (id: string, data: UpdateStaffRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.updateStaff(id, data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to update staff member');
        return false;
      }
    } catch (err) {
      console.error('Update staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Delete staff member
  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.deleteStaff(id, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete staff member');
        return false;
      }
    } catch (err) {
      console.error('Delete staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Sync teachers to staff
  const syncTeachersToStaff = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.syncTeachersToStaff(token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to sync teachers to staff');
        return false;
      }
    } catch (err) {
      console.error('Sync teachers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync teachers to staff');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh staff list

  // Refresh staff list
  const refreshStaff = useCallback(async () => {
    await fetchStaff();
  }, [fetchStaff]);

  // Get teacher's classes
  const getTeacherClasses = useCallback(async (teacherId: string) => {
    if (!token) return null;
    
    try {
      const response = await staffServices.getTeacherClasses(teacherId, token);
      return response;
    } catch (err) {
      console.error('Get teacher classes error:', err);
      return null;
    }
  }, [token]);

  // Get teacher's division summary
  const getTeacherDivisionSummary = useCallback(async (teacherId: string) => {
    if (!token) return null;

    try {
      const response = await staffServices.getTeacherDivisionSummary(teacherId, token);
      return response;
    } catch (err) {
      console.error('Get teacher division summary error:', err);
      return null;
    }
  }, [token]);

  // Assign subjects to teacher
  const assignSubjectsToTeacher = useCallback(async (teacherId: string, data: { subjects: string[]; mode: 'replace' | 'append' }) => {
    if (!token) return null;

    try {
      const response = await staffServices.assignSubjectsToTeacher(teacherId, data, token);
      return response;
    } catch (err) {
      console.error('Assign subjects to teacher error:', err);
      return null;
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token, fetchStaff]);

  return {
    staff,
    loading,
    error,
    pagination,
    clearError,
    fetchStaff,
    createStaff,
    createStaffWithUser,
    updateStaff,
    deleteStaff,
    syncTeachersToStaff,
    getTeacherClasses,
    getTeacherDivisionSummary,
    assignSubjectsToTeacher,
    refreshStaff
  };
};
