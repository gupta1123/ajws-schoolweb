// src/lib/api/principal-messaging.ts

import { apiClient } from './client';

export interface PrincipalClassDivision {
  id: string;
  academic_year_id: string;
  class_level_id: string;
  division: string;
  teacher_id: string | null;
  created_at: string;
  academic_year: {
    year_name: string;
  };
  class_level: {
    name: string;
    sequence_number: number;
  };
  teacher: {
    id: string;
    full_name: string;
  } | null;
}

export interface PrincipalClassDivisionsResponse {
  status: string;
  data: {
    class_divisions: PrincipalClassDivision[];
  };
}

export interface PrincipalTeacherAssignment {
  assignment_id: string;
  class_division_id: string;
  class_name: string;
  academic_year: string;
  subject?: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_date: string;
}

export interface PrincipalTeacherAssignments {
  total: number;
  primary_classes: PrincipalTeacherAssignment[];
  subject_teacher_assignments: PrincipalTeacherAssignment[];
  assistant_assignments: PrincipalTeacherAssignment[];
  substitute_assignments: PrincipalTeacherAssignment[];
}

export interface PrincipalTeacherSummary {
  total_classes: number;
  primary_teacher_for: number;
  subject_teacher_for: number;
  assistant_teacher_for: number;
  substitute_teacher_for: number;
  subjects_taught: string[];
  has_assignments: boolean;
}

export interface PrincipalStaffInfo {
  staff_id: string;
  department: string;
  designation: string;
  is_active: boolean;
}

export interface PrincipalTeacher {
  teacher_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  staff_info: PrincipalStaffInfo | null;
  assignments: PrincipalTeacherAssignments;
  summary: PrincipalTeacherSummary;
}

export interface PrincipalTeachersWithAssignmentsResponse {
  status: string;
  data: {
    teachers: PrincipalTeacher[];
    total: number;
    summary: {
      total_teachers: number;
      teachers_with_assignments: number;
      teachers_without_assignments: number;
      total_primary_assignments: number;
      total_subject_assignments: number;
    };
  };
}

export interface PrincipalDivisionTeacher {
  assignment_id: string;
  teacher_id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  assignment_type: string;
  subject: string | null;
  is_primary: boolean;
  assigned_date: string;
}

export interface PrincipalDivisionMessage {
  id: string;
  content: string;
  sender_id: string;
  sender: {
    id: string;
    full_name: string;
  };
  created_at: string;
  thread_id: string;
  message_type: string;
}

export interface PrincipalDivisionThread {
  thread_id: string;
  thread_title: string;
  thread_type: string;
  created_at: string;
  updated_at: string;
  participants: Array<{
    user_id: string;
    role: string;
    full_name: string;
    user_role: string;
  }>;
  messages: Array<{
    message_id: string;
    content: string;
    message_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    sender: {
      id: string;
      full_name: string;
      role: string;
      email: string;
    };
    attachments: unknown[];
  }>;
}

export interface PrincipalDivisionParent {
  id: string;
  name: string;
  email: string | null;
  phone_number: string;
  relationship: string;
  is_primary_guardian: boolean;
}

export interface PrincipalDivisionStudent {
  student: {
    id: string;
    name: string;
    roll_number: string;
  };
  parents: PrincipalDivisionParent[];
}

export interface PrincipalDivisionParentsResponse {
  status: string;
  data: {
    class_division_id: string;
    students: PrincipalDivisionStudent[];
    total_students: number;
    total_parents: number;
    summary: {
      students_with_parents: number;
      students_without_parents: number;
    };
  };
}

export interface PrincipalDivisionMessagesResponse {
  status: string;
  data: {
    class_division: {
      id: string;
      class_name: string;
      academic_year: string;
      division: string;
    };
    teachers: PrincipalDivisionTeacher[];
    messages?: PrincipalDivisionMessage[];
    threads?: PrincipalDivisionThread[];
    total_messages: number;
    pagination?: {
      page: number;
      limit: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    filters_applied?: {
      start_date: string | null;
      end_date: string | null;
      message_type: string;
      class_division_id: string;
    };
    summary: {
      total_teachers: number;
      class_teachers: number;
      subject_teachers: number;
      assistant_teachers?: number;
      substitute_teachers?: number;
      total_threads?: number;
      messages_found: number;
      unique_senders?: number;
    };
  };
}

export const principalMessagingServices = {
  // Get all class divisions
  getClassDivisions: async (token: string): Promise<PrincipalClassDivisionsResponse> => {
    const response = await apiClient.get<PrincipalClassDivisionsResponse['data']>('/api/academic/class-divisions', token);

    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch class divisions');
    }

    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    throw new Error('Invalid response format from API');
  },

  // Get teachers with assignments
  getTeachersWithAssignments: async (token: string): Promise<PrincipalTeachersWithAssignmentsResponse> => {
    const response = await apiClient.get<PrincipalTeachersWithAssignmentsResponse['data']>('/api/academic/teachers-with-assignments', token);

    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch teachers');
    }

    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    throw new Error('Invalid response format from API');
  },

  // Get division messages and teachers
  getDivisionMessages: async (divisionId: string, token: string): Promise<PrincipalDivisionMessagesResponse> => {
    const response = await apiClient.get<PrincipalDivisionMessagesResponse['data']>(`/api/users/principal/division/${divisionId}/messages`, token);

    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch division messages');
    }

    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    throw new Error('Invalid response format from API');
  },

  // Get division parents
  getDivisionParents: async (divisionId: string, token: string): Promise<PrincipalDivisionParentsResponse> => {
    const response = await apiClient.get<PrincipalDivisionParentsResponse['data']>(`/api/users/division/${divisionId}/parents`, token);

    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch division parents');
    }

    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    throw new Error('Invalid response format from API');
  }
};
