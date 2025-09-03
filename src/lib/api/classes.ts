// src/lib/api/classes.ts

import { apiClient, ApiErrorResponse, ApiResponseWithCache } from './client';
import { ClassDivision, Student } from '@/types/classes';
import { StudentDetailsResponse } from './students';

// Get class divisions summary for a teacher
export const classesServices = {
  getClassDivisions: async (token: string): Promise<ApiResponseWithCache<{ divisions: ClassDivision[]; total_divisions: number; total_students: number }> | ApiErrorResponse | Blob> => {
    return apiClient.get('/api/students/divisions/summary', token);
  },

  // Get students by class division
  getStudentsByClass: async (classDivisionId: string, token: string): Promise<ApiResponseWithCache<{ students: Student[]; count: number }> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/students/class/${classDivisionId}`, token);
  },

  // Get a specific student details
  getStudentDetails: async (studentId: string, token: string): Promise<ApiResponseWithCache<StudentDetailsResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/students/${studentId}`, token);
  }
};