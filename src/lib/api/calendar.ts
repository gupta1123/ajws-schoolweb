// src/lib/api/calendar.ts

import { apiClient, ApiResponse } from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_date_ist?: string;
  event_type: 'school_wide' | 'class_specific' | 'teacher_specific';
  event_category: 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  class_division_id?: string;
  is_single_day: boolean;
  start_time?: string;
  end_time?: string;
  timezone: string;
  created_by: string;
  created_at: string;
  creator_name?: string;
  creator_role?: string;
  class_info?: {
    id: string;
    division: string;
    academic_year: string;
    class_level: string;
  };
}

export interface CreateEventRequest {
  title: string;
  description: string;
  event_date: string;
  event_type: 'school_wide' | 'class_specific' | 'teacher_specific';
  class_division_id?: string;
  is_single_day?: boolean;
  start_time?: string;
  end_time?: string;
  event_category?: 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  timezone?: string;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface EventsResponse {
  events: CalendarEvent[];
}

export interface EventResponse {
  event: CalendarEvent;
}

export interface ParentEventsResponse {
  events: CalendarEvent[];
  child_classes: Array<{
    id: string;
    division: string;
    academic_year: {
      year_name: string;
    };
    class_level: {
      name: string;
    };
  }>;
}

export interface ClassEventsResponse {
  events: CalendarEvent[];
}

export const calendarServices = {
  // Create a new calendar event
  createEvent: async (
    token: string,
    eventData: CreateEventRequest
  ): Promise<ApiResponse<EventResponse>> => {
    return apiClient.post('/api/calendar/events', eventData, token);
  },

  // Get all events with optional filtering
  getEvents: async (
    token: string,
    params?: {
      start_date?: string;
      end_date?: string;
      class_division_id?: string;
      event_type?: 'school_wide' | 'class_specific' | 'teacher_specific';
      event_category?: string;
      use_ist?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<EventsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.start_date) {
      searchParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      searchParams.append('end_date', params.end_date);
    }
    if (params?.class_division_id) {
      searchParams.append('class_division_id', params.class_division_id);
    }
    if (params?.event_type) {
      searchParams.append('event_type', params.event_type);
    }
    if (params?.event_category) {
      searchParams.append('event_category', params.event_category);
    }
    if (params?.use_ist !== undefined) {
      searchParams.append('use_ist', params.use_ist.toString());
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/calendar/events${queryString}`, token);
  },

  // Get a single event by ID
  getEventById: async (
    token: string,
    eventId: string
  ): Promise<ApiResponse<EventResponse>> => {
    return apiClient.get(`/api/calendar/events/${eventId}`, token);
  },

  // Update an existing calendar event
  updateEvent: async (
    token: string,
    eventId: string,
    eventData: UpdateEventRequest
  ): Promise<ApiResponse<EventResponse>> => {
    return apiClient.put(`/api/calendar/events/${eventId}`, eventData, token);
  },

  // Delete a calendar event
  deleteEvent: async (
    token: string,
    eventId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/api/calendar/events/${eventId}`, token);
  },

  // Get class-specific events
  getClassEvents: async (
    token: string,
    classDivisionId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      event_category?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<ClassEventsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.start_date) {
      searchParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      searchParams.append('end_date', params.end_date);
    }
    if (params?.event_category) {
      searchParams.append('event_category', params.event_category);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/calendar/events/class/${classDivisionId}${queryString}`, token);
  },

  // Get parent events (school-wide + class-specific for their children)
  getParentEvents: async (
    token: string,
    params?: {
      start_date?: string;
      end_date?: string;
      event_category?: string;
      use_ist?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<ParentEventsResponse>> => {
    const searchParams = new URLSearchParams();
    
    if (params?.start_date) {
      searchParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      searchParams.append('end_date', params.end_date);
    }
    if (params?.event_category) {
      searchParams.append('event_category', params.event_category);
    }
    if (params?.use_ist !== undefined) {
      searchParams.append('use_ist', params.use_ist.toString());
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get(`/api/calendar/events/parent${queryString}`, token);
  },

  // Get events for a specific date range (utility method)
  getEventsByDateRange: async (
    token: string,
    startDate: string,
    endDate: string,
    params?: {
      class_division_id?: string;
      event_type?: 'school_wide' | 'class_specific' | 'teacher_specific';
      event_category?: string;
      use_ist?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<EventsResponse>> => {
    return calendarServices.getEvents(token, {
      start_date: startDate,
      end_date: endDate,
      ...params
    });
  },

  // Get today's events (utility method)
  getTodayEvents: async (
    token: string,
    params?: {
      class_division_id?: string;
      event_type?: 'school_wide' | 'class_specific' | 'teacher_specific';
      event_category?: string;
      use_ist?: boolean;
    }
  ): Promise<ApiResponse<EventsResponse>> => {
    const today = new Date().toISOString().split('T')[0];
    return calendarServices.getEvents(token, {
      start_date: today,
      end_date: today,
      ...params
    });
  },

  // Get upcoming events (next 7 days - utility method)
  getUpcomingEvents: async (
    token: string,
    params?: {
      class_division_id?: string;
      event_type?: 'school_wide' | 'class_specific' | 'teacher_specific';
      event_category?: string;
      use_ist?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<EventsResponse>> => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = nextWeek.toISOString().split('T')[0];
    
    return calendarServices.getEvents(token, {
      start_date: startDate,
      end_date: endDate,
      ...params
    });
  },

  // Get events for teachers (academic events for their classes)
  getTeacherEvents: async (
    token: string,
    startDate: string,
    endDate: string,
    eventCategory: string
  ): Promise<ApiResponse<EventsResponse>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('start_date', startDate);
    searchParams.append('end_date', endDate);
    searchParams.append('event_category', eventCategory);
    
    const queryString = searchParams.toString();
    return apiClient.get(`/api/calendar/events/teacher?${queryString}`, token);
  }
};
