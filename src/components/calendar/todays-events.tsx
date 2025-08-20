// src/components/calendar/todays-events.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  School, 
  Users, 
  Calendar as CalendarIcon, 
  Cake, 
  MapPin, 
  User,
  BookOpen,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Event type configuration
const eventTypeConfig = {
  school: { 
    label: 'School Events', 
    color: 'event-school', 
    textColor: 'text-white',
    darkColor: '',
    borderColor: 'border-school',
    icon: School
  },
  meeting: { 
    label: 'Meetings', 
    color: 'event-meeting', 
    textColor: 'text-white',
    darkColor: '',
    borderColor: 'border-meeting',
    icon: Users
  },
  class: { 
    label: 'Class Events', 
    color: 'event-class', 
    textColor: 'text-white',
    darkColor: '',
    borderColor: 'border-class',
    icon: BookOpen
  },
  birthday: { 
    label: 'Birthdays', 
    color: 'event-birthday', 
    textColor: 'text-white',
    darkColor: '',
    borderColor: 'border-birthday',
    icon: Cake
  },
  room_booking: { 
    label: 'Room Booking', 
    color: 'event-room-booking', 
    textColor: 'text-gray-800 dark:text-white',
    darkColor: '',
    borderColor: 'border-room-booking',
    icon: MapPin
  },
  leave: { 
    label: 'Leave', 
    color: 'event-leave', 
    textColor: 'text-white',
    darkColor: '',
    borderColor: 'border-leave',
    icon: User
  },
  pending_approval: { 
    label: 'Pending Approval', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-800',
    darkColor: 'dark:bg-orange-900/50',
    borderColor: 'border-orange-500',
    icon: CalendarIcon
  }
};

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: keyof typeof eventTypeConfig;
  class?: string;
  room?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
}

interface StudentBirthday {
  id: string;
  studentName: string;
  class: string;
  date: string;
}

interface TodaysEventsProps {
  events: CalendarEvent[];
  birthdays: StudentBirthday[];
  onEventClick?: (eventId: string) => void;
}

export function TodaysEvents({ events, birthdays, onEventClick }: TodaysEventsProps) {
  // Filter events that require approval but are not approved
  const pendingApprovalEvents = events.filter(
    event => event.requiresApproval && !event.approved
  );
  
  // Filter regular events (approved or don't require approval)
  const regularEvents = events.filter(
    event => !event.requiresApproval || (event.requiresApproval && event.approved)
  );

  return (
    <div className="space-y-6">
      {/* Pending Approval Events */}
      {pendingApprovalEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Events requiring your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovalEvents.map(event => {
                const config = eventTypeConfig.pending_approval;
                const Icon = config.icon;
                return (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded-lg border-l-4 ${config.borderColor} bg-card cursor-pointer hover:bg-muted`}
                    onClick={() => onEventClick && onEventClick(event.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color.replace('bg-', 'text-')}`} />
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.class && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {event.class}
                            </div>
                          )}
                          {event.room && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Room: {event.room}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Pending</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Events */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Events</CardTitle>
          <CardDescription>
            Events happening today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regularEvents.length > 0 ? (
            <div className="space-y-3">
              {regularEvents.map(event => {
                const config = eventTypeConfig[event.type];
                const Icon = config.icon;
                return (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded-lg border-l-4 ${config.borderColor} bg-card cursor-pointer hover:bg-muted`}
                    onClick={() => onEventClick && onEventClick(event.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color.replace('bg-', 'text-')}`} />
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.class && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {event.class}
                          </div>
                        )}
                        {event.room && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Room: {event.room}
                          </div>
                        )}
                        {event.teacher && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {event.teacher}
                          </div>
                        )}
                        {event.requiresApproval && event.approved && (
                          <div className="flex items-center gap-1 mt-1 text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Approved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No events scheduled for today
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Birthdays */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Birthdays</CardTitle>
          <CardDescription>
            Students celebrating their birthdays today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {birthdays.length > 0 ? (
            <div className="space-y-3">
              {birthdays.map(birthday => (
                <div key={birthday.id} className="p-3 rounded-lg border border-pink-200 dark:border-pink-900/50 bg-card">
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-pink-500" />
                    <div>
                      <div className="font-medium">{birthday.studentName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {birthday.class}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No birthdays today
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}