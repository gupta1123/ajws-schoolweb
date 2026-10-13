// src/components/dashboard/upcoming-events.tsx

'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, BookOpen, Clipboard } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { calendarServices } from '@/lib/api';
import { CalendarEvent } from '@/lib/api/calendar';
import { useI18n } from '@/lib/i18n/context';
import { Panel, RowList, ListRow, IconChip, Pill, EmptyState, InlineError, PanelSkeleton } from '@/components/ui/page-kit';
import type { Tone } from '@/lib/design/tokens';

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
        
        // Get current date and next 7 days for date range (same as calendar page logic)
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7);
        
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        let response;
        
        try {
          if (user?.role === 'teacher') {
            // For teachers, use same API call as calendar page
            console.log('Fetching teacher events...');
            response = await calendarServices.getEventsByDateRange(
              token,
              startDateStr,
              endDateStr,
              { use_ist: true }
            );
            console.log('Teacher events response:', response);
          } else if (user?.role === 'parent') {
            // For parents, use same API call as calendar page
            console.log('Fetching parent events...');
            response = await calendarServices.getParentEvents(
              token,
              {
                start_date: startDateStr,
                end_date: endDateStr,
                use_ist: true
              }
            );
            console.log('Parent events response:', response);
          } else if (user?.role === 'admin' || user?.role === 'principal') {
            // For admin/principal, use same API call as calendar page
            console.log('Fetching admin events...');
            response = await calendarServices.getEventsByDateRange(
              token,
              startDateStr,
              endDateStr,
              { use_ist: true }
            );
            console.log('Admin events response:', response);
          } else {
            // Default fallback - use same API call as calendar page
            console.log('Fetching default events...');
            response = await calendarServices.getEventsByDateRange(
              token,
              startDateStr,
              endDateStr,
              { use_ist: true }
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
          // Apply same filtering logic as calendar page
          let filteredEvents = response.data.events;
          
          // Filter events based on user role (same as calendar page)
          if (user?.role === 'admin' || user?.role === 'principal') {
            // Admins and principals see all approved events
            filteredEvents = filteredEvents.filter(event => event.status === 'approved');
          } else if (user?.role === 'teacher') {
            // Teachers see approved events + their own pending events
            filteredEvents = filteredEvents.filter(event => 
              event.status === 'approved' || 
              (event.status === 'pending' && event.created_by === user.id)
            );
          } else {
            // Other users (parents, students) see only approved events
            filteredEvents = filteredEvents.filter(event => event.status === 'approved');
          }
          
          // Sort events by event date (recent to future)
          const sortedEvents = filteredEvents
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

  const trimSeconds = (time?: string | null) =>
    time && /^\d{2}:\d{2}:\d{2}$/.test(time) ? time.slice(0, 5) : time;

  const getEventIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return <BookOpen />;
      case 'meeting':
        return <Users />;
      case 'homework':
        return <Clipboard />;
      default:
        return <Calendar />;
    }
  };

  const getEventTone = (category: string): Tone => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'primary';
      case 'meeting':
        return 'violet';
      case 'homework':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const panelProps = {
    title: t('dashboard.events.title', 'Upcoming Events'),
    icon: <Calendar />,
    href: '/calendar',
    hrefLabel: t('common.viewAll', 'View All'),
    flush: true,
  };

  if (loading) {
    return (
      <Panel {...panelProps}>
        <PanelSkeleton />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel {...panelProps}>
        <InlineError
          title={t('dashboard.events.loadFailed', 'Failed to load events')}
          detail={error}
          onRetry={() => window.location.reload()}
          retryLabel={t('actions.refresh', 'Refresh')}
        />
      </Panel>
    );
  }

  return (
    <Panel {...panelProps}>
      {events.length > 0 ? (
        <RowList>
          {events.map((event) => {
            const creator = event.creator?.full_name || event.creator_name;
            return (
              <ListRow
                key={event.id}
                icon={<IconChip tone={getEventTone(event.event_category)}>{getEventIcon(event.event_category)}</IconChip>}
                title={event.title}
                trailing={<Pill tone={getEventTone(event.event_category)}>{event.event_category}</Pill>}
                meta={[
                  <span key="d">
                    {formatDate(event.event_date)} {t('dashboard.events.at', 'at')} {formatTime(event.event_date)}
                  </span>,
                  (event.start_time || event.end_time) && (
                    <span key="t">
                      {trimSeconds(event.start_time) || 'N/A'} - {trimSeconds(event.end_time) || 'N/A'}
                    </span>
                  ),
                  creator && (
                    <span key="c">
                      {t('dashboard.events.createdBy', 'Created by')} {creator}
                    </span>
                  ),
                ]}
              />
            );
          })}
        </RowList>
      ) : (
        <EmptyState
          icon={<Calendar />}
          title={t('dashboard.events.emptyTitle', 'No upcoming events')}
          help={t('dashboard.events.emptyHelp', 'Events will appear here when scheduled')}
        />
      )}
    </Panel>
  );
}
