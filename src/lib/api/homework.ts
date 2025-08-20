// src/lib/api/homework.ts

import { apiClient, ApiResponse } from './client';
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

export const homeworkServices = {
  // Get homework list
  getHomework: async (token: string, filters?: { 
    class_division_id?: string; 
    subject?: string; 
    status?: string;
    date_from?: string; 
    date_to?: string 
  }): Promise<ApiResponse<HomeworkResponse>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/homework${queryString}`, token);
  },

  // Create homework
  createHomework: async (data: CreateHomeworkData, token: string): Promise<ApiResponse<{ homework: Homework }>> => {
    return apiClient.post('/api/homework', data, token);
  },

  // Update homework
  updateHomework: async (id: string, data: Partial<CreateHomeworkData>, token: string): Promise<ApiResponse<{ homework: Homework }>> => {
    return apiClient.put(`/api/homework/${id}`, data, token);
  },

  // Delete homework
  deleteHomework: async (id: string, token: string): Promise<ApiResponse<DeleteHomeworkResponse>> => {
    return apiClient.delete(`/api/homework/${id}`, token);
  }
};