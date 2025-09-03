// src/lib/api/birthdays.ts

import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';

export interface BirthdayStudent {
  id: string;
  full_name: string;
  date_of_birth: string;
  admission_number: string;
  status: string;
  student_academic_records: Array<{
    class_division: {
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
    };
    roll_number: string;
  }>;
}

export interface TodayBirthdaysResponse {
  birthdays: BirthdayStudent[];
  count: number;
  total_count: number;
  date: string;
  class_division_id: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UpcomingBirthday {
  date: string;
  students: BirthdayStudent[];
  count: number;
}

export interface UpcomingBirthdaysResponse {
  upcoming_birthdays: UpcomingBirthday[];
  total_count: number;
  class_division_id: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface BirthdayStatistics {
  monthly_statistics: Array<{
    month: number;
    month_name: string;
    count: number;
  }>;
  today_count: number;
  total_active_students: number;
}

export interface ClassBirthdaysResponse {
  class_birthdays: BirthdayStudent[];
  count: number;
  date: string;
}

export interface DivisionBirthdaysResponse {
  class_division: {
    id: string;
    division: string;
    level: {
      name: string;
      sequence_number: number;
    };
  };
  birthdays: BirthdayStudent[];
  count: number;
  total_count: number;
  date: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TeacherClassesBirthdaysResponse {
  birthdays: BirthdayStudent[];
  count: number;
  total_count: number;
  date: string;
  class_division_ids: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export const birthdayServices = {
  // Get today's birthdays
  getTodayBirthdays: async (
    token: string,
    params?: {
      class_division_id?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<TodayBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<TodayBirthdaysResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.class_division_id) {
      searchParams.append('class_division_id', params.class_division_id);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/birthdays/today${queryString}`, token);
  },

  // Get upcoming birthdays (next 7 days)
  getUpcomingBirthdays: async (
    token: string,
    params?: {
      class_division_id?: string;
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ApiResponse<UpcomingBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<UpcomingBirthdaysResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.class_division_id) {
      searchParams.append('class_division_id', params.class_division_id);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.start_date) {
      searchParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      searchParams.append('end_date', params.end_date);
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/birthdays/upcoming${queryString}`, token);
  },

  // Get birthday statistics (Admin/Principal only)
  getBirthdayStatistics: async (token: string): Promise<ApiResponse<BirthdayStatistics> | ApiErrorResponse | Blob | ApiResponseWithCache<BirthdayStatistics>> => {
    return apiClient.get('/api/birthdays/statistics', token);
  },

  // Get class birthdays (Teacher only)
  getClassBirthdays: async (
    token: string,
    classDivisionId: string
  ): Promise<ApiResponse<ClassBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<ClassBirthdaysResponse>> => {
    return apiClient.get(`/api/birthdays/class/${classDivisionId}`, token);
  },

  // Get division birthdays (Admin/Principal/Teacher)
  getDivisionBirthdays: async (
    token: string,
    classDivisionId: string,
    params?: {
      date?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<DivisionBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<DivisionBirthdaysResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.date) {
      searchParams.append('date', params.date);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/birthdays/division/${classDivisionId}${queryString}`, token);
  },

  // Get teacher's assigned classes birthdays
  getTeacherClassesBirthdays: async (
    token: string,
    params?: {
      date?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<TeacherClassesBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<TeacherClassesBirthdaysResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.date) {
      searchParams.append('date', params.date);
    }
    if (params?.start_date) {
      searchParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      searchParams.append('end_date', params.end_date);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/birthdays/my-classes${queryString}`, token);
  },

  // Get birthdays for teacher's classes with date range (alias for getTeacherClassesBirthdays)
  getMyClassBirthdays: async (
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<TeacherClassesBirthdaysResponse> | ApiErrorResponse | Blob | ApiResponseWithCache<TeacherClassesBirthdaysResponse>> => {
    return birthdayServices.getTeacherClassesBirthdays(token, {
      start_date: startDate,
      end_date: endDate
    });
  }
};
