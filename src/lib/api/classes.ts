// src/lib/api/classes.ts

import { apiClient, ApiResponse, ApiErrorResponse } from './client';
import { ClassDivision, Student } from '@/types/classes';
import { StudentDetailsResponse } from './students';

// Get class divisions summary for a teacher
export const classesServices = {
  getClassDivisions: async (token: string): Promise<ApiResponse<{ divisions: ClassDivision[]; total_divisions: number; total_students: number }> | ApiErrorResponse> => {
    return apiClient.get('/api/students/divisions/summary', token);
  },

  // Get students by class division
  getStudentsByClass: async (classDivisionId: string, token: string): Promise<ApiResponse<{ students: Student[]; count: number }> | ApiErrorResponse> => {
    return apiClient.get(`/api/students/class/${classDivisionId}`, token);
  },

  // Get a specific student details
  getStudentDetails: async (studentId: string, token: string): Promise<ApiResponse<StudentDetailsResponse> | ApiErrorResponse> => {
    return apiClient.get(`/api/students/${studentId}`, token);
  }
};