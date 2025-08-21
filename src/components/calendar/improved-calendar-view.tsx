// src/components/calendar/improved-calendar-view.tsx

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
  MapPin, 
  User,
  BookOpen,
  Plus,
  Filter,
  List,
  Grid3X3,
  Clock
} from 'lucide-react';
import { useTheme } from '@/lib/theme/context';

// Event type configuration with enhanced styling
const eventTypeConfig = {
  school: { 
    label: 'School Events', 
    color: 'event-school', 
    textColor: 'text-white',
    darkColor: '',
    icon: School,
    borderColor: 'border-school',
    gradient: 'from-blue-500 to-blue-600'
  },
  meeting: { 
    label: 'Meetings', 
    color: 'event-meeting', 
    textColor: 'text-white',
    darkColor: '',
    icon: Users,
    borderColor: 'border-meeting',
    gradient: 'from-purple-500 to-purple-600'
  },
  class: { 
    label: 'Class Events', 
    color: 'event-class', 
    textColor: 'text-white',
    darkColor: '',
    icon: BookOpen,
    borderColor: 'border-class',
    gradient: 'from-green-500 to-green-600'
  },

  room_booking: { 
    label: 'Room Booking', 
    color: 'event-room-booking', 
    textColor: 'text-gray-800 dark:text-white',
    darkColor: '',
    icon: MapPin,
    borderColor: 'border-room-booking',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  leave: { 
    label: 'Leave', 
    color: 'event-leave', 
    textColor: 'text-white',
    darkColor: '',
    icon: User,
    borderColor: 'border-leave',
    gradient: 'from-red-500 to-red-600'
  }
};

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: keyof typeof eventTypeConfig;
  class?: string;
  room?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
}

interface ImprovedCalendarViewProps {
  events: CalendarEvent[];
  onViewEvent: (eventId: string) => void;
  onAddEvent: (date: string) => void;
}

// No more mock data - everything comes from API

type ViewMode = 'monthly' | 'weekly' | 'daily';
type FilterType = 'all' | keyof typeof eventTypeConfig;

interface ImprovedCalendarViewProps {
  onViewEvent: (eventId: string) => void;
  onAddEvent: (date: string) => void;
}

