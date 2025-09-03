// src/lib/api/analytics.ts

import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';

export interface AnalyticsSummary {
  summary: {
    total_students: number;
    total_staff: number;
    active_classes: number;
    pending_approvals: number;
    attendance_rate: number;
    homework_completion: number;
  };
  daily_stats: {
    new_students: number;
    new_homework: number;
    new_messages: number;
    active_users: number;
  };
  date_range: {
    from: string;
    to: string;
  };
}

export interface DailyReports {
  daily_reports: Array<{
    date: string;
    new_students: number;
    new_homework: number;
    new_messages: number;
    active_users: number;
    login_count: number;
    homework_completions: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const analyticsServices = {
  // Get analytics summary
  getSummary: async (
    token: string,
    params?: {
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ApiResponse<AnalyticsSummary> | ApiErrorResponse | Blob | ApiResponseWithCache<AnalyticsSummary>> => {
    const searchParams = new URLSearchParams();
    if (params?.date_from) {
      searchParams.append('date_from', params.date_from);
    }
    if (params?.date_to) {
      searchParams.append('date_to', params.date_to);
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/analytics/summary${queryString}`, token);
  },

  // Get daily reports
  getDailyReports: async (
    token: string,
    params?: {
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<DailyReports> | ApiErrorResponse | Blob | ApiResponseWithCache<DailyReports>> => {
    const searchParams = new URLSearchParams();
    if (params?.date_from) {
      searchParams.append('date_from', params.date_from);
    }
    if (params?.date_to) {
      searchParams.append('date_to', params.date_to);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/analytics/daily${queryString}`, token);
  }
};
