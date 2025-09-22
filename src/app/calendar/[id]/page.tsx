// src/app/calendar/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Loader2, Calendar as CalendarIcon, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [eventId, setEventId] = useState<string>('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Extract event ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch event data on component mount
  const fetchEvent = useCallback(async () => {
    if (!token || !eventId) return;
    
    try {
      setLoading(true);
      const response = await calendarServices.getEventById(token, eventId);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        throw new Error('Unexpected response format');
      }

      if (response.status === 'success' && response.data.event) {
        setEvent(response.data.event);
      } else {
        throw new Error(response.message || 'Failed to fetch event');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event details';
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  useEffect(() => {
    if (token && eventId) {
      fetchEvent();
    }
  }, [fetchEvent, token, eventId]);

  const handleDeleteEvent = () => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to perform this action",
        variant: "error",
      });
      return;
    }

    // Check if user has permission to delete events
    if (user?.role !== 'admin' && user?.role !== 'principal') {
      toast({
        title: "Access Denied",
        description: "Only admins and principals can delete events",
        variant: "error",
      });
      return;
    }

    // Show confirmation modal
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!token) return;

    try {
      setDeleting(true);
      const response = await calendarServices.deleteEvent(token, eventId);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        throw new Error('Unexpected response format');
      }

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        
        // Redirect back to calendar
        router.push('/calendar');
      } else {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'school_wide': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'class_specific': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'teacher_specific': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'school_wide': return 'School Wide Event';
      case 'class_specific': return 'Class Specific Event';
      case 'teacher_specific': return 'Teacher Specific Event';
      default: return 'Event';
    }
  };

  const getEventCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'sports': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 'cultural': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case 'holiday': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'meeting': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (authLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-lg">Loading...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-lg">Loading event details...</span>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">Event Not Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The event you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button onClick={() => router.push('/calendar')}>
                Back to Calendar
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Format date for display
  // Use event_date_ist if available (IST time) to avoid timezone conversion issues
  let eventDate: Date;
  
  if (event.event_date_ist) {
    // Parse the IST date manually to avoid timezone conversion issues
    // The format is "2025-08-29T09:00:00+00:00" - extract just the date part
    const istDateMatch = event.event_date_ist.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (istDateMatch) {
      const [, year, month, day] = istDateMatch;
      // Create date in local timezone using the parsed components
      eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Fallback to regular parsing
      eventDate = new Date(event.event_date_ist);
    }
  } else {
    // Use regular event_date if IST is not available
    eventDate = new Date(event.event_date);
  }
  
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const canEdit = user?.role === 'admin' || user?.role === 'principal';
  const canDelete = user?.role === 'admin' || user?.role === 'principal';

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-4xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Calendar
            </Button>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Event details and information
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {getEventTypeLabel(event.event_type)} • {event.event_category}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/calendar/${eventId}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </a>
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeleteEvent}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{event.start_time} - {event.end_time}</span>
                  </div>
                  
                  {(event.class_division_id || event.is_multi_class || event.event_type === 'school_wide') && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Class: {event.is_multi_class
                          ? (event.class_division_names?.length
                             ? event.class_division_names.join(', ')
                             : (event.class_divisions && event.class_divisions.length > 0)
                               ? `${event.class_divisions.length} classes`
                               : 'Multiple classes'
                            )
                          : event.event_type === 'school_wide'
                          ? (event.class_division_name || event.class_info?.message || 'All Classes')
                          : (event.class_info?.class_level && event.class_info?.division
                             ? `${event.class_info.class_level} ${event.class_info.division}`
                             : event.class_division_name || event.class_division_id
                            )
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventCategoryColor(event.event_category)}`}>
                      {event.event_category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                                            <span>Created by: {event.creator?.full_name || event.creator_name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Timezone: {event.timezone}</span>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                <p>Created: {formatDateTime(event.created_at)}</p>
                <p>Event ID: {event.id}</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${event?.title || 'this event'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />
    </ProtectedRoute>
  );
}