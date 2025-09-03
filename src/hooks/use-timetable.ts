// src/hooks/use-timetable.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { timetableApi, TeacherTimetableResponse } from '@/lib/api/timetable';

export function useTimetable() {
  const { user, token } = useAuth();
  const [timetableData, setTimetableData] = useState<TeacherTimetableResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = useCallback(async () => {
    if (!user?.id || !token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await timetableApi.getTeacherTimetable(user.id, token);
      setTimetableData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timetable';
      setError(errorMessage);
      console.error('Timetable fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchTimetable();
  }, [user?.id, token, fetchTimetable]);

  const refreshTimetable = () => {
    fetchTimetable();
  };

  return {
    timetableData,
    loading,
    error,
    refreshTimetable
  };
}
