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


// The staff and teacher lists are slow, and several parts of a page ask for the
// same one at once (list, profile, phone-duplicate check). Share the in-flight
// request and reuse the result briefly; any write below clears it.
const SHARE_MS = 20_000;
const shared = new Map<string, { at: number; promise: Promise<unknown> }>();
const sharedGet = <T>(token: string, key: string, load: () => Promise<T>): Promise<T> => {
  // Cached authenticated responses must stay within the requesting account.
  const cacheKey = `${token}:${key}`;
  const hit = shared.get(cacheKey);
  if (hit && Date.now() - hit.at < SHARE_MS) return hit.promise as Promise<T>;
  const promise = load().catch((e) => {
    shared.delete(cacheKey);
    throw e;
  });
  shared.set(cacheKey, { at: Date.now(), promise });
  return promise;
};
export const invalidateStaffCache = () => shared.clear();

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
    return sharedGet(token, `staff:${url}`, async () => (await apiClient.get(url, token)) as StaffListResponse);
  },

  // Get teachers mapping (includes subjects_taught)
  getTeachersMapping: async (token: string): Promise<{
    status: string;
    data: {
      teachers: Array<{
        teacher_id: string;
        staff_id: string;
        user_id: string;
        full_name: string;
        phone_number?: string;
        email?: string | null;
        department?: string;
        designation?: string;
        is_active?: boolean;
        subjects_taught?: string[];
      }>;
    };
  }> => {
    const response = await sharedGet(token, 'teachers', () => apiClient.get('/api/academic/teachers', token));
    return response as {
      status: string;
      data: {
        teachers: Array<{
          teacher_id: string;
          staff_id: string;
          user_id: string;
          full_name: string;
          phone_number?: string;
          email?: string | null;
          department?: string;
          designation?: string;
          is_active?: boolean;
          subjects_taught?: string[];
        }>;
      };
    };
  },

  // Sync teachers to staff table
  syncTeachersToStaff: async (token: string): Promise<StaffSyncResponse> => {
    const response = await apiClient.post('/api/lists/staff/sync', {}, token);
    invalidateStaffCache();
    return response as StaffSyncResponse;
  },

  // Create staff member with user account
  createStaffWithUser: async (data: CreateStaffWithUserRequest, token: string): Promise<StaffWithUserResponse> => {
    const response = await apiClient.post('/api/lists/staff/with-user', data, token);
    invalidateStaffCache();
    return response as StaffWithUserResponse;
  },

  // Create staff member (without user account)
  createStaff: async (data: CreateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.post('/api/lists/staff', data, token);
    invalidateStaffCache();
    return response as StaffResponse;
  },

  // Update staff member
  updateStaff: async (id: string, data: UpdateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.put(`/api/lists/staff/${id}`, data, token);
    invalidateStaffCache();
    return response as StaffResponse;
  },

  // Date of birth lives behind its own admin-only endpoint
  updateStaffDateOfBirth: async (id: string, dateOfBirth: string, token: string) => {
    return apiClient.put(`/api/users/staff/${id}/date-of-birth`, { date_of_birth: dateOfBirth }, token).finally(invalidateStaffCache);
  },

  // Keep the login account in step with the staff record (name, phone, email)
  updateUserAccount: async (userId: string, data: { full_name?: string; phone_number?: string; email?: string }, token: string) => {
    return apiClient.put(`/api/users/${userId}`, data, token).finally(invalidateStaffCache);
  },

  // Delete staff member
  deleteStaff: async (id: string, token: string): Promise<DeleteStaffResponse> => {
    const response = await apiClient.delete(`/api/lists/staff/${id}`, token);
    invalidateStaffCache();
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
    invalidateStaffCache();
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
