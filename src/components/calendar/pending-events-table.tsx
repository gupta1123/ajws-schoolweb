// src/components/calendar/pending-events-table.tsx

'use client';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  User,
  BookOpen,
  School,
  Calendar as CalendarIcon,
  Eye,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { CalendarEvent } from '@/lib/api/calendar';
import { useI18n } from '@/lib/i18n/context';


interface PendingEventsTableProps {
  events: CalendarEvent[];
  loading: boolean;
  onViewEvent: (event: CalendarEvent) => void;
  onRefresh: () => void;
  userRole?: string;
}

// Event type configuration for consistent styling
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

export function PendingEventsTable({
  events,
  loading,
  onViewEvent,
  onRefresh
}: PendingEventsTableProps) {
  const { t } = useI18n();



  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      return `${day} ${month}' ${year}`;
    } catch {
      return t('calendar.pending.invalidDate', 'Invalid date');
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return t('calendar.pending.allDay', 'All day');
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



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('calendar.pending.title', 'Pending Event Requests')}</CardTitle>
          <CardDescription>
            {t('calendar.pending.subtitle', 'Events waiting for approval')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('calendar.pending.loading', 'Loading pending events...')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('calendar.pending.title', 'Pending Event Requests')}</CardTitle>
          <CardDescription>
            {t('calendar.pending.subtitle', 'Events waiting for approval')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('calendar.pending.emptyTitle', 'No pending events')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('calendar.pending.emptyHelp', 'All events have been processed or there are no pending requests at this time.')}
            </p>
            <div className="mt-6">
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('actions.refresh', 'Refresh')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calendar.pending.title', 'Pending Event Requests')}</CardTitle>
        <CardDescription>
          {events.length} {events.length !== 1 ? t('calendar.pending.events', 'events') : t('calendar.pending.event', 'event')} {t('calendar.pending.waiting', 'waiting for approval')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('calendar.pending.cols.details', 'Event Details')}</TableHead>
                <TableHead>{t('calendar.pending.cols.creator', 'Creator')}</TableHead>
                <TableHead>{t('calendar.pending.cols.typeCategory', 'Type & Category')}</TableHead>
                <TableHead>{t('calendar.pending.cols.dateTime', 'Date & Time')}</TableHead>
                <TableHead>{t('calendar.pending.cols.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const typeConfig = eventTypeConfig[event.event_type] || eventTypeConfig.school_wide;
                const categoryConfig = eventCategoryConfig[event.event_category] || eventCategoryConfig.general;
                const TypeIcon = typeConfig.icon;

                return (
                  <TableRow key={event.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">{event.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{event.creator?.full_name || event.creator_name || t('calendar.pending.unknown', 'Unknown')}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {event.creator?.role || event.creator_role || t('calendar.pending.unknown', 'Unknown')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {t(`calendar.form.eventType.${event.event_type}`, typeConfig.label)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t(`calendar.form.category.${event.event_category}`, categoryConfig.label)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{formatDate(event.event_date)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewEvent(event)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('actions.view', 'View')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('calendar.pending.emptyTitle', 'No pending events')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('calendar.pending.emptyHelp', 'All events have been processed or there are no pending requests at this time.')}
            </p>
            <div className="mt-6">
              <Button onClick={onRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('actions.refresh', 'Refresh')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
