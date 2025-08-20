// src/hooks/use-calendar-events.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';

export interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchEventsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchTodayEvents: () => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  fetchClassEvents: (classDivisionId: string) => Promise<void>;
  fetchParentEvents: () => Promise<void>;
  clearError: () => void;
}

export const useCalendarEvents = (): UseCalendarEventsReturn => {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching events';
    setError(errorMessage);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getEvents(token, { use_ist: true });
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  const fetchEventsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getEventsByDateRange(token, startDate, endDate, { use_ist: true });
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  const fetchTodayEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getTodayEvents(token, { use_ist: true });
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  const fetchUpcomingEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getUpcomingEvents(token, { use_ist: true });
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  const fetchClassEvents = useCallback(async (classDivisionId: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getClassEvents(token, classDivisionId);
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  const fetchParentEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getParentEvents(token, { use_ist: true });
      if (response.status === 'success') {
        setEvents(response.data.events);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  // Auto-fetch events when token is available
  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token, fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchEventsByDateRange,
    fetchTodayEvents,
    fetchUpcomingEvents,
    fetchClassEvents,
    fetchParentEvents,
    clearError
  };
};
