import { apiClient, ApiErrorResponse, ApiResponse, ApiResponseWithCache } from './client';

export interface FoodMenu {
  id: string;
  menu_date: string;
  breakfast: string | null;
  lunch: string | null;
  snack: string | null;
  notes: string | null;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FoodMenuPayload {
  menu_date: string;
  breakfast?: string | null;
  lunch?: string | null;
  snack?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface FoodMenuListParams {
  from_date?: string;
  to_date?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface FoodMenuPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FoodMenuListResponse {
  menus: FoodMenu[];
  pagination: FoodMenuPagination;
}

export interface MonthlyMenuAttachment {
  id: string;
  month: number;
  year: number;
  title: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  download_endpoint: string;
}

export interface MonthlyMenuAttachmentListResponse {
  attachments: MonthlyMenuAttachment[];
  attachment: MonthlyMenuAttachment | null;
}

export interface MonthlyMenuDownload {
  file_url: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  expires_at: string;
  attachment_id: string;
  month: number;
  year: number;
}

export const foodMenuServices = {
  list: async (
    params: FoodMenuListParams,
    token: string
  ): Promise<ApiResponseWithCache<FoodMenuListResponse> | ApiErrorResponse | Blob> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      queryParams.append(key, value.toString());
    });

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiClient.get<FoodMenuListResponse>(`/api/food-menu${queryString}`, token);
  },

  getToday: async (
    token: string
  ): Promise<ApiResponseWithCache<{ menu: FoodMenu | null; menu_date: string }> | ApiErrorResponse | Blob> => {
    return apiClient.get<{ menu: FoodMenu | null; menu_date: string }>('/api/food-menu/today', token);
  },

  getById: async (
    id: string,
    token: string
  ): Promise<ApiResponseWithCache<{ menu: FoodMenu }> | ApiErrorResponse | Blob> => {
    return apiClient.get<{ menu: FoodMenu }>(`/api/food-menu/${id}`, token);
  },

  create: async (
    payload: FoodMenuPayload,
    token: string
  ): Promise<ApiResponse<{ menu: FoodMenu }> | ApiErrorResponse | Blob> => {
    return apiClient.post<{ menu: FoodMenu }>('/api/food-menu', payload, token);
  },

  update: async (
    id: string,
    payload: Partial<FoodMenuPayload>,
    token: string
  ): Promise<ApiResponse<{ menu: FoodMenu }> | ApiErrorResponse> => {
    return apiClient.put<{ menu: FoodMenu }>(`/api/food-menu/${id}`, payload, token);
  },

  delete: async (
    id: string,
    token: string
  ): Promise<ApiResponse<{ menu: Pick<FoodMenu, 'id' | 'menu_date' | 'is_active'> }> | ApiErrorResponse> => {
    return apiClient.delete<{ menu: Pick<FoodMenu, 'id' | 'menu_date' | 'is_active'> }>(`/api/food-menu/${id}`, token);
  },

  getMonthlyAttachments: async (
    token: string,
    params: { month?: number; year?: number } = {}
  ): Promise<ApiResponseWithCache<MonthlyMenuAttachmentListResponse> | ApiErrorResponse | Blob> => {
    const query = new URLSearchParams();
    if (params.month !== undefined) query.set('month', String(params.month));
    if (params.year !== undefined) query.set('year', String(params.year));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<MonthlyMenuAttachmentListResponse>(`/api/food-menu/monthly-attachment${queryString}`, token);
  },

  uploadMonthlyAttachment: async (
    token: string,
    payload: { file: File; month: number; year: number; title?: string }
  ): Promise<ApiResponse<{ attachment: MonthlyMenuAttachment }> | ApiErrorResponse | Blob> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('month', String(payload.month));
    formData.append('year', String(payload.year));
    if (payload.title?.trim()) formData.append('title', payload.title.trim());
    return apiClient.post<{ attachment: MonthlyMenuAttachment }>('/api/food-menu/monthly-attachment', formData, token);
  },

  getMonthlyAttachmentDownload: async (
    id: string,
    token: string
  ): Promise<ApiResponseWithCache<MonthlyMenuDownload> | ApiErrorResponse | Blob> => {
    return apiClient.get<MonthlyMenuDownload>(`/api/food-menu/monthly-attachment/${id}/download`, token);
  },

  updateMonthlyAttachment: async (
    id: string,
    token: string,
    payload: { file?: File; month?: number; year?: number; title?: string }
  ): Promise<ApiResponse<{ attachment: MonthlyMenuAttachment }> | ApiErrorResponse> => {
    const formData = new FormData();
    if (payload.file) formData.append('file', payload.file);
    if (payload.month !== undefined) formData.append('month', String(payload.month));
    if (payload.year !== undefined) formData.append('year', String(payload.year));
    if (payload.title !== undefined) formData.append('title', payload.title.trim());
    return apiClient.put<{ attachment: MonthlyMenuAttachment }> (`/api/food-menu/monthly-attachment/${id}`, formData, token);
  },

  deleteMonthlyAttachment: async (
    id: string,
    token: string
  ): Promise<ApiResponse<Record<string, never>> | ApiErrorResponse> => {
    return apiClient.delete<Record<string, never>>(`/api/food-menu/monthly-attachment/${id}`, token);
  },
};
