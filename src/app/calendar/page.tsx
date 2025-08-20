// src/app/calendar/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { ImprovedCalendarView } from '@/components/calendar/improved-calendar-view';
import { EventDetailModal } from '@/components/calendar/event-detail-modal';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { convertApiEventToUI, UICalendarEvent } from '@/lib/utils/calendar-utils';
import { calendarServices } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<UICalendarEvent | {
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
    isBirthday: boolean;
  } | null>(null);
  // Use the calendar events hook
  const {
    events: apiEvents,
    loading,
    error,
    fetchEvents,
    clearError
  } = useCalendarEvents();
  
  // Convert API events to UI format
  const uiEvents: UICalendarEvent[] = apiEvents.map(convertApiEventToUI);
  
  // Mock data for birthdays (keeping existing UI)
  const mockBirthdays = [
    {
      id: '1',
      studentName: 'Aarav Patel',
      class: 'Grade 5 - Section A',
      date: '2025-08-15'
    },
    {
      id: '2',
      studentName: 'Diya Nair',
      class: 'Grade 6 - Section B',
      date: '2025-08-22'
    }
  ];

  const handleViewEvent = (eventId: string) => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading. Please try again in a moment.",
        variant: "error",
      });
      return;
    }

    // For birthdays, we need to handle the special ID format
    const actualEventId = eventId.replace('b-', '');
    const event = uiEvents.find(e => e.id === actualEventId) || 
                   mockBirthdays.find(b => b.id === actualEventId);
    
    if (event) {
      if (eventId.startsWith('b-')) {
        // Transform birthday object to match UICalendarEvent structure
        setSelectedEvent({
          id: actualEventId,
          title: `Birthday: ${(event as { studentName: string }).studentName}`,
          description: `Birthday celebration for ${(event as { studentName: string }).studentName}`,
          date: (event as { date: string }).date,
          startTime: '00:00',
          endTime: '23:59',
          type: 'school',
          class: (event as { class: string }).class,
          category: 'cultural',
          isBirthday: true
        });
      } else {
        // Regular event - check if it's a UICalendarEvent
        if ('title' in event && 'description' in event) {
          setSelectedEvent({
            ...event,
            id: actualEventId,
            isBirthday: false
          });
        }
      }
    }
  };

  const handleAddEvent = (date: string) => {
    // Prevent action while auth is loading
    if (authLoading) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading. Please try again in a moment.",
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
          title: "Authentication Error",
          description: "Please log in to perform this action",
          variant: "error",
        });
        return;
      }

      // Check if user has permission to delete events
      if (user.role !== 'admin' && user.role !== 'principal') {
        toast({
          title: "Access Denied",
          description: "Only admins and principals can delete events",
          variant: "error",
        });
        return;
      }

      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
      }

      console.log('Deleting event with token:', token ? 'Token exists' : 'No token');
      console.log('Event ID:', eventId);

      // Call the delete API
      const response = await calendarServices.deleteEvent(token, eventId);
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        
        // Refresh the events list
        await fetchEvents();
        
        // Close the modal
        setSelectedEvent(null);
      } else {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (error: unknown) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete event',
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

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        {/* Show loading state while auth is initializing */}
        {authLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-lg text-gray-600">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Only show content when auth is ready */}
        {!authLoading && (
          <>
            <PageHeader
              title="Calendar"
              description="Manage events, bookings, and important dates"
              titleClassName="flex items-center gap-2"
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEvents}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <CalendarIcon className="h-8 w-8 text-blue-500" />
                </div>
              }
            />

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-red-800">{error}</p>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <ImprovedCalendarView 
              events={uiEvents}
              onViewEvent={handleViewEvent}
              onAddEvent={handleAddEvent}
            />
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