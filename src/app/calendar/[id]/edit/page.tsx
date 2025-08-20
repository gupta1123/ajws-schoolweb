// src/app/calendar/[id]/edit/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { calendarServices } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  // Event form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    event_type: 'school_wide' as 'school_wide' | 'class_specific' | 'teacher_specific',
    event_category: 'general' as 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other',
    is_single_day: true,
    timezone: 'Asia/Kolkata'
  });

  const fetchEvent = useCallback(async () => {
    if (!token || !eventId) return;
    
    try {
      setLoading(true);
      const response = await calendarServices.getEventById(token, eventId);
      
      if (response.status === 'success' && response.data.event) {
        const eventData = response.data.event;
        
        // Convert API format to form format with proper timezone handling
        let localDate: string;
        
        if (eventData.event_date_ist) {
          // Parse the IST date manually to avoid timezone conversion issues
          const istDateMatch = eventData.event_date_ist.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (istDateMatch) {
            const [, year, month, day] = istDateMatch;
            localDate = `${year}-${month}-${day}`;
          } else {
            // Fallback to regular parsing
            const eventDate = new Date(eventData.event_date_ist);
            localDate = eventDate.toISOString().split('T')[0];
          }
        } else {
          // Use regular event_date if IST is not available
          const eventDate = new Date(eventData.event_date);
          localDate = eventDate.toISOString().split('T')[0];
        }
        
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          event_date: localDate,
          start_time: eventData.start_time || '00:00:00',
          end_time: eventData.end_time || '23:59:00',
          event_type: eventData.event_type || 'school_wide',
          event_category: eventData.event_category || 'general',
          is_single_day: eventData.is_single_day ?? true,
          timezone: eventData.timezone || 'Asia/Kolkata'
        });
      } else {
        throw new Error(response.message || 'Failed to fetch event');
      }
    } catch (error: unknown) {
      console.error('Error fetching event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event details';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  // Fetch event data on component mount
  useEffect(() => {
    if (token && eventId) {
      fetchEvent();
    }
  }, [fetchEvent, token, eventId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to perform this action",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for API with proper timezone handling
      const localDate = new Date(formData.event_date);
      const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
      const utcDateString = utcDate.toISOString();
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        event_date: utcDateString,
        event_type: formData.event_type,
        event_category: formData.event_category,
        is_single_day: formData.is_single_day,
        start_time: formData.start_time,
        end_time: formData.end_time,
        timezone: formData.timezone
      };

      const response = await calendarServices.updateEvent(token, eventId, updateData);
      
      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
        
        // Redirect back to event details
        router.push(`/calendar/${eventId}`);
      } else {
        throw new Error(response.message || 'Failed to update event');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Update event information and details
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Make changes to the event information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date *</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter event description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type *</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => handleInputChange('event_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school_wide">School Wide</SelectItem>
                        <SelectItem value="class_specific">Class Specific</SelectItem>
                        <SelectItem value="teacher_specific">Teacher Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_category">Category *</Label>
                    <Select
                      value={formData.event_category}
                      onValueChange={(value) => handleInputChange('event_category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is_single_day"
                    type="checkbox"
                    checked={formData.is_single_day}
                    onChange={(e) => handleInputChange('is_single_day', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_single_day">Single Day Event</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
