import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';

// Parent Types based on API documentation
export interface Parent {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  role: string;
  is_registered: boolean;
  created_at?: string;
  updated_at?: string;
  children?: Array<{
    id: string;
    full_name: string;
    admission_number: string;
    class_division?: {
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
    };
  }>;
}

export interface CreateParentRequest {
  full_name: string;
  phone_number: string;
  email: string;
  initial_password?: string;
  student_details?: Array<{
    admission_number: string;
    relationship: string;
    is_primary_guardian: boolean;
  }>;
}

export interface CreateParentResponse {
  parent: Parent;
  students: Array<{
    id: string;
    admission_number: string;
    full_name: string;
  }>;
  mappings: Array<{
    relationship: string;
    is_primary_guardian: boolean;
    access_level: string;
  }>;
  registration_instructions: {
    message: string;
    endpoint: string;
    required_fields: string[];
  };
}

export interface ParentListResponse {
  parents: Parent[];
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

export interface ParentDetailsResponse {
  // Single parent response from /api/parent-student/parents/:parent_id
  parent: {
    id: string;
    full_name: string;
    phone_number: string;
    email: string | null;
    role: string;
    created_at: string;
    children: Array<{
      id: string;
      full_name: string;
      admission_number: string;
      date_of_birth: string;
      relationship: string;
      is_primary_guardian: boolean;
    }>;
  };
}

export const parentServices = {
  // Create a new parent record using /api/parents endpoint
  createParentDirect: async (data: CreateParentRequest, token: string): Promise<ApiResponse<CreateParentResponse> | ApiErrorResponse | Blob> => {
    return apiClient.post('/api/parents', data, token);
  },

  // Create a new parent record
  createParent: async (data: CreateParentRequest, token: string): Promise<ApiResponse<CreateParentResponse> | ApiErrorResponse | Blob> => {
    return apiClient.post('/api/auth/create-parent', data, token);
  },

  // Get all parents with pagination and filters
  getAllParents: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
    }
  ): Promise<ApiResponseWithCache<ParentListResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/parent-student/parents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Get parent details by ID
  getParentById: async (parentId: string, token: string): Promise<ApiResponseWithCache<ParentDetailsResponse> | ApiErrorResponse | Blob> => {
    // Use the correct endpoint: /api/parent-student/parents/:parent_id
    return apiClient.get(`/api/parent-student/parents/${parentId}`, token);
  },

  // Update parent information
  updateParent: async (
    parentId: string,
    data: Partial<{
      full_name: string;
      phone_number: string;
      email: string;
    }>,
    token: string
  ): Promise<ApiResponse<Parent> | ApiErrorResponse> => {
    return apiClient.put(`/api/parents/${parentId}`, data, token);
  },

  // Delete parent
  deleteParent: async (parentId: string, token: string): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
    return apiClient.delete(`/api/parents/${parentId}`, token);
  },

  // Link parent to student
  linkParentToStudent: async (
    parentId: string,
    studentId: string,
    data: {
      relationship: string;
      is_primary_guardian: boolean;
      access_level: string;
    },
    token: string
  ): Promise<ApiResponse<{ message: string; mapping_id: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post(`/api/students/${studentId}/link-parent`, {
      parent_id: parentId,
      ...data
    }, token);
  },

  // Unlink parent from student
  unlinkParentFromStudent: async (
    mappingId: string,
    token: string
  ): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
    return apiClient.delete(`/api/parent-student/mappings/${mappingId}`, token);
  },

  // Update parent-student relationship
  updateParentStudentRelationship: async (
    mappingId: string,
    data: {
      relationship?: string;
      is_primary_guardian?: boolean;
      access_level?: string;
    },
    token: string
  ): Promise<ApiResponse<{ message: string; mapping: { id: string; relationship: string; is_primary_guardian: boolean; access_level: string } }> | ApiErrorResponse> => {
    return apiClient.put(`/api/academic/update-parent-access/${mappingId}`, data, token);
  },

  // Get parent-student parent count
  getParentStudentCount: async (token: string): Promise<ApiResponseWithCache<{ count: number }> | ApiErrorResponse | Blob> => {
    return apiClient.get('/api/parent-student/parents', token);
  },

  // Get all parents with advanced filters
  getAllParentsWithFilters: async (
    token: string,
    params?: {
      class_id?: string;
      class_division_id?: string;
      student_id?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponseWithCache<ParentListResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.class_division_id) queryParams.append('class_division_id', params.class_division_id);
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/parent-student/parents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  }
};
