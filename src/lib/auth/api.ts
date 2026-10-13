// src/lib/auth/api.ts

import { LoginCredentials, RegisterUserData, ProfileData, UpdateProfileData } from '@/types/auth';
import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from '@/lib/api/client';

export const authServices = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/login', credentials);
  },

  register: async (userData: RegisterUserData): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/register', userData);
  },

  getCurrentUser: async (token: string): Promise<ApiResponseWithCache<ProfileData> | ApiErrorResponse | Blob> => {
    return apiClient.get<ProfileData>('/api/users/profile', token);
  },

  updateProfile: async (token: string, data: UpdateProfileData): Promise<ApiResponse<{ user: import('@/types/auth').User }> | ApiErrorResponse> => {
    return apiClient.put<{ user: import('@/types/auth').User }, UpdateProfileData>('/api/users/profile', data, token);
  },

  registerFirstAdmin: async (userData: RegisterUserData): Promise<ApiResponse<{ user: import('@/types/auth').User; token: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/system/register-first-admin', userData);
  },
};
