// src/hooks/use-analytics.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { analyticsServices } from '@/lib/api/analytics';

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

// Simple in-memory cache
const cache = new Map<string, { data: AnalyticsData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const cacheKey = useRef<string>('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Create cache key based on token (you might want to use a different key)
    cacheKey.current = `analytics_${token.substring(0, 10)}`;

    const fetchAnalytics = async () => {
      try {
        // Check cache first
        const cached = cache.get(cacheKey.current);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await analyticsServices.getSummary(token);

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          setError('Unexpected response format');
          return;
        }

        if (response.status === 'success' && response.data) {
          const { summary, daily_stats } = response.data;
          const newData = {
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
          };

          // Cache the data
          cache.set(cacheKey.current, { data: newData, timestamp: Date.now() });
          setData(newData);
        } else if (response.status === 'error') {
          setError(response.message || 'Failed to load analytics data');
        } else {
          // Handle unexpected response format
          setError('Unexpected response format from analytics service');
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', {
          error: err,
          timestamp: new Date().toISOString(),
          token: token ? `${token.substring(0, 10)}...` : 'no-token',
          cacheKey: cacheKey.current
        });

        // Provide more specific error messages
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
            setError('Network error - please check your connection');
          } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            setError('Authentication error - please log in again');
          } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
            setError('Access denied - insufficient permissions');
          } else if (err.message.includes('404') || err.message.includes('Not Found')) {
            setError('Analytics service not available');
          } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
            setError('Server error - please try again later');
          } else {
            setError(err.message || 'Failed to load analytics data');
          }
        } else {
          setError('Failed to load analytics data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  return { data, loading, error };
}
