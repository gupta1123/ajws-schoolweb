// src/components/dashboard/upcoming-events.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, BookOpen, Clipboard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { calendarServices } from '@/lib/api';
import { CalendarEvent } from '@/lib/api/calendar';
import { useI18n } from '@/lib/i18n/context';

export function UpcomingEvents() {
  const { user, token } = useAuth();
  const { t, lang } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get current date and next 30 days for date range
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30);
        
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        let response;
        
        try {
          if (user?.role === 'teacher') {
            // For teachers, get events for their classes with date range filter
            console.log('Fetching teacher events...');
            response = await calendarServices.getTeacherEvents(
              token,
              startDateStr,
              endDateStr,
              'academic'
            );
            console.log('Teacher events response:', response);
          } else if (user?.role === 'parent') {
            // For parents, get events for their children's classes with date range
            console.log('Fetching parent events...');
            response = await calendarServices.getParentEvents(
              token,
              {
                start_date: startDateStr,
                end_date: endDateStr,
                event_category: 'meeting'
              }
            );
            console.log('Parent events response:', response);
          } else if (user?.role === 'admin' || user?.role === 'principal') {
            // For admin/principal, get all events with date range and IST
            console.log('Fetching admin events...');
            response = await calendarServices.getEvents(
              token,
              {
                start_date: startDateStr,
                end_date: endDateStr,
                event_category: 'meeting',
                use_ist: true
              }
            );
            console.log('Admin events response:', response);
          } else {
            // Default fallback for other roles
            console.log('Fetching default events...');
            response = await calendarServices.getEvents(
              token,
              {
                start_date: startDateStr,
                end_date: endDateStr,
                event_category: 'academic',
                use_ist: true
              }
            );
            console.log('Default events response:', response);
          }
        } catch (error) {
          console.error('Error with events API:', error);
          throw error;
        }

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          setEvents([]);
          return;
        }

        if (response.status === 'success' && response.data.events) {
          // Sort events by event date (recent to future)
          const sortedEvents = response.data.events
            .sort((a: CalendarEvent, b: CalendarEvent) => 
              new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
            )
            .slice(0, 5); // Show only next 5 events
          
          setEvents(sortedEvents);
        } else {
          console.warn('Unexpected response format:', response);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [token, user?.role]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang, { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'homework':
        return <Clipboard className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'meeting':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'homework':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dashboard.events.title', 'Upcoming Events')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            {t('dashboard.events.loading', 'Loading events...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dashboard.events.title', 'Upcoming Events')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-red-500 mb-2">{t('dashboard.events.loadFailed', 'Failed to load events')}</p>
            <p className="text-xs">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              {t('actions.refresh', 'Refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dashboard.events.title', 'Upcoming Events')}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/calendar">
              {t('common.viewAll', 'View All')}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${getEventColor(event.event_category)}`}>
                      {getEventIcon(event.event_category)}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      {event.class_info && (
                        <p className="text-xs text-muted-foreground">
                          {event.class_info.class_level} - {event.class_info.division}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.event_category)}`}>
                    {event.event_category}
                  </div>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(event.event_date)} {t('dashboard.events.at', 'at')} {formatTime(event.event_date)}
                    </span>
                  </div>
                  
                  {event.start_time && event.end_time && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.start_time} - {event.end_time}</span>
                    </div>
                  )}
                  
                  {(event.creator?.full_name || event.creator_name) && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {t('dashboard.events.createdBy', 'Created by')} {event.creator?.full_name || event.creator_name}
                      </span>
                  </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t('dashboard.events.emptyTitle', 'No upcoming events')}</p>
            <p className="text-xs">{t('dashboard.events.emptyHelp', 'Events will appear here when scheduled')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
