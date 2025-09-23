// src/lib/api/timetable.ts

import { apiClient } from './client';

// Types for timetable data
export interface TimetableConfig {
  id: string;
  name: string;
  description?: string;
  academic_year_id: string;
  total_periods: number;
  days_per_week: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  academic_year?: {
    year_name: string;
  };
}

export interface TimetableEntry {
  id: string;
  config_id: string;
  class_division_id: string;
  period_number: number;
  day_of_week: number;
  subject: string;
  teacher_id: string;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  config?: {
    id: string;
    name: string;
    days_per_week: number;
    total_periods: number;
  };
  teacher?: {
    id: string;
    role: string;
    full_name: string;
  };
  subject_info?: {
    id: string;
    name: string;
    code: string;
    display_name: string;
  };
  class_division?: {
    id: string;
    division: string;
    class_level: {
      name: string;
    };
  };
}

export interface CreateConfigPayload {
  name: string;
  description?: string;
  academic_year_id: string;
  total_periods: number;
  days_per_week: number;
}

export interface UpdateConfigPayload {
  name?: string;
  description?: string;
  total_periods?: number;
  days_per_week?: number;
}

export interface CreateEntryPayload {
  config_id: string;
  class_division_id: string;
  period_number: number;
  day_of_week: number;
  subject: string;
  teacher_id: string;
  notes?: string;
}

export interface BulkEntryPayload {
  config_id: string;
  class_division_id: string;
  entries: Array<{
    period_number: number;
    day_of_week: number;
    subject: string;
    teacher_id: string;
    notes?: string;
  }>;
}

export interface UpdateEntryPayload {
  subject?: string;
  teacher_id?: string;
  notes?: string;
}

export interface TimetableConfigsResponse {
  status: string;
  data: {
    configs: TimetableConfig[];
  };
}

export interface TimetableConfigResponse {
  status: string;
  message: string;
  data: {
    config: TimetableConfig;
  };
}

export interface TimetableEntriesResponse {
  status: string;
  data: {
    class_division_id: string;
    timetable: Record<string, TimetableEntry[]>;
    total_entries: number;
  };
}

export interface TimetableEntryResponse {
  status: string;
  message?: string;
  data?: {
    entry: TimetableEntry;
  };
  error_code?: string;
  details?: string;
  suggestion?: string;
  constraint_violated?: string;
}

export interface BulkEntriesResponse {
  status: string;
  message: string;
  data: {
    entries: TimetableEntry[];
  };
}

export interface StudentTimetableResponse {
  status: string;
  data: {
    student_id: string;
    class_division_id: string;
    timetable: Record<string, TimetableEntry[]>;
    total_entries: number;
  };
}

export interface ClassDivisionTeachersResponse {
  status: string;
  data: {
    class_division: {
      id: string;
      division: string;
      class_name: string;
      academic_year: string;
      sequence_number: number;
    };
    teachers: Array<{
      assignment_id: string;
      teacher_id: string;
      assignment_type: string;
      subject?: string;
      is_primary: boolean;
      assigned_date: string;
      is_active: boolean;
      teacher_info: {
        id: string;
        full_name: string;
        phone_number?: string;
        email?: string;
        staff_id?: string;
        department?: string;
      };
    }>;
  };
}

export interface UpdateEntryResponse {
  status: string;
  message: string;
  data: {
    entry: TimetableEntry;
  };
}

export interface TeacherTimetableResponse {
  status: string;
  data: {
    teacher: {
      id: string;
      full_name: string;
      role: string;
    };
    timetable: Record<string, TimetableEntry[]>;
    total_entries: number;
  };
}

// Day names mapping
export const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Timetable API functions
export const timetableApi = {
  // Configuration CRUD operations
  getConfigs: async (
    token: string,
    academicYearId?: string
  ): Promise<TimetableConfigsResponse> => {
    const url = academicYearId
      ? `/api/timetable/config?academic_year=${academicYearId}`
      : '/api/timetable/config';
    const response = await apiClient.get(url, token);
    return response as TimetableConfigsResponse;
  },

  createConfig: async (
    payload: CreateConfigPayload,
    token: string
  ): Promise<TimetableConfigResponse> => {
    const response = await apiClient.post('/api/timetable/config', payload, token);
    return response as TimetableConfigResponse;
  },

  updateConfig: async (
    configId: string,
    payload: UpdateConfigPayload,
    token: string
  ): Promise<TimetableConfigResponse> => {
    const response = await apiClient.put(`/api/timetable/config/${configId}`, payload, token);
    return response as TimetableConfigResponse;
  },

  deleteConfig: async (
    configId: string,
    token: string
  ): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/timetable/config/${configId}`, token);
    return response as { status: string; message: string };
  },

  // Entry CRUD operations
  getEntries: async (
    classDivisionId: string,
    token: string,
    academicYearId?: string
  ): Promise<TimetableEntriesResponse> => {
    const url = academicYearId
      ? `/api/timetable/class/${classDivisionId}?academic_year=${academicYearId}`
      : `/api/timetable/class/${classDivisionId}`;
    const response = await apiClient.get(url, token);
    return response as TimetableEntriesResponse;
  },

  createEntry: async (
    payload: CreateEntryPayload,
    token: string
  ): Promise<TimetableEntryResponse> => {
    const response = await apiClient.post('/api/timetable/entries', payload, token);
    return response as TimetableEntryResponse;
  },

  createBulkEntries: async (
    payload: BulkEntryPayload,
    token: string
  ): Promise<BulkEntriesResponse> => {
    const response = await apiClient.post('/api/timetable/bulk-entries', payload, token);
    return response as BulkEntriesResponse;
  },

  updateEntry: async (
    entryId: string,
    payload: UpdateEntryPayload,
    token: string
  ): Promise<TimetableEntryResponse> => {
    const response = await apiClient.put(`/api/timetable/entries/${entryId}`, payload, token);
    return response as TimetableEntryResponse;
  },

  deleteEntry: async (
    entryId: string,
    token: string
  ): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/timetable/entries/${entryId}`, token);
    return response as { status: string; message: string };
  },

  // Get student timetable
  getStudentTimetable: async (
    studentId: string,
    token: string
  ): Promise<StudentTimetableResponse> => {
    const response = await apiClient.get<StudentTimetableResponse['data']>(
      `/api/timetable/student/${studentId}`,
      token
    );
    return response as StudentTimetableResponse;
  },

  // Get teachers for a class division
  getClassDivisionTeachers: async (
    classDivisionId: string,
    token: string
  ): Promise<ClassDivisionTeachersResponse> => {
    const response = await apiClient.get<ClassDivisionTeachersResponse['data']>(
      `/api/academic/class-divisions/${classDivisionId}/teachers`,
      token
    );
    return response as ClassDivisionTeachersResponse;
  },

  // Get teacher timetable
  getTeacherTimetable: async (
    teacherId: string,
    token: string
  ): Promise<TeacherTimetableResponse> => {
    const response = await apiClient.get<TeacherTimetableResponse['data']>(
      `/api/timetable/teacher/${teacherId}`,
      token
    );
    return response as TeacherTimetableResponse;
  },
};