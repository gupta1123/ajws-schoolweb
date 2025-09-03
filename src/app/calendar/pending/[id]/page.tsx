// src/app/calendar/pending/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  BookOpen, 
  School, 
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';


// Event type configuration
const eventTypeConfig = {
  school_wide: { 
    label: 'School Wide', 
    color: 'bg-blue-500', 
    icon: School 
  },
  class_specific: { 
    label: 'Class Specific', 
    color: 'bg-green-500', 
    icon: BookOpen 
  },
  teacher_specific: { 
    label: 'Teacher Specific', 
    color: 'bg-purple-500', 
    icon: User 
  }
};

// Event category configuration
const eventCategoryConfig = {
  general: { label: 'General', color: 'bg-gray-500' },
  academic: { label: 'Academic', color: 'bg-blue-500' },
  sports: { label: 'Sports', color: 'bg-green-500' },
  cultural: { label: 'Cultural', color: 'bg-purple-500' },
  holiday: { label: 'Holiday', color: 'bg-red-500' },
  exam: { label: 'Exam', color: 'bg-orange-500' },
  meeting: { label: 'Meeting', color: 'bg-indigo-500' },
  other: { label: 'Other', color: 'bg-gray-600' }
};

function PendingEventDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
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
        
        if (response && typeof response === 'object' && 'status' in response && response.status === 'success' && 'data' in response && response.data.event) {
          const fetchedEvent = response.data.event;
          setEvent(fetchedEvent);
          
          // Fetch class division details if this is a class-specific event
          // Removed API call to class-divisions endpoint as requested
          // if (fetchedEvent.class_division_ids && fetchedEvent.class_division_ids.length > 0) {
          //   fetchMultipleClassDivisions(fetchedEvent.class_division_ids);
          // }
        } else if (response && typeof response === 'object' && 'message' in response) {
          throw new Error(response.message);
        } else {
          throw new Error('Failed to fetch event');
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'All day';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const handleApprove = async () => {
    if (!token || !eventId) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await calendarServices.approveEvent(token, eventId);
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        toast({
          title: "Success",
          description: "Event approved successfully",
        });
        router.push('/calendar');
      } else if (response && typeof response === 'object' && 'message' in response) {
        throw new Error(response.message);
      } else {
        throw new Error('Failed to approve event');
      }
    } catch (error: unknown) {
      console.error('Error approving event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve event';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token || !eventId) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "error",
      });
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await calendarServices.rejectEvent(token, eventId, rejectionReason.trim());
      
      if (response && typeof response === 'object' && 'status' in response && response.status === 'success') {
        toast({
          title: "Success",
          description: "Event rejected successfully",
        });
        router.push('/calendar');
      } else if (response && typeof response === 'object' && 'message' in response) {
        throw new Error(response.message);
      } else {
        throw new Error('Failed to reject event');
      }
    } catch (error: unknown) {
      console.error('Error rejecting event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject event';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const canApproveReject = user?.role === 'admin' || user?.role === 'principal';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-gray-500">Event not found</p>
        </div>
      </div>
    );
  }

  const typeConfig = eventTypeConfig[event.event_type] || eventTypeConfig.school_wide;
  const categoryConfig = eventCategoryConfig[event.event_category] || eventCategoryConfig.general;
  const TypeIcon = typeConfig.icon;

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pending Event Details</h1>
            <p className="text-sm text-muted-foreground">Review and approve or reject this event</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categoryConfig.label}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        Pending Approval
                      </Badge>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class Information */}
              {event.class_info && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Class</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof event.class_info.class_level === 'object' && event.class_info.class_level && 'name' in event.class_info.class_level ? (event.class_info.class_level as { name: string }).name : String(event.class_info.class_level || 'N/A')} - Section {event.class_info.division}
                    </p>
                  </div>
                </div>
              )}

              {/* Creator Information */}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Created By</p>
                  <p className="text-sm text-muted-foreground">
                    {event.creator?.full_name || event.creator_name || 'Unknown'} ({event.creator?.role || event.creator_role || 'Unknown'})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Event Invitees/Attendees */}
              <div>
                <h3 className="font-semibold mb-2">Event Invitees</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {event.event_type === 'school_wide' ? (
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">All school members</span>
                    </div>
                  ) : event.event_type === 'class_specific' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          {event.is_multi_class ? `Multiple Classes (${event.class_division_ids?.length || event.class_division_names?.length || 0} classes)` : 'Specific Class'}
                        </span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {/* Show class division names if available */}
                        {event.class_division_names && event.class_division_names.length > 0 ? (
                          event.class_division_names.map((className, index) => (
                            <div key={`class-name-${index}`} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {className}
                              </span>
                            </div>
                          ))
                        ) : event.class_division_name && event.class_division_name !== 'All Classes' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {event.class_division_name}
                            </span>
                          </div>
                        ) : event.class_division_ids && event.class_division_ids.length > 0 ? (
                          // Fallback to showing IDs if names are not available
                          event.class_division_ids.map((classId) => (
                            <div key={classId} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                Class Division ID: {classId}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              No class divisions specified
                            </span>
                          </div>
                        )}
                      </div>
                      {event.class_info?.message && (
                        <div className="ml-6 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {event.class_info.message}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : event.event_type === 'teacher_specific' ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">All teachers and staff</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">No specific invitees defined</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canApproveReject && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Approve or reject this pending event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showRejectForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Rejection Reason
                      </label>
                      <Textarea
                        placeholder="Please provide a reason for rejecting this event..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReject}
                        disabled={actionLoading || !rejectionReason.trim()}
                        variant="destructive"
                        className="flex-1"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Event
                      </Button>
                      <Button
                        onClick={() => setShowRejectForm(false)}
                        variant="outline"
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Event
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function PendingEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pending event page...</p>
        </div>
      </div>
    }>
      <PendingEventDetailContent params={params} />
    </Suspense>
  );
}
