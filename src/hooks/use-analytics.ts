// src/hooks/use-analytics.ts

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { analyticsServices } from '@/lib/api';

interface AnalyticsData {
  totalStudents: number;
  totalStaff: number;
  activeClasses: number;
  pendingApprovals: number;
  attendanceRate: number;
  homeworkCompletion: number;
  newStudents: number;
  newHomework: number;
  newMessages: number;
  activeUsers: number;
}

export function useAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    totalStudents: 0,
    totalStaff: 0,
    activeClasses: 0,
    pendingApprovals: 0,
    attendanceRate: 0,
    homeworkCompletion: 0,
    newStudents: 0,
    newHomework: 0,
    newMessages: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await analyticsServices.getSummary(token);

        if (response.data) {
          const { summary, daily_stats } = response.data;
          setData({
            totalStudents: summary.total_students,
            totalStaff: summary.total_staff,
            activeClasses: summary.active_classes,
            pendingApprovals: summary.pending_approvals,
            attendanceRate: summary.attendance_rate,
            homeworkCompletion: summary.homework_completion,
            newStudents: daily_stats.new_students,
            newHomework: daily_stats.new_homework,
            newMessages: daily_stats.new_messages,
            activeUsers: daily_stats.active_users,
          });
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  return { data, loading, error };
}
