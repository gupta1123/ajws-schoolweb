// src/lib/api/teachers.ts

import { apiClient } from './client';

export interface TeacherAssignment {
  assignment_id: string;
  class_division_id: string;
  class_name: string;
  academic_year: string;
  subject?: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_date: string;
}

export interface TeacherAssignments {
  total: number;
  primary_classes: TeacherAssignment[];
  subject_teacher_assignments: TeacherAssignment[];
  assistant_assignments: TeacherAssignment[];
  substitute_assignments: TeacherAssignment[];
}

export interface TeacherSummary {
  total_classes: number;
  primary_teacher_for: number;
  subject_teacher_for: number;
  assistant_teacher_for: number;
  substitute_teacher_for: number;
  subjects_taught: string[];
  has_assignments: boolean;
}

export interface StaffInfo {
  staff_id: string;
  department: string;
  designation: string;
  is_active: boolean;
}

export interface Teacher {
  teacher_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  staff_info: StaffInfo | null;
  assignments: TeacherAssignments;
  summary: TeacherSummary;
}

export interface TeachersWithAssignmentsResponse {
  status: string;
  data: {
    teachers: Teacher[];
    summary: {
      total_teachers: number;
      teachers_with_assignments: number;
      teachers_without_assignments: number;
    };
  };
}

export interface SimpleTeacher {
  teacher_id: string;
  user_id: string;
  staff_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  department: string;
  designation: string;
  is_active: boolean;
}

export interface TeachersResponse {
  status: string;
  data: {
    teachers: SimpleTeacher[];
    total: number;
    message: string;
  };
}

export const teachersServices = {
  getTeachersWithAssignments: async (token: string): Promise<TeachersWithAssignmentsResponse> => {
    const response = await apiClient.get<TeachersWithAssignmentsResponse['data']>('/api/academic/teachers-with-assignments', token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    // Handle error response
    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch teachers');
    }

    // Handle successful response
    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    // Fallback for unexpected response format
    throw new Error('Invalid response format from API');
  },

  getAllTeachers: async (token: string): Promise<TeachersResponse> => {
    const response = await apiClient.get<TeachersResponse['data']>('/api/academic/teachers', token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    // Handle error response
    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch teachers');
    }

    // Handle successful response
    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    // Fallback for unexpected response format
    throw new Error('Invalid response format from API');
  }
};
