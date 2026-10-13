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

export interface StaffInfo {
  staff_id: string;
  department?: string | null;
  designation?: string | null;
  joining_date?: string | null;
  is_active?: boolean;
}

/** Response of GET /api/users/profile */
export interface ProfileData {
  user: User;
  staff: StaffInfo | null;
  ids?: {
    user_id: string;
    staff_id: string | null;
    teacher_id: string | null;
  };
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  preferred_language?: 'english' | 'hindi' | 'marathi';
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
