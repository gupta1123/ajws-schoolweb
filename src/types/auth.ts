// src/types/auth.ts

export type UserRole = 'parent' | 'teacher' | 'admin' | 'principal' | 'attendance_staff';

export interface LoginCredentials {
  phone_number: string;
  password: string;
}

export interface RegisterUserData {
  phone_number: string;
  password: string;
  full_name: string;
  email?: string;
  role: UserRole;
}

export interface User {
  id: string;
  phone_number: string;
  role: UserRole;
  full_name: string;
  email?: string;
  preferred_language?: string;
  last_login?: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
