// src/hooks/use-school-stats.ts

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { studentServices } from '@/lib/api/students';
import { staffServices } from '@/lib/api/staff';
import type { ApiErrorResponse } from '@/lib/api/client';

type StudentsApiResponse = Awaited<ReturnType<typeof studentServices.getAllStudents>>;
type StaffApiResponse = Awaited<ReturnType<typeof staffServices.getStaff>>;

interface UseSchoolStatsOptions {
  enabled?: boolean;
  initialStudentsTotal?: number | null;
  initialStaffTotal?: number | null;
  fetchStudents?: boolean;
  fetchStaff?: boolean;
}

interface UseSchoolStatsReturn {
  totalStudents: number | null;
  totalStaff: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const getStudentsTotal = (response: Exclude<StudentsApiResponse, Blob | ApiErrorResponse>) => {
  const data = response.data;
  if (!data) return null;
  return (
    data.pagination?.total ??
    data.total_count ??
    data.count ??
    null
  );
};

const getStaffTotal = (response: StaffApiResponse) => {
  const data = response.data;
  if (!data) return null;
  return data.pagination?.total ?? data.staff?.length ?? null;
};

export function useSchoolStats(options: UseSchoolStatsOptions = {}): UseSchoolStatsReturn {
  const { token } = useAuth();
  const {
    enabled = true,
    initialStudentsTotal = null,
    initialStaffTotal = null,
    fetchStudents,
    fetchStaff
  } = options;

  const [totalStudents, setTotalStudents] = useState<number | null>(initialStudentsTotal);
  const [totalStaff, setTotalStaff] = useState<number | null>(initialStaffTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldFetchStudents = fetchStudents ?? initialStudentsTotal === null;
  const shouldFetchStaff = fetchStaff ?? initialStaffTotal === null;

  useEffect(() => {
    if (initialStudentsTotal !== null) {
      setTotalStudents(initialStudentsTotal);
    }
  }, [initialStudentsTotal]);

  useEffect(() => {
    if (initialStaffTotal !== null) {
      setTotalStaff(initialStaffTotal);
    }
  }, [initialStaffTotal]);

  const fetchStats = useCallback(async () => {
    if (!token || !enabled) return;
    if (!shouldFetchStudents && !shouldFetchStaff) return;

    setLoading(true);
    setError(null);

    try {
      const [studentsResp, staffResp] = await Promise.all([
        shouldFetchStudents ? studentServices.getAllStudents(token, { page: 1, limit: 1 }) : Promise.resolve(null),
        shouldFetchStaff ? staffServices.getStaff(token, { page: 1, limit: 1 }) : Promise.resolve(null)
      ]);

      if (shouldFetchStudents && studentsResp) {
        if (studentsResp instanceof Blob) {
          throw new Error('Failed to load student stats');
        }

        if ('status' in studentsResp && studentsResp.status === 'error') {
          throw new Error(studentsResp.message || 'Failed to load student stats');
        }

        if ('status' in studentsResp && studentsResp.status === 'success') {
          const total = getStudentsTotal(studentsResp);
          if (typeof total === 'number') {
            setTotalStudents(total);
          }
        }
      }

      if (shouldFetchStaff && staffResp) {
        if (staffResp.status !== 'success') {
          throw new Error('Failed to load staff stats');
        }

        const total = getStaffTotal(staffResp);
        if (typeof total === 'number') {
          setTotalStaff(total);
        }
      }
    } catch (err) {
      console.error('School stats fetch failed', err);
      const message = err instanceof Error ? err.message : 'Failed to load school stats';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, enabled, shouldFetchStudents, shouldFetchStaff]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    totalStudents,
    totalStaff,
    loading,
    error,
    refetch: fetchStats
  };
}
