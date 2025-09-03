// src/hooks/use-class-divisions.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { calendarServices, ClassDivision } from '@/lib/api/calendar';
import { classDivisionsServices, ClassDivision as ApiClassDivision } from '@/lib/api/class-divisions';

export interface UseClassDivisionsReturn {
  classDivisions: Map<string, ClassDivision>;
  classDivisionsList: ApiClassDivision[];
  loading: boolean;
  error: string | null;
  fetchClassDivision: (classDivisionId: string) => Promise<void>;
  fetchMultipleClassDivisions: (classDivisionIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useClassDivisions = (): UseClassDivisionsReturn => {
  const { token } = useAuth();
  const [classDivisions, setClassDivisions] = useState<Map<string, ClassDivision>>(new Map());
  const [classDivisionsList, setClassDivisionsList] = useState<ApiClassDivision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching class division details';
    setError(errorMessage);
  }, []);

  const fetchAllClassDivisions = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await classDivisionsServices.getClassDivisions(token);

      if (response.status === 'success' && response.data.class_divisions) {
        setClassDivisionsList(response.data.class_divisions);
      } else {
        throw new Error('Failed to fetch class divisions');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  // Fetch all class divisions on mount
  useEffect(() => {
    if (token) {
      fetchAllClassDivisions();
    }
  }, [token, fetchAllClassDivisions]);

  const fetchClassDivision = useCallback(async (classDivisionId: string) => {
    if (!token || !classDivisionId) return;
    
    // Check if we already have this class division
    if (classDivisions.has(classDivisionId)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getClassDivisionDetails(token, classDivisionId);
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success' && 'data' in response && response.data.class_division) {
        setClassDivisions(prev => new Map(prev).set(classDivisionId, response.data.class_division));
      } else if (response && typeof response === 'object' && 'message' in response) {
        throw new Error(response.message);
      } else {
        throw new Error('Failed to fetch class division details');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, classDivisions, handleApiError]);

  const fetchMultipleClassDivisions = useCallback(async (classDivisionIds: string[]) => {
    if (!token || !classDivisionIds.length) return;
    
    // Filter out IDs we already have
    const missingIds = classDivisionIds.filter(id => !classDivisions.has(id));
    
    if (missingIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch all missing class divisions in parallel
      const promises = missingIds.map(id => calendarServices.getClassDivisionDetails(token, id));
      const responses = await Promise.all(promises);
      
      const newClassDivisions = new Map(classDivisions);
      
      responses.forEach((response, index) => {
        const classDivisionId = missingIds[index];
        
        if (response && typeof response === 'object' && 'status' in response && response.status === 'success' && 'data' in response && response.data.class_division) {
          newClassDivisions.set(classDivisionId, response.data.class_division);
        }
      });
      
      setClassDivisions(newClassDivisions);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, classDivisions, handleApiError]);

  return {
    classDivisions,
    classDivisionsList,
    loading,
    error,
    fetchClassDivision,
    fetchMultipleClassDivisions,
    clearError
  };
};
