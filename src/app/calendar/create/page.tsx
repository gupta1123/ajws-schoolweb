// src/app/calendar/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { EventCreationWizard } from '@/components/calendar/event-creation-wizard';
import { calendarServices, CreateEventRequest } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';

// Component that uses useSearchParams - must be wrapped in Suspense
function CreateEventContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Debug: log the date parameter received
  const dateParam = searchParams.get('date');
  console.log('Create Page: date parameter received:', dateParam);
  console.log('Create Page: searchParams.getAll():', Array.from(searchParams.entries()));
  console.log('Create Page: current timezone offset:', new Date().getTimezoneOffset());

  const handleSubmit = async (data: {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: 'school_wide' | 'class_specific' | 'teacher_specific';
    category: string;
    classDivisionId?: string;
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Authentication token not found",
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Map UI categories to API-supported categories
      // API only supports: general, academic, sports, cultural, holiday, exam, meeting, other
      const getApiCategory = (uiCategory: string) => {
        switch (uiCategory) {
          case 'uniform': return 'general';      // Uniform events -> general category
          case 'birthday': return 'cultural';    // Birthday events -> cultural category
          case 'leave': return 'other';          // Leave events -> other category
          case 'meeting': return 'meeting';      // Meeting events -> meeting category
          default: return 'general';
        }
      };

      // Ensure time format is HH:MM:SS (API expects this format)
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
        start_time: formatTime(data.startTime),
        end_time: formatTime(data.endTime),
        event_category: getApiCategory(data.category),
        timezone: 'Asia/Kolkata'
      };

      // Add class_division_id for class_specific events
      if (data.eventType === 'class_specific' && data.classDivisionId) {
        apiPayload.class_division_id = data.classDivisionId;
        console.log('Adding class_division_id:', data.classDivisionId);
      } else if (data.eventType === 'class_specific' && !data.classDivisionId) {
        throw new Error('Class division is required for class-specific events');
      }

      // Validate required fields before sending
      if (!apiPayload.title || !apiPayload.description || !apiPayload.event_date) {
        throw new Error('Title, description, and event date are required');
      }

      // Debug: log the payload being sent
      console.log('API Payload being sent:', apiPayload);
      console.log('Original form data:', data);
      console.log('Date conversion details:', {
        originalDate: data.date,
        originalStartTime: data.startTime,
        parsedYear: year,
        parsedMonth: month,
        parsedDay: day,
        parsedStartHour: startHour,
        parsedStartMinute: startMinute,
        eventDateObject: eventDate,
        eventDateISO: eventDate.toISOString(),
        eventDateLocal: eventDate.toLocaleDateString(),
        eventDateLocalTime: eventDate.toLocaleTimeString(),
        utcDateObject: utcDate,
        utcDateString: utcDateString,
        timezoneOffset: eventDate.getTimezoneOffset(),
        timezoneOffsetHours: eventDate.getTimezoneOffset() / 60,
        finalEventDate: utcDateString,
        eventType: data.eventType,
        classDivisionId: data.classDivisionId,
        isClassSpecific: data.eventType === 'class_specific'
      });

      const response = await calendarServices.createEvent(token!, apiPayload);
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Event created successfully",
        });
        router.push('/calendar');
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      toast({
        title: "Error",
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
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-2xl mx-auto pt-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Create Event</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Add a new event to the school calendar
            </p>
          </div>

          <EventCreationWizard 
            initialDate={initialDate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading create event page...</p>
        </div>
      </div>
    }>
      <CreateEventContent />
    </Suspense>
  );
}