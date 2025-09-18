// src/app/calendar/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ImprovedCalendarView } from '@/components/calendar/improved-calendar-view';
import { PendingEventsTable } from '@/components/calendar/pending-events-table';
import { EventDetailModal } from '@/components/calendar/event-detail-modal';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { convertApiEventToUI, UICalendarEvent } from '@/lib/utils/calendar-utils';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';


export default function CalendarPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [selectedEvent, setSelectedEvent] = useState<UICalendarEvent | null>(null);
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [pendingEventsLoading, setPendingEventsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Use the calendar events hook for role-based event fetching
  const {
    events,
    error: eventsError,
    fetchEventsByDateRange,
    fetchParentEvents,
    clearError
  } = useCalendarEvents();

  // Convert API events to UI format
  const uiEvents = events.map(convertApiEventToUI);

  // Role-based event fetching
  const fetchEventsByRole = useCallback(async () => {
    if (!token || !user) return;

    clearError();

    try {
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      // Fetch events based on user role
      if (user.role === 'teacher') {
        // For teachers, get their class events + general events
        await fetchEventsByDateRange(startDate, endDate);
      } else if (user.role === 'admin' || user.role === 'principal') {
        // For admins/principals, get all events with IST timezone
        await fetchEventsByDateRange(startDate, endDate);
      } else if (user.role === 'parent') {
        // For parents, get parent-relevant events
        await fetchParentEvents();
      } else {
        // Default: get general events
        await fetchEventsByDateRange(startDate, endDate);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load calendar events');
    }
  }, [token, user, fetchEventsByDateRange, fetchParentEvents, clearError]);

  // Fetch pending events
  const fetchPendingEvents = useCallback(async () => {
    if (!token || !user) return;

    setPendingEventsLoading(true);
    try {
      const response = await calendarServices.getPendingEvents(token);
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success' && 'data' in response) {
        let events = response.data.events;
        
        // For teachers, only show events they created
        if (user.role === 'teacher') {
          events = events.filter(event => event.created_by === user.id);
        }
        
        setPendingEvents(events);
      } else if (response && typeof response === 'object' && 'message' in response) {
        console.error('Failed to fetch pending events:', response.message);
        toast({
          title: "Error",
          description: "Failed to load pending events",
          variant: "error",
        });
      }
    } catch (error) {
      console.error('Error fetching pending events:', error);
      toast({
        title: "Error",
        description: "Failed to load pending events",
        variant: "error",
      });
    } finally {
      setPendingEventsLoading(false);
    }
  }, [token, user, toast]);

  // Fetch events on component mount
  useEffect(() => {
    if (token && user && !authLoading) {
      fetchEventsByRole();
      fetchPendingEvents();
    }
  }, [token, user, authLoading, fetchEventsByRole, fetchPendingEvents]);

  // Update error state from hook
  useEffect(() => {
    if (eventsError) {
      setError(eventsError);
    }
  }, [eventsError]);

  const handleViewEvent = (eventId: string) => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: t('calendar.page.pleaseWait', 'Please wait'),
        description: t('calendar.page.authLoading', 'Authentication is still loading. Please try again in a moment.'),
        variant: "error",
      });
      return;
    }

    // For birthdays, we need to handle the special ID format
    const actualEventId = eventId.replace('b-', '');
    const event = uiEvents.find(e => e.id === actualEventId);
    
    if (event) {
      if (eventId.startsWith('b-')) {
        // For birthday events, create a special birthday event structure
        // Since we don't have access to the original birthday data here,
        // we'll create a generic birthday event
        setSelectedEvent({
          id: actualEventId,
          title: `Birthday Celebration`,
          description: `Birthday celebration event`,
          date: event.date,
          startTime: '00:00',
          endTime: '23:59',
          type: 'school',
          class: event.class,
          category: 'cultural'
        });
      } else {
        // Regular event - check if it's a UICalendarEvent
        if ('title' in event && 'description' in event) {
          setSelectedEvent({
            ...event,
            id: actualEventId
          });
        }
      }
    }
  };

  const handleAddEvent = (date: string) => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: t('calendar.page.pleaseWait', 'Please wait'),
        description: t('calendar.page.authLoading', 'Authentication is still loading. Please try again in a moment.'),
        variant: "error",
      });
      return;
    }

    // Debug: log the date being passed
    console.log('Calendar: handleAddEvent called with date:', date);
    console.log('Calendar: date type:', typeof date);
    console.log('Calendar: date value:', date);
    console.log('Calendar: current timezone offset:', new Date().getTimezoneOffset());

    // Navigate to create event page with pre-filled date
    window.location.href = `/calendar/create?date=${date}`;
  };

  const handleCreateEvent = () => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: t('calendar.page.pleaseWait', 'Please wait'),
        description: t('calendar.page.authLoading', 'Authentication is still loading. Please try again in a moment.'),
        variant: "error",
      });
      return;
    }

    // Navigate to create event page with today's date
    const today = new Date().toISOString().split('T')[0];
    window.location.href = `/calendar/create?date=${today}`;
  };

  const handleEditEvent = (eventId: string) => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading. Please try again in a moment.",
        variant: "error",
      });
      return;
    }

    // Navigate to edit page
    window.location.href = `/calendar/${eventId}/edit`;
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Check if auth is still loading
      if (authLoading) {
        toast({
          title: "Please wait",
          description: "Authentication is still loading. Please try again in a moment.",
          variant: "error",
        });
        return;
      }

      // Check if user is authenticated
      if (!user || !token) {
        toast({
          title: t('calendar.page.authError', 'Authentication Error'),
          description: t('calendar.page.loginPrompt', 'Please log in to perform this action'),
          variant: "error",
        });
        return;
      }

      // Check if user has permission to delete events
      if (user.role !== 'admin' && user.role !== 'principal') {
        toast({
          title: t('calendar.page.accessDenied', 'Access Denied'),
          description: t('calendar.page.deleteOnlyAdmins', 'Only admins and principals can delete events'),
          variant: "error",
        });
        return;
      }

      // Show confirmation dialog
      if (!confirm(t('calendar.page.confirmDelete', 'Are you sure you want to delete this event? This action cannot be undone.'))) {
        return;
      }

      console.log('Deleting event with token:', token ? 'Token exists' : 'No token');
      console.log('Event ID:', eventId);

      // Call the delete API
      const response = await calendarServices.deleteEvent(token, eventId);
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('calendar.page.deleteSuccess', 'Event deleted successfully'),
        });
        
        // Refresh the events list
        // await fetchEvents(); // This line was removed as per the new_code
        
        // Close the modal
        setSelectedEvent(null);
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error: unknown) {
      console.error('Error deleting event:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('calendar.page.deleteFailed', 'Failed to delete event'),
        variant: "error",
      });
    }
  };

  const handleApproveEvent = (eventId: string) => {
    // Handle approve
    console.log('Approve event:', eventId);
    setSelectedEvent(null);
  };

  const handleRejectEvent = (eventId: string) => {
    // Handle reject
    console.log('Reject event:', eventId);
    setSelectedEvent(null);
  };

  const handleViewPendingEvent = (event: CalendarEvent) => {
    // Navigate to the pending event detail page
    window.location.href = `/calendar/pending/${event.id}`;
  };



  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-6">
        {/* Show loading state while auth is initializing */}
        {authLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-lg text-gray-600">{t('calendar.page.loading', 'Loading...')}</span>
            </div>
          </div>
        )}
        
        {/* Only show content when auth is ready */}
        {!authLoading && (
          <>
            {/* Header with Create Event Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t('calendar.page.title', 'School Calendar')}</h1>
                  <p className="text-sm text-muted-foreground">{t('calendar.page.subtitle', 'Manage and view all school events')}</p>
                </div>
              </div>
              <Button 
                onClick={handleCreateEvent}
                size="lg"
                className="h-11 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.page.createEvent', 'Create Event')}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-red-800">{error}</p>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">{t('calendar.page.tabs.calendar', 'Calendar')}</TabsTrigger>
                <TabsTrigger value="pending">{t('calendar.page.tabs.pending', 'Pending Requests')}</TabsTrigger>
              </TabsList>
              <TabsContent value="calendar">
                <ImprovedCalendarView 
                  events={uiEvents}
                  onViewEvent={handleViewEvent}
                  onAddEvent={handleAddEvent}
                />
              </TabsContent>
              <TabsContent value="pending">
                <PendingEventsTable
                  events={pendingEvents}
                  loading={pendingEventsLoading}
                  onViewEvent={handleViewPendingEvent}
                  onRefresh={fetchPendingEvents}
                  userRole={user?.role}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      
      {selectedEvent && !authLoading && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onApprove={handleApproveEvent}
          onReject={handleRejectEvent}
          userRole={user?.role === 'parent' ? 'student' : (user?.role || 'admin')}
        />
      )}
    </ProtectedRoute>
  );
}
