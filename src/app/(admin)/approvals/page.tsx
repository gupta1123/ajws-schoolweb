'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { calendarServices, CalendarEvent } from '@/lib/api/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiClient, ApiResponse } from '@/lib/api/client';

// Define response types for approval/rejection
interface ApprovalResponse {
  message: string;
  event: CalendarEvent;
}

interface RejectionResponse {
  message: string;
  event: CalendarEvent;
}

export default function ApprovalsPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending approval events
  const fetchPendingEvents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await calendarServices.getEvents(token, { use_ist: true });

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'success') {
        // Filter events where approved_by is null (pending approval)
        const pendingEvents = response.data.events.filter(event => event.approved_by === null);
        
        // Sort events by date (newest first, oldest at bottom)
        const sortedEvents = pendingEvents.sort((a, b) => {
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        });
        
        setEvents(sortedEvents);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle approval
  const handleApprove = async (eventId: string) => {
    if (!token || !user) return;
    
    try {
      // Use the dedicated approve endpoint
      const response = await apiClient.post<ApiResponse<ApprovalResponse>>(
        `/api/calendar/events/${eventId}/approve`,
        {},
        token
      );

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        toast({
          title: "Error",
          description: "Unexpected response format.",
          variant: "error",
        });
        return;
      }

      if (response.status === 'success') {
        // Remove the approved event from the list
        setEvents(events.filter(event => event.id !== eventId));
        toast({
          title: "Event Approved",
          description: "The event has been successfully approved.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to approve the event.",
          variant: "error",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve the event.",
        variant: "error",
      });
      console.error('Error approving event:', err);
    }
  };

  // Handle rejection
  const handleReject = async (eventId: string) => {
    if (!token || !user) return;
    
    try {
      // Use the dedicated reject endpoint
      const response = await apiClient.post<ApiResponse<RejectionResponse>>(
        `/api/calendar/events/${eventId}/reject`,
        {
          rejection_reason: `Rejected by ${user.full_name}`
        },
        token
      );

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        toast({
          title: "Error",
          description: "Unexpected response format.",
          variant: "error",
        });
        return;
      }

      if (response.status === 'success') {
        // Remove the rejected event from the list
        setEvents(events.filter(event => event.id !== eventId));
        toast({
          title: "Event Rejected",
          description: "The event has been rejected.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to reject the event.",
          variant: "error",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject the event.",
        variant: "error",
      });
      console.error('Error rejecting event:', err);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    if (token) {
      fetchPendingEvents();
    }
  }, [token, fetchPendingEvents]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Loading approvals...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Error: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending approvals found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-muted-foreground">{event.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.event_type === 'school_wide' 
                          ? 'bg-blue-100 text-blue-800' 
                          : event.event_type === 'class_specific' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {event.event_type === 'school_wide' 
                          ? 'School Wide' 
                          : event.event_type === 'class_specific' 
                            ? 'Class Specific'
                            : 'Teacher Specific'}
                      </span>
                    </TableCell>
                                            <TableCell>{event.creator?.full_name || event.creator_name || event.created_by}</TableCell>
                    <TableCell>{formatDate(event.event_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleReject(event.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(event.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
