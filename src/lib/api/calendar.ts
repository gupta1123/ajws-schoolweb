// src/lib/api/calendar.ts

import { apiClient, ApiResponse, ApiErrorResponse, ApiResponseWithCache } from './client';

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
  creator_name?: string; // Legacy field for backward compatibility
  creator_role?: string; // Legacy field for backward compatibility
  creator?: {
    id: string;
    role: string;
    full_name: string;
  };
  class_info?: {
    id?: string;
    division?: string;
    academic_year?: string;
    class_level?: string;
    type?: string;
    class_count?: number;
    class_ids?: string[];
    message?: string;
  };
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  class_division_ids?: string[];
  is_multi_class?: boolean;
  class_divisions?: string[];
  class_division_name?: string;
  class_division_names?: string[];
}

export interface CreateEventRequest {
  title: string;
  description: string;
  event_date: string;
  event_type: 'school_wide' | 'class_specific' | 'teacher_specific';
  class_division_id?: string; // For single class (backward compatibility)
  class_division_ids?: string[]; // For multiple classes (new feature)
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

export interface ClassDivision {
  id: string;
  division: string;
  class_level: {
    name: string;
    sequence_number: number;
  };
  academic_year: {
    year_name: string;
  };
}

export interface ClassEventsResponse {
  events: CalendarEvent[];
}

export const calendarServices = {
  // Create a new calendar event
  createEvent: async (
    token: string,
    eventData: CreateEventRequest
  ): Promise<ApiResponse<EventResponse> | ApiErrorResponse | Blob> => {
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
      status?: 'pending' | 'approved' | 'rejected';
      use_ist?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
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
    if (params?.status) {
      searchParams.append('status', params.status);
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
  ): Promise<ApiResponseWithCache<EventResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/calendar/events/${eventId}`, token);
  },

  // Update an existing calendar event
  updateEvent: async (
    token: string,
    eventId: string,
    eventData: UpdateEventRequest
  ): Promise<ApiResponse<EventResponse> | ApiErrorResponse | Blob> => {
    return apiClient.put(`/api/calendar/events/${eventId}`, eventData, token);
  },

  // Delete a calendar event
  deleteEvent: async (
    token: string,
    eventId: string
  ): Promise<ApiResponse<{ message: string }> | ApiErrorResponse | Blob> => {
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
  ): Promise<ApiResponseWithCache<ClassEventsResponse> | ApiErrorResponse | Blob> => {
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

    const queryString = searchParams.toString();
    return apiClient.get(`/api/calendar/events/class/${classDivisionId}?${queryString}`, token);
  },

  // Get parent events (school-wide + class-specific)
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
  ): Promise<ApiResponseWithCache<ParentEventsResponse> | ApiErrorResponse | Blob> => {
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

    const queryString = searchParams.toString();
    return apiClient.get(`/api/calendar/events/parent?${queryString}`, token);
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
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
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
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
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
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
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
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
    const searchParams = new URLSearchParams();
    searchParams.append('start_date', startDate);
    searchParams.append('end_date', endDate);
    searchParams.append('event_category', eventCategory);
    
    const queryString = searchParams.toString();
    return apiClient.get(`/api/calendar/events/teacher?${queryString}`, token);
  },

  // Get pending events for approval
  getPendingEvents: async (
    token: string,
    params?: {
      event_type?: 'school_wide' | 'class_specific' | 'teacher_specific';
      event_category?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponseWithCache<EventsResponse> | ApiErrorResponse | Blob> => {
    const searchParams = new URLSearchParams();
    searchParams.append('status', 'pending');
    
    if (params?.event_type) {
      searchParams.append('event_type', params.event_type);
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

    const queryString = searchParams.toString();
    return apiClient.get(`/api/calendar/events?${queryString}`, token);
  },

  // Approve a pending event
  approveEvent: async (
    token: string,
    eventId: string
  ): Promise<ApiResponse<{ message: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post(`/api/calendar/events/${eventId}/approve`, {}, token);
  },

  // Reject a pending event
  rejectEvent: async (
    token: string,
    eventId: string,
    rejectionReason: string
  ): Promise<ApiResponse<{ message: string }> | ApiErrorResponse | Blob> => {
    return apiClient.post(`/api/calendar/events/${eventId}/reject`, {
      rejection_reason: rejectionReason
    }, token);
  },

  // Get class division details by ID
  getClassDivisionDetails: async (
    token: string,
    classDivisionId: string
  ): Promise<ApiResponseWithCache<{ class_division: ClassDivision }> | ApiErrorResponse | Blob> => {
    return apiClient.get(`/api/academic/class-divisions/${classDivisionId}`, token);
  }
};
