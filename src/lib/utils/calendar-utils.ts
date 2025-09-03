// src/lib/utils/calendar-utils.ts

import { CalendarEvent, CreateEventRequest } from '@/lib/api/calendar';

// Interface matching the existing UI components
export interface UICalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'school' | 'class';
  class?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Convert API CalendarEvent to UI format
export const convertApiEventToUI = (apiEvent: CalendarEvent): UICalendarEvent => {
  // Extract date and time with proper timezone handling
  // Use event_date_ist if available (IST time) to avoid timezone conversion issues
  let date: string;
  
  if (apiEvent.event_date_ist) {
    // Parse the IST date manually to avoid timezone conversion issues
    // The format is "2025-08-29T09:00:00+00:00" - extract just the date part
    const istDateMatch = apiEvent.event_date_ist.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (istDateMatch) {
      const [, year, month, day] = istDateMatch;
      date = `${year}-${month}-${day}`;
      console.log('Calendar Utils: Parsed IST date manually:', { year, month, day, date, eventTitle: apiEvent.title });
    } else {
      // Fallback to regular parsing
      const eventDate = new Date(apiEvent.event_date_ist);
      date = eventDate.toISOString().split('T')[0];
      console.log('Calendar Utils: Fallback IST date parsing:', { date, eventTitle: apiEvent.title });
    }
  } else {
    // Use regular event_date if IST is not available
    const eventDate = new Date(apiEvent.event_date);
    date = eventDate.toISOString().split('T')[0];
    console.log('Calendar Utils: Using regular event_date:', { date, eventTitle: apiEvent.title });
  }
  
  const startTime = apiEvent.start_time || '00:00';
  const endTime = apiEvent.end_time || '23:59';

  // Determine the type based on event_type
  let type: UICalendarEvent['type'] = 'school';
  if (apiEvent.event_type === 'class_specific') {
    type = 'class';
  }

  // Build class information
  let classInfo = '';
  if (apiEvent.class_info) {
    classInfo = `${apiEvent.class_info.class_level} - Section ${apiEvent.class_info.division}`;
  }

  // All events require approval by default
  const requiresApproval = true;
  
  // Check if the event is approved (created by admin/principal or explicitly approved)
  const approved = apiEvent.creator_role === 'admin' || 
                  apiEvent.creator_role === 'principal';

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    date,
    startTime,
    endTime,
    type,
    class: classInfo || undefined,
    teacher: apiEvent.creator_name || undefined,
    requiresApproval,
    approved,
    category: apiEvent.event_category,
    status: apiEvent.status
  };
};

// Convert UI format back to API format for creating/updating events
export const convertUIEventToApi = (uiEvent: UICalendarEvent): CreateEventRequest => {
  // Map UI type back to API event_type
  const eventTypeMap: Record<string, 'school_wide' | 'class_specific'> = {
    'school': 'school_wide',
    'class': 'class_specific'
  };

  const eventDate = new Date(`${uiEvent.date}T${uiEvent.startTime}:00`);
  
  return {
    title: uiEvent.title,
    description: uiEvent.description,
    event_date: eventDate.toISOString(),
    event_type: eventTypeMap[uiEvent.type] || 'school_wide',
    event_category: 'general',
    is_single_day: true,
    start_time: uiEvent.startTime,
    end_time: uiEvent.endTime,
    timezone: 'Asia/Kolkata'
  };
};

// Filter events by date range
export const filterEventsByDateRange = (
  events: UICalendarEvent[],
  startDate: string,
  endDate: string
): UICalendarEvent[] => {
  return events.filter(event => {
    const eventDate = event.date;
    return eventDate >= startDate && eventDate <= endDate;
  });
};

// Filter events by type
export const filterEventsByType = (
  events: UICalendarEvent[],
  type: UICalendarEvent['type']
): UICalendarEvent[] => {
  return events.filter(event => event.type === type);
};

// Sort events by date and time
export const sortEventsByDateTime = (events: UICalendarEvent[]): UICalendarEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
};

// Get events for a specific date
export const getEventsForDate = (
  events: UICalendarEvent[],
  date: string
): UICalendarEvent[] => {
  return events.filter(event => event.date === date);
};

// Get today's events
export const getTodayEvents = (events: UICalendarEvent[]): UICalendarEvent[] => {
  const today = new Date().toISOString().split('T')[0];
  return getEventsForDate(events, today);
};

// Get upcoming events (next 7 days)
export const getUpcomingEvents = (events: UICalendarEvent[]): UICalendarEvent[] => {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= nextWeek;
  });
};
