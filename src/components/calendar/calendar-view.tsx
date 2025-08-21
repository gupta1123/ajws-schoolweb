// src/components/calendar/calendar-view.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  School, 
  Users, 
  Calendar as CalendarIcon, 
  Cake, 
  MapPin, 
  User,
  BookOpen
} from 'lucide-react';


// Event type configuration
const eventTypeConfig = {
  school: { 
    label: 'School Events', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-800',
    darkColor: 'dark:bg-blue-900/50',
    icon: School
  },
  meeting: { 
    label: 'Meetings', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-800',
    darkColor: 'dark:bg-purple-900/50',
    icon: Users
  },
  class: { 
    label: 'Class Events', 
    color: 'bg-green-500', 
    textColor: 'text-green-800',
    darkColor: 'dark:bg-green-900/50',
    icon: BookOpen
  },
  birthday: { 
    label: 'Birthdays', 
    color: 'bg-pink-500', 
    textColor: 'text-pink-800',
    darkColor: 'dark:bg-pink-900/50',
    icon: Cake
  },
  room_booking: { 
    label: 'Room Booking', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-800',
    darkColor: 'dark:bg-yellow-900/50',
    icon: MapPin
  },
  leave: { 
    label: 'Leave', 
    color: 'bg-red-500', 
    textColor: 'text-red-800',
    darkColor: 'dark:bg-red-900/50',
    icon: User
  },
  pending_approval: { 
    label: 'Pending Approval', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-800',
    darkColor: 'dark:bg-orange-900/50',
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

interface CalendarViewProps {
  events: CalendarEvent[];
  birthdays: StudentBirthday[];
  onEventClick?: (eventId: string) => void;
}

export function CalendarView({ events, birthdays, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleEventTypes, setVisibleEventTypes] = useState({
    school: true,
    meeting: true,
    class: true,
    birthday: true,
    room_booking: true,
    leave: true,
    pending_approval: true
  });
  
  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };
  
  const getBirthdaysForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return birthdays.filter(birthday => birthday.date === dateStr);
  };
  
  const getFilteredEventsForDate = (date: Date) => {
    const dateEvents = getEventsForDate(date);
    const dateBirthdays = getBirthdaysForDate(date);
    
    const filteredEvents = dateEvents.filter(event => {
      // Handle approval status
      if (event.requiresApproval && !event.approved) {
        return visibleEventTypes.pending_approval;
      }
      return visibleEventTypes[event.type as keyof typeof visibleEventTypes];
    });
    
    const filteredBirthdays = visibleEventTypes.birthday ? dateBirthdays : [];
    
    return { events: filteredEvents, birthdays: filteredBirthdays };
  };
  
  const toggleEventType = (type: keyof typeof visibleEventTypes) => {
    setVisibleEventTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">{monthYear}</h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
            Today
          </Button>
        </div>
        
        {/* Event Type Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(eventTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 ${
                  visibleEventTypes[type as keyof typeof visibleEventTypes]
                    ? `${config.color} border-${config.color.replace('bg-', '')} text-white`
                    : 'opacity-50'
                }`}
                onClick={() => toggleEventType(type as keyof typeof visibleEventTypes)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
          <CardDescription>
            Events and important dates for {monthYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center p-2 font-medium text-sm bg-gray-100 dark:bg-gray-800 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const isToday = day && formatDate(day) === formatDate(today);
              const { events: dayEvents, birthdays: dayBirthdays } = day ? getFilteredEventsForDate(day) : { events: [], birthdays: [] };
              
              return (
                <div 
                  key={index} 
                  className={`min-h-24 p-2 border rounded relative ${
                    day ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/20'
                  } ${
                    isToday ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-medium text-sm mb-1">
                        {day.getDate()}
                        {isToday && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <div className="space-y-1 max-h-16 overflow-y-auto">
                        {dayEvents.map(event => {
                          const config = event.requiresApproval && !event.approved 
                            ? eventTypeConfig.pending_approval 
                            : eventTypeConfig[event.type as keyof typeof eventTypeConfig];
                          const Icon = config.icon;
                          return (
                            <div 
                              key={event.id} 
                              className={`text-xs p-1 rounded truncate flex items-center gap-1 ${config.color} ${config.textColor} ${config.darkColor} cursor-pointer hover:opacity-80`}
                              onClick={() => onEventClick && onEventClick(event.id)}
                            >
                              <Icon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {event.startTime} {event.title}
                                {event.requiresApproval && !event.approved && (
                                  <span className="ml-1">⏳</span>
                                )}
                                {event.requiresApproval && event.approved && (
                                  <span className="ml-1">✅</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                        {dayBirthdays.map(birthday => {
                          const config = eventTypeConfig.birthday;
                          const Icon = config.icon;
                          return (
                            <div 
                              key={birthday.id} 
                              className={`text-xs p-1 rounded truncate flex items-center gap-1 ${config.color} ${config.textColor} ${config.darkColor}`}
                            >
                              <Icon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{birthday.studentName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}