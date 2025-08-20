import { apiClient, ApiResponse } from './client';

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
  parent: Parent;
  student_mappings: Array<{
    id: string;
    student: {
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
    };
    relationship: string;
    is_primary_guardian: boolean;
    access_level: string;
  }>;
}

export const parentServices = {
  // Create a new parent record
  createParent: async (data: CreateParentRequest, token: string): Promise<ApiResponse<CreateParentResponse>> => {
    return apiClient.post('/api/auth/create-parent', data, token);
  },

  // Get all parents with pagination and filters
  getAllParents: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }
  ): Promise<ApiResponse<ParentListResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    // Since there's no dedicated parents endpoint, we'll get all students and extract parent info
    const url = `/api/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url, token);
  },

  // Get parent details by ID
  getParentById: async (parentId: string, token: string): Promise<ApiResponse<ParentDetailsResponse>> => {
    return apiClient.get(`/api/parents/${parentId}`, token);
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
  ): Promise<ApiResponse<Parent>> => {
    return apiClient.put(`/api/parents/${parentId}`, data, token);
  },

  // Delete parent
  deleteParent: async (parentId: string, token: string): Promise<ApiResponse<{ message: string }>> => {
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
  ): Promise<ApiResponse<{ message: string; mapping_id: string }>> => {
    return apiClient.post(`/api/students/${studentId}/link-parent`, {
      parent_id: parentId,
      ...data
    }, token);
  },

  // Unlink parent from student
  unlinkParentFromStudent: async (
    mappingId: string,
    token: string
  ): Promise<ApiResponse<{ message: string }>> => {
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
  ): Promise<ApiResponse<{ message: string; mapping: { id: string; relationship: string; is_primary_guardian: boolean; access_level: string } }>> => {
    return apiClient.put(`/api/academic/update-parent-access/${mappingId}`, data, token);
  }
};
