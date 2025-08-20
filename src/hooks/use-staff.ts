import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { staffServices } from '@/lib/api';
import type { Staff, CreateStaffRequest, CreateStaffWithUserRequest, UpdateStaffRequest } from '@/types/staff';

interface UseStaffReturn {
  // Data states
  staff: Staff[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
  
  // Actions
  clearError: () => void;
  fetchStaff: (params?: {
    department?: string;
    role?: string;
    subject?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createStaff: (data: CreateStaffRequest) => Promise<boolean>;
  createStaffWithUser: (data: CreateStaffWithUserRequest) => Promise<boolean>;
  updateStaff: (id: string, data: UpdateStaffRequest) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  syncTeachersToStaff: () => Promise<boolean>;
  
  // Utility functions
  refreshStaff: () => Promise<void>;
}

export const useStaff = (): UseStaffReturn => {
  const { token } = useAuth();
  
  // Data states
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null>(null);

  // Fetch staff members
  const fetchStaff = useCallback(async (params?: {
    department?: string;
    role?: string;
    subject?: string;
    page?: number;
    limit?: number;
  }) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.getStaff(token, params);
      
      if (response.status === 'success') {
        setStaff(response.data.staff);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch staff');
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create staff member (without user account)
  const createStaff = useCallback(async (data: CreateStaffRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.createStaff(data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to create staff member');
        return false;
      }
    } catch (err) {
      console.error('Create staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Create staff member with user account
  const createStaffWithUser = useCallback(async (data: CreateStaffWithUserRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.createStaffWithUser(data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to create staff member with user account');
        return false;
      }
    } catch (err) {
      console.error('Create staff with user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create staff member with user account');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Update staff member
  const updateStaff = useCallback(async (id: string, data: UpdateStaffRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.updateStaff(id, data, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to update staff member');
        return false;
      }
    } catch (err) {
      console.error('Update staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Delete staff member
  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.deleteStaff(id, token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete staff member');
        return false;
      }
    } catch (err) {
      console.error('Delete staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Sync teachers to staff
  const syncTeachersToStaff = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffServices.syncTeachersToStaff(token);
      
      if (response.status === 'success') {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        setError('Failed to sync teachers to staff');
        return false;
      }
    } catch (err) {
      console.error('Sync teachers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync teachers to staff');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, fetchStaff]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh staff list
  const refreshStaff = useCallback(async () => {
    await fetchStaff();
  }, [fetchStaff]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token, fetchStaff]);

  return {
    staff,
    loading,
    error,
    pagination,
    clearError,
    fetchStaff,
    createStaff,
    createStaffWithUser,
    updateStaff,
    deleteStaff,
    syncTeachersToStaff,
    refreshStaff
  };
};
