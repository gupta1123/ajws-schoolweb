// src/app/calendar/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { EventCreationWizard } from '@/components/calendar/event-creation-wizard';
import { calendarServices, CreateEventRequest } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { FormSkeleton } from '@/components/calendar/form-skeleton';


interface CreateEventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  eventType: 'school_wide' | 'class_specific' | 'teacher_specific';
  classDivisionIds: string[];
  eventCategory: 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
}

// Component that uses useSearchParams - must be wrapped in Suspense
function CreateEventContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (data: CreateEventFormData) => {
    if (!user) {
      toast({
        title: t('common.error', 'Error'),
        description: t('calendar.create.authMissing', 'Authentication token not found'),
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Format time for full day events
      const formatTime = (time: string) => {
        if (time.includes(':')) {
          // If time already has colons, ensure it has seconds
          const parts = time.split(':');
          if (parts.length === 2) {
            // If only HH:MM, add :00 seconds
            return `${time}:00`;
          } else if (parts.length === 3) {
            // If already HH:MM:SS, return as is
            return time;
          }
        }
        // If no colons, assume it's just hours and add :00:00
        return `${time}:00:00`;
      };

      // Validate and format the date properly
      // Create date in local timezone to avoid UTC conversion issues
      const [year, month, day] = data.date.split('-').map(Number);
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      
      // Create date object in local timezone
      const eventDate = new Date(year, month - 1, day, startHour, startMinute, 0);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date format. Please check the date and time.');
      }

      // For full day events, set default times
      const startTime = data.isFullDay ? '00:00:00' : formatTime(data.startTime);
      const endTime = data.isFullDay ? '23:59:59' : formatTime(data.endTime);

      // The API expects the date in UTC format, but we need to ensure it represents the correct local date
      // Create a date string that represents the local date at midnight in UTC
      // This ensures the API interprets the date correctly regardless of timezone
      const utcDate = new Date(Date.UTC(year, month - 1, day, startHour, startMinute, 0));
      const utcDateString = utcDate.toISOString();

      // Convert UI format to API format - only include fields API expects
      const apiPayload: CreateEventRequest = {
        title: data.title.trim(),
        description: data.description.trim(),
        event_date: utcDateString, // Use UTC date string to ensure correct date interpretation
        event_type: data.eventType,
        is_single_day: true,
        start_time: startTime,
        end_time: endTime,
        event_category: data.eventCategory, // Use the selected category from form
        timezone: 'Asia/Kolkata'
      };

      // Validate required fields before sending
      if (!apiPayload.title || !apiPayload.description || !apiPayload.event_date) {
        throw new Error('Title, description, and event date are required');
      }

      // Determine if user has auto-approval privileges
      const hasAutoApproval = user.role === 'admin' || user.role === 'principal';
      
      // Create events for each selected class division if class_specific
      if (data.eventType === 'class_specific' && data.classDivisionIds.length > 0) {
        // Use the new API that supports multiple classes in a single request
        const payloadWithClasses = {
          ...apiPayload,
          class_division_ids: data.classDivisionIds
        };
        
        const response = await calendarServices.createEvent(token!, payloadWithClasses);
        
        if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
          if (hasAutoApproval) {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.multiApproved', 'Event created and approved successfully for {count} class(es)').replace('{count}', String(data.classDivisionIds.length)),
            });
          } else {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.multiPending', 'Event created successfully for {count} class(es). Waiting for approval.').replace('{count}', String(data.classDivisionIds.length)),
            });
          }
          router.push('/calendar');
        } else if (response && typeof response === 'object' && 'message' in response) {
          throw new Error(response.message);
        } else {
          throw new Error('Failed to create multi-class event');
        }
      } else if (data.eventType === 'teacher_specific') {
        // Create teacher-specific event (no class selection needed)
        
        const response = await calendarServices.createEvent(token!, apiPayload);
        
        if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
          if (hasAutoApproval) {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.teacherApproved', 'Teacher-specific event created and approved successfully'),
            });
          } else {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.teacherPending', 'Teacher-specific event created successfully. Waiting for approval.'),
            });
          }
          router.push('/calendar');
        } else if (response && typeof response === 'object' && 'message' in response) {
          throw new Error(response.message);
        } else {
          throw new Error('Failed to create teacher-specific event');
        }
      } else {
        // Create a single event (school_wide or single class)
        const response = await calendarServices.createEvent(token!, apiPayload);
        
        if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
          if (hasAutoApproval) {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.singleApproved', 'Event created and approved successfully'),
            });
          } else {
            toast({
              title: t('common.success', 'Success'),
              description: t('calendar.create.singlePending', 'Event created successfully. Waiting for approval.'),
            });
          }
          router.push('/calendar');
        } else if (response && typeof response === 'object' && 'message' in response) {
          throw new Error(response.message);
        } else {
          throw new Error('Failed to create event');
        }
      }
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : t('calendar.create.failed', 'Failed to create event');
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Get initial date from URL params if available
  const initialDate = searchParams.get('date') || undefined;

  return (
    <ProtectedRoute>
      <EventCreationWizard
        initialDate={initialDate}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function CreateEventPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<FormSkeleton label={t('calendar.create.loading', 'Loading...')} />}>
      <CreateEventContent />
    </Suspense>
  );
}
