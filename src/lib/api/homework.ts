import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';
import { Homework } from '@/types/homework';

export interface CreateHomeworkData {
  class_division_id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
}

export interface HomeworkResponse {
  homework: Homework[];
}

export interface DeleteHomeworkResponse {
  message: string;
  success: boolean;
}

export interface Attachment {
  id: string;
  homework_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  download_url?: string;
  download_endpoint?: string;
  uploader?: {
    id: string;
    role: string;
    full_name: string;
  };
}

export interface AttachmentsResponse {
  attachments: Attachment[];
}

export const homeworkServices = {
  // Get homework list
  getHomework: async (token: string, filters?: {
    class_division_id?: string;
    subject?: string;
    status?: string;
    date_from?: string;
    date_to?: string
  }): Promise<ApiResponseWithCache<HomeworkResponse> | ApiErrorResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const result = await apiClient.get(`/api/homework${queryString}`, token);
    return result as ApiResponseWithCache<HomeworkResponse> | ApiErrorResponse;
  },

  // Get homework by ID
  getHomeworkById: async (token: string, id: string): Promise<ApiResponseWithCache<{ homework: Homework }> | ApiErrorResponse> => {
    const result = await apiClient.get(`/api/homework/${id}`, token);
    return result as ApiResponseWithCache<{ homework: Homework }> | ApiErrorResponse;
  },

  // Create homework
  createHomework: async (data: CreateHomeworkData, token: string): Promise<ApiResponse<{ homework: Homework }> | ApiErrorResponse> => {
    const result = await apiClient.post('/api/homework', data, token);
    return result as ApiResponse<{ homework: Homework }> | ApiErrorResponse;
  },

  // Update homework
  updateHomework: async (id: string, data: Partial<CreateHomeworkData>, token: string): Promise<ApiResponse<{ homework: Homework }> | ApiErrorResponse> => {
    const result = await apiClient.put(`/api/homework/${id}`, data, token);
    return result as ApiResponse<{ homework: Homework }> | ApiErrorResponse;
  },

  // Delete homework
  deleteHomework: async (id: string, token: string): Promise<ApiResponse<DeleteHomeworkResponse> | ApiErrorResponse> => {
    const result = await apiClient.delete(`/api/homework/${id}`, token);
    return result as ApiResponse<DeleteHomeworkResponse> | ApiErrorResponse;
  },

  // Upload attachments to homework
  uploadAttachments: async (homeworkId: string, files: File[], token: string): Promise<ApiResponse<AttachmentsResponse> | ApiErrorResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const result = await apiClient.post(`/api/homework/${homeworkId}/attachments`, formData, token, {
      headers: {
        // Let the browser set multipart boundary
      }
    });
    return result as ApiResponse<AttachmentsResponse> | ApiErrorResponse;
  },

  // Get homework attachments
  getHomeworkAttachments: async (homeworkId: string, token: string): Promise<ApiResponseWithCache<AttachmentsResponse> | ApiErrorResponse> => {
    const result = await apiClient.get(`/api/homework/${homeworkId}/attachments`, token);
    return result as ApiResponseWithCache<AttachmentsResponse> | ApiErrorResponse;
  },

  // Get direct URL for attachment (for viewing in browser)
  getAttachmentUrl: (homeworkId: string, attachmentId: string, token?: string): string => {
    const tokenParam = token ? `?token=${token}` : '';
    return `https://ajws-school-ba8ae5e3f955.herokuapp.com/api/homework/${homeworkId}/attachments/${attachmentId}${tokenParam}`;
  },

  // Download attachment - always try to return a Blob or throw
  downloadAttachment: async (homeworkId: string, attachmentId: string, token: string): Promise<Blob> => {
    try {
      const result = await apiClient.get(`/api/homework/${homeworkId}/attachments/${attachmentId}`, token, {
        responseType: 'blob'
      });

      // The API client returns Blob directly when responseType is 'blob'
      if (result instanceof Blob) {
        return result;
      }

      // If we get an error response object instead of a Blob
      if (result && typeof result === 'object' && 'status' in result && result.status === 'error') {
        const msg = result.message || 'Failed to download attachment';
        throw new Error(msg);
      }

      // If result is not a Blob but has blob-like properties
      if (result && typeof result === 'object' && 'size' in result && typeof result.size === 'number' &&
          'type' in result && typeof result.type === 'string' &&
          'arrayBuffer' in result && typeof result.arrayBuffer === 'function') {
        return result as unknown as Blob;
      }

      throw new Error('Invalid response: expected Blob but received something else');
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to download attachment: ${String(error)}`);
    }
  },

  // Delete attachment
  deleteAttachment: async (homeworkId: string, attachmentId: string, token: string): Promise<ApiResponse<{ deleted_attachment: Attachment }> | ApiErrorResponse> => {
    const result = await apiClient.delete(`/api/homework/${homeworkId}/attachments/${attachmentId}`, token);
    return result as ApiResponse<{ deleted_attachment: Attachment }> | ApiErrorResponse;
  },

  // Update attachment
  updateAttachment: async (homeworkId: string, attachmentId: string, data: FormData, token: string): Promise<ApiResponse<Attachment> | ApiErrorResponse> => {
    const result = await apiClient.put(`/api/homework/${homeworkId}/attachments/${attachmentId}`, data, token);
    return result as ApiResponse<Attachment> | ApiErrorResponse;
  }
};
