// src/lib/api/classwork.ts

import { apiClient, ApiResponse } from './client';
import { Classwork } from '@/types/classwork';

export interface CreateClassworkData {
  class_division_id: string;
  subject: string;
  summary: string;
  topics_covered: string[];
  date: string;
  is_shared_with_parents: boolean;
}

export interface ClassworkResponse {
  classwork: Classwork[];
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

export interface DeleteClassworkResponse {
  message: string;
  success: boolean;
}

export const classworkServices = {
  // Get classwork list with pagination and filters
  getClasswork: async (token: string, page: number = 1, limit: number = 20, filters?: { 
    class_division_id?: string; 
    subject?: string; 
    date_from?: string; 
    date_to?: string 
  }): Promise<ApiResponse<ClassworkResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/classwork${queryString}`, token);
  },

  // Get classwork by ID
  getClassworkById: async (token: string, id: string): Promise<ApiResponse<{ classwork: Classwork }>> => {
    return apiClient.get(`/api/classwork/${id}`, token);
  },

  // Create classwork
  createClasswork: async (data: CreateClassworkData, token: string): Promise<ApiResponse<{ classwork: Classwork }>> => {
    return apiClient.post('/api/classwork', data, token);
  },

  // Update classwork
  updateClasswork: async (id: string, data: Partial<CreateClassworkData>, token: string): Promise<ApiResponse<{ classwork: Classwork }>> => {
    return apiClient.put(`/api/classwork/${id}`, data, token);
  },

  // Delete classwork
  deleteClasswork: async (id: string, token: string): Promise<ApiResponse<DeleteClassworkResponse>> => {
    return apiClient.delete(`/api/classwork/${id}`, token);
  }
};