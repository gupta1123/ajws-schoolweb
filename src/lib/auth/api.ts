// src/lib/auth/api.ts

import { LoginCredentials, RegisterUserData, AuthResponse } from '@/types/auth';
import { apiClient } from '@/lib/api/client';

export const authServices = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/login', credentials);
  },

  register: async (userData: RegisterUserData): Promise<AuthResponse> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/auth/register', userData);
  },

  getCurrentUser: async (token: string) => {
    return apiClient.get<{ user: import('@/types/auth').User }>('/api/users/profile', token);
  },

  registerFirstAdmin: async (userData: RegisterUserData): Promise<AuthResponse> => {
    return apiClient.post<{ user: import('@/types/auth').User; token: string }>('/api/system/register-first-admin', userData);
  },
};