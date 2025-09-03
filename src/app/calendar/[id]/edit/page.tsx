// src/app/calendar/[id]/edit/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { EventCreationWizard } from '@/components/calendar/event-creation-wizard';
import { calendarServices, type CalendarEvent } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  eventType: string;
  isFullDay: boolean;
  startTime: string;
  endTime: string;
  classDivisionIds: string[];
}

// Component that uses dynamic routing - must be wrapped in Suspense
function EditEventContent({ params }: { params: Promise<{ id: string }> }) {
  const { token } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventId, setEventId] = useState<string>('');

  // Extract event ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
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
        console.error('Error fetching event:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "error",
        });
        router.push('/calendar');
      } finally {
        setLoading(false);
      }
    };

    if (token && eventId) {
      fetchEvent();
    }
  }, [token, eventId, router]);

  const handleSubmit = async (data: EventFormData) => {
    if (!token || !eventId) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "error",
      });
      return;
    }

    setSaving(true);
    
    try {
      // Prepare update data
      const updateData: Partial<CalendarEvent> = {
        title: data.title.trim(),
        description: data.description.trim(),
        event_date: data.date,
        event_type: data.eventType as 'school_wide' | 'class_specific' | 'teacher_specific',
        is_single_day: true, // Always true since we're editing a single-day event
        start_time: data.isFullDay ? undefined : `${data.startTime}:00`, // Add seconds to match API format
        end_time: data.isFullDay ? undefined : `${data.endTime}:00`, // Add seconds to match API format
        event_category: 'general',
        timezone: 'Asia/Kolkata'
      };

      // Debug: log the update data being sent
      console.log('Update data being sent:', updateData);
      console.log('Original form data:', data);

      // Add class division if class specific
      if (data.eventType === 'class_specific' && data.classDivisionIds.length > 0) {
        updateData.class_division_id = data.classDivisionIds[0]; // Assuming single class for now
      }

      const response = await calendarServices.updateEvent(token, eventId, updateData);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        throw new Error('Unexpected response format');
      }

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
        router.push('/calendar'); // Redirect to calendar home page
      } else {
        throw new Error(response.message || 'Failed to update event');
      }
    } catch (error: unknown) {
      console.error('Error updating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-6">
        <main className="max-w-7xl mx-auto pt-6">
          <EventCreationWizard 
            event={event || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={saving}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading edit event page...</p>
        </div>
      </div>
    }>
      <EditEventContent params={params} />
    </Suspense>
  );
}