export function ImprovedCalendarView({ events, onViewEvent, onAddEvent }: ImprovedCalendarViewProps) {
  const { colorScheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Generate calendar days for monthly view
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
    // Use local date formatting to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };
  
  const getFilteredEventsForDate = (date: Date) => {
    const events = getEventsForDate(date);
    
    // Filter by active filter
    if (activeFilter === 'all') {
      return events;
    }
    
    return events.filter(event => event.type === activeFilter);
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
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get theme color classes
  const getThemeClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          primary: 'bg-blue-500 hover:bg-blue-600',
          secondary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
        };
      case 'green':
        return {
          primary: 'bg-green-500 hover:bg-green-600',
          secondary: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
        };
      case 'purple':
        return {
          primary: 'bg-purple-500 hover:bg-purple-600',
          secondary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
        };
      case 'orange':
        return {
          primary: 'bg-orange-500 hover:bg-orange-600',
          secondary: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'
        };
      default:
        return {
          primary: 'bg-pink-500 hover:bg-pink-600',
          secondary: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300'
        };
    }
  };
  
  const themeClasses = getThemeClasses();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const today = new Date();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Calendar Area */}
      <div className="flex-grow">
        {/* Calendar Header */}
        <Card className="mb-6 shadow-sm border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    if (viewMode === 'monthly') navigateMonth('prev');
                    else if (viewMode === 'weekly') navigateWeek('prev');
                    else navigateDay('prev');
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold min-w-[200px] text-center text-gray-800 dark:text-white">
                  {viewMode === 'monthly'
                    ? monthYear
                    : viewMode === 'weekly'
                    ? `Week of ${formatDate(currentDate)}`
                    : formatDate(currentDate)
                  }
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {
                    if (viewMode === 'monthly') navigateMonth('next');
                    else if (viewMode === 'weekly') navigateWeek('next');
                    else navigateDay('next');
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 rounded-full"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-full overflow-hidden border shadow-sm">
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 px-4 ${viewMode === 'monthly' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('monthly')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Month</span>
                  </Button>
                  <Button
                    variant={viewMode === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 border-l px-4 ${viewMode === 'weekly' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('weekly')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Week</span>
                  </Button>
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 border-l px-4 ${viewMode === 'daily' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('daily')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Day</span>
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Calendar Grid */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            {viewMode === 'monthly' ? (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0 border-b">
                  {dayNames.map(day => (
                    <div key={day} className="text-center p-3 font-semibold text-sm text-gray-700 dark:text-gray-300">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0">
                  {calendarDays.map((day, index) => {
                    const isToday = day && formatDate(day) === formatDate(today);
                    const dayEvents = day ? getFilteredEventsForDate(day) : [];
                    
                    return (
                      <div 
                      key={index} 
                      className={`min-h-24 p-1 border ${
                        day ? 'bg-card' : 'bg-muted'
                      } ${index % 7 === 0 ? 'border-l' : ''} ${
                        Math.floor(index / 7) === 0 ? 'border-t' : ''
                      } ${isToday ? `border-2 border-primary` : 'border-border'}`}
                      onClick={() => day && onAddEvent(formatDate(day))}
                    >
                        {day && (
                      <>
                        <div className={`font-medium text-sm mb-1 p-1 rounded-full w-7 h-7 flex items-center justify-center mx-auto ${
                          isToday ? 'bg-primary text-primary-foreground' : ''
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {dayEvents.slice(0, 3).map(event => {
                            const config = eventTypeConfig[event.type];
                            const Icon = config.icon;
                            return (
                              <div 
                                key={event.id} 
                                className={`text-xs p-1.5 rounded-lg truncate flex items-center gap-1.5 ${config.color} text-white dark:text-white ${config.darkColor} cursor-pointer hover:opacity-90 hover:scale-105 transform transition-all duration-150 shadow-sm`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewEvent(event.id.replace('b-', ''));
                                }}
                              >
                                <Icon className="h-3 w-3 flex-shrink-0" />
                                <div className="flex-grow truncate">
                                  <div className="font-medium truncate text-xs">{event.title}</div>
                                  <div className="opacity-90 text-xs truncate">{event.startTime}</div>
                                </div>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 p-1 font-medium">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : viewMode === 'weekly' ? (
              // Weekly view implementation
              (() => {
                // Get the start of the week (Sunday)
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                
                // Generate 7 days for the week
                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                  const day = new Date(startOfWeek);
                  day.setDate(startOfWeek.getDate() + i);
                  weekDays.push(day);
                }
                
                return (
                  <>
                    {/* Week day headers */}
                    <div className="grid grid-cols-7 gap-0 border-b bg-gray-50 dark:bg-gray-800">
                      {weekDays.map((day, index) => {
                        const isToday = formatDate(day) === formatDate(today);
                        return (
                          <div 
                            key={index} 
                            className={`text-center p-3 font-semibold text-sm ${
                              isToday 
                                ? `${themeClasses.primary} text-white rounded-t-lg` 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div>{dayNames[day.getDay()]}</div>
                            <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {day.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Week events */}
                    <div className="grid grid-cols-7 gap-0">
                      {weekDays.map((day, dayIndex) => {
                        const isToday = formatDate(day) === formatDate(today);
                        const dayEvents = getFilteredEventsForDate(day);
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className={`min-h-96 p-2 border rounded-b-lg ${
                              day ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/20'
                            } ${dayIndex === 0 ? 'border-l' : ''} border-t ${
                              isToday ? `border-2 ${themeClasses.primary.replace(' ', '').replace('hover:bg-', 'border-')}` : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => onAddEvent(formatDate(day))}
                          >
                            <div className="space-y-1.5">
                              {dayEvents.map(event => {
                                const config = eventTypeConfig[event.type];
                                const Icon = config.icon;
                                return (
                                  <div 
                                    key={event.id} 
                                    className={`text-xs p-2 rounded-lg truncate flex items-center gap-2 ${config.color} text-white dark:text-white ${config.darkColor} cursor-pointer hover:opacity-90 hover:scale-105 transform transition-all duration-150 shadow-sm`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewEvent(event.id.replace('b-', ''));
                                    }}
                                  >
                                    <Icon className="h-3 w-3 flex-shrink-0" />
                                    <div className="flex-grow truncate">
                                      <div className="font-medium truncate">{event.title}</div>
                                      <div className="opacity-90 text-xs truncate">{event.startTime}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()
            ) : (
              // Daily view implementation
              (() => {
                const dayEvents = getFilteredEventsForDate(currentDate);
                
                return (
                  <div className="p-4 min-h-96">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h3>
                    </div>
                    
                    {dayEvents.length > 0 ? (
                      <div className="space-y-3">
                        {dayEvents.map(event => {
                          const config = eventTypeConfig[event.type];
                          const Icon = config.icon;
                          return (
                            <div 
                              key={event.id} 
                              className={`p-4 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border-l-4 ${config.borderColor} bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 relative overflow-hidden`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewEvent(event.id.replace('b-', ''));
                              }}
                            >
                              {/* Gradient accent */}
                              <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${config.gradient}`}></div>
                              
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${config.color} text-white`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg">{event.title}</h3>
                                    <span className="text-sm font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                      {event.startTime}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                      {event.startTime} - {event.endTime}
                                    </span>
                                  </div>
                                  
                                  {event.description && (
                                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                                      {event.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {event.class && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                        <BookOpen className="h-3 w-3" />
                                        {event.class}
                                      </span>
                                    )}
                                    {'room' in event && event.room && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                        <MapPin className="h-3 w-3" />
                                        {event.room}
                                      </span>
                                    )}
                                    {'teacher' in event && event.teacher && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                        <User className="h-3 w-3" />
                                        {event.teacher}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No events scheduled for today</p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEvent(formatDate(currentDate));
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Event
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar with Filters */}
      {showFilters && (
        <Card className="lg:w-64 flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter events by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className={`w-full justify-start ${activeFilter === 'all' ? themeClasses.primary : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                All Events
              </Button>
              
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant={activeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    className={`w-full justify-start ${
                      activeFilter === type ? themeClasses.primary : ''
                    }`}
                    onClick={() => setActiveFilter(type as FilterType)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${config.color.replace('bg-', 'text-')}`} />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Events:</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Events Today:</span>
                  <span className="font-medium">{getEventsForDate(today).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Approval:</span>
                  <span className="font-medium">
                    {events.filter(e => e.requiresApproval && !e.approved).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}