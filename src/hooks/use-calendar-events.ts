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
  const { token, user } = useAuth();
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
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        let filteredEvents = response.data.events;
        
        // Filter events based on user role
        if (user?.role === 'admin' || user?.role === 'principal') {
          // Admins and principals see all approved events
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        } else if (user?.role === 'teacher') {
          // Teachers see approved events + their own pending events
          filteredEvents = filteredEvents.filter(event => 
            event.status === 'approved' || 
            (event.status === 'pending' && event.created_by === user.id)
          );
        } else {
          // Other users (parents, students) see only approved events
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        }
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, user, handleApiError]);

  const fetchEventsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getEventsByDateRange(token, startDate, endDate, { use_ist: true });
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        let filteredEvents = response.data.events;
        
        // Filter events based on user role
        if (user?.role === 'admin' || user?.role === 'principal') {
          // Admins and principals see all approved events
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        } else if (user?.role === 'teacher') {
          // Teachers see approved events + their own pending events
          filteredEvents = filteredEvents.filter(event => 
            event.status === 'approved' || 
            (event.status === 'pending' && event.created_by === user.id)
          );
        } else {
          // Other users (parents, students) see only approved events
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        }
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, user, handleApiError]);

  const fetchTodayEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getTodayEvents(token, { use_ist: true });
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        let filteredEvents = response.data.events;
        
        // Filter events based on user role
        if (user?.role === 'admin' || user?.role === 'principal') {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        } else if (user?.role === 'teacher') {
          filteredEvents = filteredEvents.filter(event => 
            event.status === 'approved' || 
            (event.status === 'pending' && event.created_by === user.id)
          );
        } else {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        }
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, user, handleApiError]);

  const fetchUpcomingEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getUpcomingEvents(token, { use_ist: true });
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        let filteredEvents = response.data.events;
        
        // Filter events based on user role
        if (user?.role === 'admin' || user?.role === 'principal') {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        } else if (user?.role === 'teacher') {
          filteredEvents = filteredEvents.filter(event => 
            event.status === 'approved' || 
            (event.status === 'pending' && event.created_by === user.id)
          );
        } else {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        }
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, user, handleApiError]);

  const fetchClassEvents = useCallback(async (classDivisionId: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getClassEvents(token, classDivisionId);
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        let filteredEvents = response.data.events;
        
        // Filter events based on user role
        if (user?.role === 'admin' || user?.role === 'principal') {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        } else if (user?.role === 'teacher') {
          filteredEvents = filteredEvents.filter(event => 
            event.status === 'approved' || 
            (event.status === 'pending' && event.created_by === user.id)
          );
        } else {
          filteredEvents = filteredEvents.filter(event => event.status === 'approved');
        }
        
        setEvents(filteredEvents);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [token, user, handleApiError]);

  const fetchParentEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getParentEvents(token, { use_ist: true });
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        // Parents only see approved events
        const filteredEvents = response.data.events.filter(event => event.status === 'approved');
        setEvents(filteredEvents);
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
