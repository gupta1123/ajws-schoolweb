import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';

// Student Types based on API documentation
export interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  date_of_birth: string;
  admission_date: string;
  status: string;
  profile_photo_path?: string;
  profile_photo_url?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  student_academic_records: StudentAcademicRecord[];
  parent_mappings?: ParentStudentMapping[];
}

export interface StudentAcademicRecord {
  id: string;
  roll_number: string;
  status: string;
  class_division: {
    id: string;
    division: string;
    class_level: {
      id: string;
      name: string;
      sequence_number: number;
    };
    teacher?: {
      id: string;
      full_name: string;
    };
  };
}

export interface ParentStudentMapping {
  id: string;
  relationship: string;
  is_primary_guardian: boolean;
  access_level: string;
  parent: {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string;
  };
}

export interface CreateStudentRequest {
  admission_number: string;
  full_name: string;
  date_of_birth: string;
  admission_date: string;
  class_division_id: string;
  roll_number: string;
  phone_number?: string;
  email?: string;
}

export interface UpdateStudentRequest {
  full_name?: string;
}

export interface LinkParentRequest {
  parent_id: string;
  relationship: 'father' | 'mother' | 'guardian';
  is_primary_guardian: boolean;
  access_level: 'full' | 'restricted' | 'readonly';
}

export interface LinkParentResponse {
  mappings: Array<{
    id: string;
    parent_id: string;
    student_id: string;
    relationship: string;
    is_primary_guardian: boolean;
    access_level: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface StudentsListResponse {
  students: Student[];
  count: number;
  total_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: {
    search?: string;
    class_division_id?: string;
    class_level_id?: string;
    academic_year_id?: string;
    status?: string;
    unlinked_only?: boolean;
  };
  available_filters: {
    academic_years: Array<{
      id: string;
      year_name: string;
    }>;
    class_levels: Array<{
      id: string;
      name: string;
      sequence_number: number;
    }>;
    class_divisions: Array<{
      id: string;
      division: string;
      level: {
        id: string;
        name: string;
      };
      teacher: {
        id: string;
        full_name: string;
      };
      academic_year: {
        id: string;
        year_name: string;
      };
    }>;
  };
}

export interface StudentDetailsResponse {
  student: Student;
}

export interface StudentsByClassResponse {
  class_division: {
    id: string;
    division: string;
    level: {
      name: string;
      sequence_number: number;
    };
    teacher: {
      id: string;
      full_name: string;
    };
  };
  students: Student[];
  count: number;
  total_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StudentsByLevelResponse {
  class_level: {
    id: string;
    name: string;
    sequence_number: number;
  };
  class_divisions: Array<{
    id: string;
    division: string;
    teacher: {
      id: string;
      full_name: string;
    };
  }>;
  students: Student[];
  count: number;
}

export interface ClassDivisionsSummaryResponse {
  divisions: Array<{
    id: string;
    division: string;
    level: {
      id: string;
      name: string;
      sequence_number: number;
    };
    teacher: {
      id: string;
      full_name: string;
    };
    student_count: number;
  }>;
  total_divisions: number;
  total_students: number;
}

export interface ProfilePhotoResponse {
  student_id: string;
  profile_photo_path: string;
  profile_photo_url: string;
}

export const studentServices = {
  // Get all students with filters and pagination
  getAllStudents: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      class_division_id?: string;
      class_level_id?: string;
      academic_year_id?: string;
      status?: string;
      unlinked_only?: boolean;
    }
  ): Promise<ApiResponseWithCache<StudentsListResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.class_division_id) queryParams.append('class_division_id', params.class_division_id);
    if (params?.class_level_id) queryParams.append('class_level_id', params.class_level_id);
    if (params?.academic_year_id) queryParams.append('academic_year_id', params.academic_year_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.unlinked_only !== undefined) queryParams.append('unlinked_only', params.unlinked_only.toString());

    const url = `/api/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Create a new student
  createStudent: async (data: CreateStudentRequest, token: string): Promise<ApiResponse<Student> | ApiErrorResponse | Blob> => {
    return apiClient.post('/api/students', data, token);
  },

  // Update student information (sends complete payload)
  updateStudent: async (
    studentId: string,
    data: UpdateStudentRequest,
    token: string
  ): Promise<ApiResponse<StudentDetailsResponse> | ApiErrorResponse> => {
    return apiClient.put(`/api/students/${studentId}`, data, token);
  },

  // Get student details by ID
  getStudentById: async (studentId: string, token: string): Promise<ApiResponseWithCache<StudentDetailsResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/students/${studentId}`, token);
  },

  // Link student to parent using the correct API endpoint
  linkStudentToParent: async (
    studentId: string,
    data: LinkParentRequest,
    token: string
  ): Promise<ApiResponse<LinkParentResponse> | ApiErrorResponse | Blob> => {
    // Use the correct endpoint from API documentation: /api/academic/link-students
    const payload = {
      parent_id: data.parent_id,
      students: [
        {
          student_id: studentId,
          relationship: data.relationship,
          is_primary_guardian: data.is_primary_guardian,
          access_level: data.access_level
        }
      ]
    };
    return apiClient.post('/api/academic/link-students', payload, token);
  },

  // Get students by class division
  getStudentsByClass: async (
    classDivisionId: string,
    token: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponseWithCache<StudentsByClassResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/students/class/${classDivisionId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Get students by class level
  getStudentsByLevel: async (
    classLevelId: string,
    token: string
  ): Promise<ApiResponseWithCache<StudentsByLevelResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/students/level/${classLevelId}`, token);
  },

  // Get class divisions summary
  getClassDivisionsSummary: async (token: string, params?: { academic_year_id?: string }): Promise<ApiResponseWithCache<ClassDivisionsSummaryResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.academic_year_id) queryParams.append('academic_year_id', params.academic_year_id);

    const url = `/api/students/divisions/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Get teacher-specific division summary
  getTeacherDivisionSummary: async (
    token: string,
    teacherId: string,
    params?: { academic_year_id?: string }
  ): Promise<ApiResponseWithCache<ClassDivisionsSummaryResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.academic_year_id) queryParams.append('academic_year_id', params.academic_year_id);

    const url = `/api/students/divisions/teacher/${teacherId}/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Upload student profile photo
  uploadProfilePhoto: async (
    studentId: string,
    photoFile: File,
    token: string
  ): Promise<ApiResponse<ProfilePhotoResponse> | Blob> => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    // Note: This would need to be implemented in the apiClient to handle FormData
    // For now, we'll use a direct fetch call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ajws-school-ba8ae5e3f955.herokuapp.com'}/api/students/${studentId}/profile-photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload profile photo');
    }

    return response.json();
  },
};
