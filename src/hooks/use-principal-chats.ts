// src/hooks/use-principal-chats.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  principalChatsServices, 
  PrincipalChatsParams, 
  PrincipalChatsResponse 
} from '@/lib/api/principal-chats';

export function usePrincipalChats() {
  const { user, token } = useAuth();
  const [chatsData, setChatsData] = useState<PrincipalChatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PrincipalChatsParams>({
    chat_type: 'all',
    includes_me: 'all',
    page: 1,
    limit: 20,
    start_date: undefined,
    end_date: undefined,
    class_division_id: undefined
  });

  const fetchChats = useCallback(async (params: PrincipalChatsParams = {}) => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await principalChatsServices.getPrincipalChats(params, token);
      setChatsData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(errorMessage);
      console.error('Principal chats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateFilters = (newFilters: Partial<PrincipalChatsParams>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 when filters change
    setFilters(updatedFilters);
    fetchChats(updatedFilters);
  };

  const loadMore = () => {
    if (chatsData?.pagination.has_next && filters.page) {
      const nextPage = filters.page + 1;
      const updatedFilters = { ...filters, page: nextPage };
      setFilters(updatedFilters);
      fetchChats(updatedFilters);
    }
  };

  useEffect(() => {
    if (user?.role === 'principal' || user?.role === 'admin') {
      fetchChats(filters);
    }
  }, [user?.role, token, fetchChats, filters]);

  const refreshChats = () => {
    fetchChats(filters);
  };

  return {
    chatsData,
    loading,
    error,
    filters,
    updateFilters,
    loadMore,
    refreshChats
  };
}
