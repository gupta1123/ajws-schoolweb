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
};
