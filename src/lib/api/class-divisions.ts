// src/lib/api/class-divisions.ts

import { apiClient } from './client';

export interface ClassLevel {
  id: string;
  name: string;
  sequence_number: number;
}

export interface AcademicYear {
  id: string;
  year_name: string;
  is_active: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  is_class_teacher: boolean;
}

export interface ClassDivision {
  id: string;
  academic_year_id: string;
  class_level_id: string;
  division: string;
  teacher_id: string | null;
  created_at: string;
  academic_year: AcademicYear;
  class_level: ClassLevel;
  teacher: Teacher | null;
}

export interface ClassDivisionsResponse {
  status: string;
  data: {
    class_divisions: ClassDivision[];
  };
}

export const classDivisionsServices = {
  getClassDivisions: async (token: string): Promise<ClassDivisionsResponse> => {
    const response = await apiClient.get<ClassDivisionsResponse['data']>('/api/academic/class-divisions', token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response from API');
    }

    // Handle error response
    if ('status' in response && response.status === 'error') {
      throw new Error(response.message || 'Failed to fetch class divisions');
    }

    // Handle successful response
    if ('status' in response && 'data' in response) {
      return {
        status: response.status,
        data: response.data
      };
    }

    // Fallback for unexpected response format
    throw new Error('Invalid response format from API');
  }
};
