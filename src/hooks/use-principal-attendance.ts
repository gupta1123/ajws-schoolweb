// src/hooks/use-principal-attendance.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { 
  attendanceApi, 
  PrincipalAllClassesSummaryResponse,
  AttendanceStatusResponse,
  ClassAttendanceSummary
} from '@/lib/api/attendance';

export interface UsePrincipalAttendanceReturn {
  // State
  allClassesSummary: PrincipalAllClassesSummaryResponse | null;
  selectedClassAttendance: AttendanceStatusResponse | null;
  loading: boolean;
  error: string | null;
  selectedDate: string;
  selectedClassId: string | null;
  
  // Actions
  setSelectedDate: (date: string) => void;
  setSelectedClassId: (classId: string | null) => void;
  loadAllClassesSummary: (date: string) => Promise<void>;
  loadClassAttendanceDetails: (classId: string, date: string) => Promise<void>;
  
  // Computed values
  totalClasses: number;
  classesWithAttendance: number;
  classesWithoutAttendance: number;
  holidayClasses: number;
  overallAttendancePercentage: number;
  classAttendanceList: ClassAttendanceSummary[];
}

export function usePrincipalAttendance(): UsePrincipalAttendanceReturn {
  const { token } = useAuth();
  const [allClassesSummary, setAllClassesSummary] = useState<PrincipalAllClassesSummaryResponse | null>(null);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState<AttendanceStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Load all classes summary
  const loadAllClassesSummary = useCallback(async (date: string): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAllClassesSummary(date, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load attendance summary');
        return;
      }

      if (response.status === 'success') {
        setAllClassesSummary(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance summary';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load specific class attendance details
  const loadClassAttendanceDetails = useCallback(async (
    classId: string, 
    date: string
  ): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAttendanceStatus(classId, date, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load class attendance details');
        return;
      }

      if (response.status === 'success') {
        setSelectedClassAttendance(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load class attendance details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load summary when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAllClassesSummary(selectedDate);
    }
  }, [selectedDate, loadAllClassesSummary]);

  // Load class details when class is selected
  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadClassAttendanceDetails(selectedClassId, selectedDate);
    } else {
      setSelectedClassAttendance(null);
    }
  }, [selectedClassId, selectedDate, loadClassAttendanceDetails]);

  // Computed values
  const totalClasses = allClassesSummary?.total_classes || 0;
  const classesWithAttendance = allClassesSummary?.classes_with_attendance || 0;
  const classesWithoutAttendance = allClassesSummary?.classes_without_attendance || 0;
  const holidayClasses = allClassesSummary?.holiday_classes || 0;
  const classAttendanceList = allClassesSummary?.class_attendance || [];
  
  const overallAttendancePercentage = classAttendanceList.length > 0 
    ? classAttendanceList.reduce((sum, classData) => sum + classData.attendance_percentage, 0) / classAttendanceList.length
    : 0;

  return {
    // State
    allClassesSummary,
    selectedClassAttendance,
    loading,
    error,
    selectedDate,
    selectedClassId,
    
    // Actions
    setSelectedDate,
    setSelectedClassId,
    loadAllClassesSummary,
    loadClassAttendanceDetails,
    
    // Computed values
    totalClasses,
    classesWithAttendance,
    classesWithoutAttendance,
    holidayClasses,
    overallAttendancePercentage,
    classAttendanceList,
  };
}
