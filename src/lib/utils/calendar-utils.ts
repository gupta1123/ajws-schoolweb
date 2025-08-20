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
  type: 'school' | 'meeting' | 'class' | 'room_booking' | 'leave';
  class?: string;
  room?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
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



  // Map event categories to types
  const categoryTypeMap: Record<string, UICalendarEvent['type']> = {
    'general': 'school',
    'academic': 'class',
    'sports': 'school',
    'cultural': 'school',
    'holiday': 'school',
    'exam': 'class',
    'meeting': 'meeting',
    'other': 'school'
  };

  // Determine the type based on event_type and category
  let type: UICalendarEvent['type'] = 'school';
  if (apiEvent.event_type === 'class_specific') {
    type = 'class';
  } else if (apiEvent.event_category === 'meeting') {
    type = 'meeting';
  } else if (apiEvent.event_category === 'exam') {
    type = 'class';
  } else {
    type = categoryTypeMap[apiEvent.event_category] || 'school';
  }

  // Build class information
  let classInfo = '';
  if (apiEvent.class_info) {
    classInfo = `${apiEvent.class_info.class_level} - Section ${apiEvent.class_info.division}`;
  }

  // Determine approval status (simplified logic)
  const requiresApproval = apiEvent.event_type === 'class_specific' || 
                          apiEvent.event_category === 'meeting' ||
                          apiEvent.event_category === 'cultural';
  
  const approved = !requiresApproval || apiEvent.creator_role === 'admin' || 
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
    room: undefined, // API doesn't have room field
    teacher: apiEvent.creator_name || undefined,
    requiresApproval,
    approved,
    category: apiEvent.event_category
  };
};

// Convert UI format back to API format for creating/updating events
export const convertUIEventToApi = (uiEvent: UICalendarEvent): CreateEventRequest => {
  // Map UI type back to API event_type
  const eventTypeMap: Record<string, 'school_wide' | 'class_specific' | 'teacher_specific'> = {
    'school': 'school_wide',
    'meeting': 'class_specific',
    'class': 'class_specific',
    'birthday': 'school_wide',
    'room_booking': 'class_specific',
    'leave': 'teacher_specific'
  };

  // Map UI type to event_category
  const categoryMap: Record<string, 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other'> = {
    'school': 'general',
    'meeting': 'meeting',
    'class': 'academic',
    'birthday': 'general',
    'room_booking': 'academic',
    'leave': 'other'
  };

  const eventDate = new Date(`${uiEvent.date}T${uiEvent.startTime}:00`);
  
  return {
    title: uiEvent.title,
    description: uiEvent.description,
    event_date: eventDate.toISOString(),
    event_type: eventTypeMap[uiEvent.type] || 'school_wide',
    event_category: categoryMap[uiEvent.type] || 'general',
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

// Filter events by category
export const filterEventsByCategory = (
  events: UICalendarEvent[],
  category: string
): UICalendarEvent[] => {
  return events.filter(event => event.category === category);
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
