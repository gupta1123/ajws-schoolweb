// src/lib/auth/api.ts

import { LoginCredentials, RegisterUserData } from '@/types/auth';
import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from '@/lib/api/client';

export const authServices = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/login', credentials);
  },

  register: async (userData: RegisterUserData): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/register', userData);
  },

  getCurrentUser: async (token: string): Promise<ApiResponseWithCache<{ user: import('@/types/auth').User }> | ApiErrorResponse | Blob> => {
    return apiClient.get<{ user: import('@/types/auth').User }>('/api/users/profile', token);
  },

  registerFirstAdmin: async (userData: RegisterUserData): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/system/register-first-admin', userData);
  },
};