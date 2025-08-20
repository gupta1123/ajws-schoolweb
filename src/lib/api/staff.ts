import { apiClient } from './client';
import type {
  CreateStaffRequest,
  CreateStaffWithUserRequest,
  UpdateStaffRequest,
  StaffListResponse,
  StaffResponse,
  StaffSyncResponse,
  StaffWithUserResponse,
  DeleteStaffResponse
} from '@/types/staff';

export const staffServices = {
  // List all staff members
  getStaff: async (
    token: string,
    params?: {
      department?: string;
      role?: string;
      subject?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<StaffListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/lists/staff${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url, token);
    return response as StaffListResponse;
  },

  // Sync teachers to staff table
  syncTeachersToStaff: async (token: string): Promise<StaffSyncResponse> => {
    const response = await apiClient.post('/api/lists/staff/sync', {}, token);
    return response as StaffSyncResponse;
  },

  // Create staff member with user account
  createStaffWithUser: async (data: CreateStaffWithUserRequest, token: string): Promise<StaffWithUserResponse> => {
    const response = await apiClient.post('/api/lists/staff/with-user', data, token);
    return response as StaffWithUserResponse;
  },

  // Create staff member (without user account)
  createStaff: async (data: CreateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.post('/api/lists/staff', data, token);
    return response as StaffResponse;
  },

  // Update staff member
  updateStaff: async (id: string, data: UpdateStaffRequest, token: string): Promise<StaffResponse> => {
    const response = await apiClient.put(`/api/lists/staff/${id}`, data, token);
    return response as StaffResponse;
  },

  // Delete staff member
  deleteStaff: async (id: string, token: string): Promise<DeleteStaffResponse> => {
    const response = await apiClient.delete(`/api/lists/staff/${id}`, token);
    return response as DeleteStaffResponse;
  }
};
