// src/app/calendar/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { InlineError } from '@/components/ui/page-kit';
import { useState, useEffect, useCallback } from 'react';
import { ImprovedCalendarView } from '@/components/calendar/improved-calendar-view';
import { PendingEventsTable } from '@/components/calendar/pending-events-table';
import { EventDetailModal } from '@/components/calendar/event-detail-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { convertApiEventToUI, UICalendarEvent } from '@/lib/utils/calendar-utils';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';


const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'calendar' | 'pending'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<UICalendarEvent | null>(null);
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [pendingEventsLoading, setPendingEventsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: null,
    eventTitle: '',
  });
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Use the calendar events hook for role-based event fetching
  const {
    events,
    error: eventsError,
    fetchEventsByDateRange,
    fetchParentEvents,
    clearError,
    loading: eventsLoading,
  } = useCalendarEvents();
  const [initialLoaded, setInitialLoaded] = useState(false);

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

      const startDate = toLocalISO(startOfMonth);
      const endDate = toLocalISO(endOfMonth);

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
      fetchEventsByRole().finally(() => setInitialLoaded(true));
      // Only principals should see pending approvals
      if (user.role === 'principal') {
        fetchPendingEvents();
      }
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
    const isBirthday = eventId.startsWith('b-');
    const actualEventId = isBirthday ? eventId.slice(2) : eventId;
    const event = uiEvents.find(e => e.id === eventId) || uiEvents.find(e => e.id === actualEventId);
    
    if (event) {
      if (isBirthday) {
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

    // Navigate to create event page with pre-filled date
    router.push(`/calendar/create?date=${date}`);
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
    router.push(`/calendar/create?date=${toLocalISO(new Date())}`);
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
    router.push(`/calendar/${eventId}/edit`);
  };

  const handleDeleteEvent = (eventId: string) => {
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

    // Find the event to get its title
    const event = uiEvents.find(e => e.id === eventId);
    const eventTitle = event?.title || 'this event';

    // Show confirmation modal (close the side panel first so they don't stack)
    setSelectedEvent(null);
    setDeleteConfirmation({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.eventId || !token) return;

    try {
      setDeleting(true);
      // Call the delete API
      const response = await calendarServices.deleteEvent(token, deleteConfirmation.eventId);
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('calendar.page.deleteSuccess', 'Event deleted successfully'),
        });
        
        // Refresh the events list
        await fetchEventsByRole();
        
        // Close the modal and confirmation
        setSelectedEvent(null);
        setDeleteConfirmation({
          isOpen: false,
          eventId: null,
          eventTitle: '',
        });
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
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      eventId: null,
      eventTitle: '',
    });
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
    router.push(`/calendar/pending/${event.id}`);
  };

  const handleMonthChange = useCallback(async (newDate: Date) => {
    if (!token || !user) return;

    try {
      // Get the date range for the new month
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const startDate = toLocalISO(startOfMonth);
      const endDate = toLocalISO(endOfMonth);

      // Fetch events for the new month
      await fetchEventsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error fetching events for new month:', error);
      toast({
        title: "Error",
        description: "Failed to load events for the selected month",
        variant: "error",
      });
    }
  }, [token, user, fetchEventsByDateRange, toast]);



  const isPrincipal = user?.role === 'principal';

  const createButton = (
    <Button onClick={handleCreateEvent} size="sm">
      <Plus />
      {t('calendar.page.createEvent', 'Create Event')}
    </Button>
  );

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-3">
        {/* Show loading state while auth is initializing */}
        {authLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Only show content when auth is ready */}
        {!authLoading && (
          <>
            {/* Tabs only exist for principals (pending approvals) */}
            {isPrincipal && (
              <div role="tablist" className="flex gap-1 border-b">
                {(['calendar', 'pending'] as const).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab === 'calendar'
                        ? t('calendar.page.tabs.calendar', 'Calendar')
                        : t('calendar.page.tabs.pending', 'Pending Requests')}
                      {tab === 'pending' && pendingEvents.length > 0 && (
                        <span className="rounded-full bg-tone-warning-soft px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-tone-warning">
                          {pendingEvents.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <section className="rounded-lg border bg-card">
                <InlineError
                  title={error}
                  onRetry={() => setError(null)}
                  retryLabel={t('common.dismiss', 'Dismiss')}
                />
              </section>
            )}

            {activeTab === 'calendar' || !isPrincipal ? (
              <ImprovedCalendarView
                events={uiEvents}
                onViewEvent={handleViewEvent}
                onAddEvent={handleAddEvent}
                onMonthChange={handleMonthChange}
                toolbarEnd={createButton}
                loading={eventsLoading || !initialLoaded}
              />
            ) : (
              <PendingEventsTable
                events={pendingEvents}
                loading={pendingEventsLoading}
                onViewEvent={handleViewPendingEvent}
                onRefresh={fetchPendingEvents}
                userRole={user?.role}
              />
            )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteConfirmation.eventTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />
    </ProtectedRoute>
  );
}
