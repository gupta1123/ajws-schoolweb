import { useState, useCallback, useEffect } from 'react';
import { leaveRequestServices } from '@/lib/api/leave-requests';
import { useAuth } from '@/lib/auth/context';
import type { 
  LeaveRequest, 
  ListLeaveRequestsParams, 
  CreateLeaveRequest,
  UpdateLeaveRequestStatus 
} from '@/types/leave-requests';



interface UseLeaveRequestsReturn {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
  fetchLeaveRequests: (params?: ListLeaveRequestsParams) => Promise<void>;
  createLeaveRequest: (data: CreateLeaveRequest) => Promise<LeaveRequest | null>;
  updateLeaveRequestStatus: (id: string, data: UpdateLeaveRequestStatus) => Promise<boolean>;
  approveLeaveRequest: (id: string) => Promise<boolean>;
  rejectLeaveRequest: (id: string, rejection_reason?: string) => Promise<boolean>;
  getLeaveRequestById: (id: string) => Promise<LeaveRequest | null>;
  clearError: () => void;
}

export const useLeaveRequests = (): UseLeaveRequestsReturn => {
  const { token } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchLeaveRequests = useCallback(async (params: ListLeaveRequestsParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token not available');
        return;
      }
      
      const response = await leaveRequestServices.list(params, token);
      
      if (response.status === 'success') {
        // If it's a 304 response (cached), keep existing data
        if (response.cached && response.statusCode === 304) {
          console.log('Data unchanged (304), keeping existing leave requests');
          // Don't update the state, keep existing data
        } else {
          // New data received, update the state
          setLeaveRequests(response.data.leave_requests);
        }
      } else {
        setError('Failed to fetch leave requests');
      }
    } catch (err) {
      console.error('Leave requests fetch error:', err);
      
      // If it's a 404, the endpoint doesn't exist yet
      if ((err as Error & { status?: number }).status === 404) {
        setError('Leave requests API endpoint not found. Please check the API configuration.');
        setLeaveRequests([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createLeaveRequest = useCallback(async (data: CreateLeaveRequest): Promise<LeaveRequest | null> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token not available');
        return null;
      }
      
      const response = await leaveRequestServices.create(data, token);
      
      if (response.status === 'success') {
        const newRequest = response.data.leave_request;
        setLeaveRequests(prev => [newRequest, ...prev]);
        return newRequest;
      } else {
        setError('Failed to create leave request');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create leave request');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateLeaveRequestStatus = useCallback(async (id: string, data: UpdateLeaveRequestStatus): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token not available');
        return false;
      }
      
      const response = await leaveRequestServices.updateStatus(id, data, token);
      
      if (response.status === 'success') {
        // After successful status update, refresh the entire list
        console.log('Status updated successfully, refreshing leave requests...');
        await fetchLeaveRequests();
        return true;
      } else {
        setError('Failed to update leave request status');
        return false;
      }
    } catch (err) {
      console.error('Update leave request status error:', err);
      
      // If it's a 404, the endpoint doesn't exist yet
      if ((err as Error & { status?: number }).status === 404) {
        setError('Leave request update API endpoint not found. Please check the API configuration.');
        return false;
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update leave request status');
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [token, fetchLeaveRequests]);

  const approveLeaveRequest = useCallback(async (id: string): Promise<boolean> => {
    console.log('Approving leave request:', id);
    return updateLeaveRequestStatus(id, { status: 'approved' });
  }, [updateLeaveRequestStatus]);

  const rejectLeaveRequest = useCallback(async (id: string, rejection_reason?: string): Promise<boolean> => {
    console.log('Rejecting leave request:', id, 'Reason:', rejection_reason);
    return updateLeaveRequestStatus(id, { status: 'rejected', rejection_reason });
  }, [updateLeaveRequestStatus]);

  const getLeaveRequestById = useCallback(async (id: string): Promise<LeaveRequest | null> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token not available');
        return null;
      }
      
      const response = await leaveRequestServices.getById(id, token);
      
      if (response.status === 'success') {
        return response.data.leave_request;
      } else {
        setError('Failed to fetch leave request');
        return null;
      }
    } catch (err) {
      console.error('Get leave request error:', err);
      
      // If it's a 404, the endpoint doesn't exist yet
      if ((err as Error & { status?: number }).status === 404) {
        setError('Leave request API endpoint not found. Please check the API configuration.');
        return null;
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch leave request');
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch leave requests on mount only if token is available
  useEffect(() => {
    if (token) {
      fetchLeaveRequests();
    }
  }, [fetchLeaveRequests, token]);

  return {
    leaveRequests,
    loading,
    error,
    fetchLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveRequestById,
    clearError
  };
};
