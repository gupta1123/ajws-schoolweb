import { apiClient } from './client';
import type {
  CreateStaffRequest,
  CreateStaffWithUserRequest,
  UpdateStaffRequest,
  StaffListResponse,
  StaffResponse,
  StaffSyncResponse,
  StaffWithUserResponse,
  DeleteStaffResponse
} from '@/types/staff';

export const staffServices = {
  // List all staff members
  getStaff: async (
    token: string,
    params?: {
      department?: string;
      role?: string;
      subject?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<StaffListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/lists/staff${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url, token);
    return response as StaffListResponse;
  },

  // Get teachers mapping
  getTeachersMapping: async (token: string): Promise<{
    status: string;
    data: {
      teachers: Array<{
        teacher_id: string;
        staff_id: string;
        user_id: string;
        full_name: string;
        role: string;
      }>;
    };
  }> => {
    const response = await apiClient.get('/api/academic/teachers', token);
    return response as {
      status: string;
      data: {
        teachers: Array<{
          teacher_id: string;
          staff_id: string;
          user_id: string;
          full_name: string;
          role: string;
        }>;
      };
    };
  },

  // Sync teachers to staff table
  syncTeachersToStaff: async (token: string): Promise<StaffSyncResponse> => {
    const response = await apiClient.post('/api/lists/staff/sync', {}, token);
    return response as StaffSyncResponse;
  },

  // Create staff member with user account
  createStaffWithUser: async (data: CreateStaffWithUserRequest, token: string): Promise<StaffWithUserResponse> => {
    const response = await apiClient.post('/api/lists/staff/with-user', data, token);
    return response as StaffWithUserResponse;
  },

  // Create staff member (without user account)
  createStaff: async (data: CreateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.post('/api/lists/staff', data, token);
    return response as StaffResponse;
  },

  // Update staff member
  updateStaff: async (id: string, data: UpdateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.put(`/api/lists/staff/${id}`, data, token);
    return response as StaffResponse;
  },

  // Delete staff member
  deleteStaff: async (id: string, token: string): Promise<DeleteStaffResponse> => {
    const response = await apiClient.delete(`/api/lists/staff/${id}`, token);
    return response as DeleteStaffResponse;
  },

  // Get teacher's classes
  getTeacherClasses: async (teacherId: string, token: string): Promise<{
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
  }> => {
    const response = await apiClient.get(`/api/academic/teachers/${teacherId}/classes`, token);
    return response as {
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
    };
  },

  // Get teacher's division summary
  getTeacherDivisionSummary: async (teacherId: string, token: string): Promise<{
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
  }> => {
    const response = await apiClient.get(`/api/students/divisions/teacher/${teacherId}/summary`, token);
    return response as {
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
    };
  },

  // Assign subjects to teacher
  assignSubjectsToTeacher: async (
    teacherId: string,
    data: {
      subjects: string[];
      mode: 'replace' | 'append';
    },
    token: string
  ): Promise<{
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
  }> => {
    const response = await apiClient.post(`/api/academic/teachers/${teacherId}/subjects`, data, token);
    return response as {
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
    };
  }
};
