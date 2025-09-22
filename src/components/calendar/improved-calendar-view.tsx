// src/components/calendar/improved-calendar-view.tsx

'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  BookOpen,
  Plus,
  List,
  Grid3X3,
  Clock
} from 'lucide-react';
import { useTheme } from '@/lib/theme/context';
import { useI18n } from '@/lib/i18n/context';

// Simplified event type configuration
const eventTypeConfig = {
  school: { 
    label: 'Event', 
    color: 'bg-blue-500', 
    textColor: 'text-white',
    darkColor: 'dark:bg-blue-600',
    icon: CalendarIcon,
    borderColor: 'border-l-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  },
  class: { 
    label: 'Class Event', 
    color: 'bg-green-500', 
    textColor: 'text-white',
    darkColor: 'dark:bg-green-600',
    icon: BookOpen,
    borderColor: 'border-l-green-500',
    gradient: 'from-green-500 to-green-600'
  },
  pending: {
    label: 'Pending Event',
    color: 'bg-orange-500',
    textColor: 'text-white',
    darkColor: 'dark:bg-orange-600',
    icon: CalendarIcon,
    borderColor: 'border-l-orange-500',
    gradient: 'from-orange-500 to-orange-600'
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
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface ImprovedCalendarViewProps {
  events: CalendarEvent[];
  onViewEvent: (eventId: string) => void;
  onAddEvent: (date: string) => void;
  onMonthChange?: (date: Date) => void;
}

type ViewMode = 'monthly' | 'weekly' | 'daily';

export function ImprovedCalendarView({ events, onViewEvent, onAddEvent, onMonthChange }: ImprovedCalendarViewProps) {
  const { colorScheme } = useTheme();
  const { t, lang } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  
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
    // No filtering - show all events
    return getEventsForDate(date);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    // Notify parent component about month change
    onMonthChange?.(newDate);
  };
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
    
    // Check if month changed and notify parent
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();
    
    if (currentMonth !== newMonth || currentYear !== newYear) {
      onMonthChange?.(newDate);
    }
  };
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
    
    // Check if month changed and notify parent
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();
    
    if (currentMonth !== newMonth || currentYear !== newYear) {
      onMonthChange?.(newDate);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Notify parent component about month change if it's different
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    if (currentMonth !== todayMonth || currentYear !== todayYear) {
      onMonthChange?.(today);
    }
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
          primary: 'bg-indigo-500 hover:bg-indigo-600',
          secondary: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
        };
    }
  };
  
  const themeClasses = getThemeClasses();
  // Localized day names using current language
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2021, 7, i + 1).toLocaleDateString(lang, { weekday: 'short' })
  );
  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString(lang, { year: 'numeric', month: 'long' });
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      {/* Main Calendar Area */}
      <div>
        {/* Calendar Header */}
        <Card className="mb-6 shadow-sm border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => {
                    if (viewMode === 'monthly') navigateMonth('prev');
                    else if (viewMode === 'weekly') navigateWeek('prev');
                    else navigateDay('prev');
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold min-w-[180px] text-center text-gray-800 dark:text-white">
                  {viewMode === 'monthly'
                    ? monthYear
                    : viewMode === 'weekly'
                    ? `${t('calendar.view.weekOf', 'Week of')} ${formatDate(currentDate)}`
                    : formatDate(currentDate)
                  }
                </h2>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => {
                    if (viewMode === 'monthly') navigateMonth('next');
                    else if (viewMode === 'weekly') navigateWeek('next');
                    else navigateDay('next');
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-2 rounded-full px-4"
                  onClick={goToToday}
                >
                  {t('calendar.view.today', 'Today')}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-lg overflow-hidden border shadow-sm">
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 px-4 ${viewMode === 'monthly' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('monthly')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('calendar.view.month', 'Month')}</span>
                  </Button>
                  <Button
                    variant={viewMode === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 border-l px-4 ${viewMode === 'weekly' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('weekly')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('calendar.view.week', 'Week')}</span>
                  </Button>
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-none border-0 border-l px-4 ${viewMode === 'daily' ? 'shadow-inner' : ''}`}
                    onClick={() => setViewMode('daily')}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('calendar.view.day', 'Day')}</span>
                  </Button>
                </div>
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
                    <div key={day} className="text-center p-2 font-semibold text-sm text-gray-700 dark:text-gray-300">
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
                            <div className={`font-medium text-sm mb-1 p-1 rounded-full w-6 h-6 flex items-center justify-center mx-auto ${
                              isToday ? 'bg-primary text-primary-foreground' : ''
                            }`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                              {dayEvents.slice(0, 2).map(event => {
                                // Determine event type based on status
                                let eventType: keyof typeof eventTypeConfig = event.type;
                                if (event.status === 'pending') {
                                  eventType = 'pending';
                                }
                                
                                const config = eventTypeConfig[eventType] || eventTypeConfig.school;
                                const Icon = config.icon;
                                return (
                                  <div 
                                    key={event.id} 
                                    className={`text-xs p-1.5 rounded truncate flex items-center gap-1 ${config.color} text-white dark:text-white cursor-pointer hover:opacity-90 transition-all duration-150 shadow-sm`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewEvent(event.id.replace('b-', ''));
                                    }}
                                  >
                                    <Icon className="h-3 w-3 flex-shrink-0" />
                                    <div className="flex-grow truncate">
                                      <div className="font-medium truncate text-xs">{event.title}</div>
                                    </div>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-600 dark:text-gray-300 p-1 font-medium">
                                  +{dayEvents.length - 2} more
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
                            className={`text-center p-2 font-semibold text-sm ${
                              isToday 
                                ? `${themeClasses.primary} text-white rounded-t-lg` 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div>{dayNames[day.getDay()]}</div>
                            <div className={`text-base font-bold ${isToday ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
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
                            className={`min-h-80 p-2 border rounded-b-lg ${
                              day ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/20'
                            } ${dayIndex === 0 ? 'border-l' : ''} border-t ${
                              isToday ? `border-2 ${themeClasses.primary.replace(' ', '').replace('hover:bg-', 'border-')}` : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => onAddEvent(formatDate(day))}
                          >
                            <div className="space-y-1.5">
                              {dayEvents.map(event => {
                                // Determine event type based on status
                                let eventType: keyof typeof eventTypeConfig = event.type;
                                if (event.status === 'pending') {
                                  eventType = 'pending';
                                }
                                
                                const config = eventTypeConfig[eventType] || eventTypeConfig.school;
                                const Icon = config.icon;
                                return (
                                  <div 
                                    key={event.id} 
                                    className={`text-sm p-2 rounded truncate flex items-center gap-2 ${config.color} text-white dark:text-white cursor-pointer hover:opacity-90 transition-all duration-150 shadow-sm`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewEvent(event.id.replace('b-', ''));
                                    }}
                                  >
                                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <div className="flex-grow truncate">
                                      <div className="font-medium truncate text-sm">{event.title}</div>
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
                      <h3 className="text-xl font-bold">
                        {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h3>
                    </div>
                    
                    {dayEvents.length > 0 ? (
                      <div className="space-y-3">
                        {dayEvents.map(event => {
                          // Determine event type based on status
                          let eventType: keyof typeof eventTypeConfig = event.type;
                          if (event.status === 'pending') {
                            eventType = 'pending';
                          }
                          
                          const config = eventTypeConfig[eventType] || eventTypeConfig.school;
                          const Icon = config.icon;
                          return (
                            <div 
                              key={event.id} 
                              className={`p-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg border-l-4 ${config.borderColor} bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 relative overflow-hidden`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewEvent(event.id.replace('b-', ''));
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${config.color} text-white`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-base">{event.title}</h3>
                                    <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                      {event.startTime}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-2 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                      {event.startTime} - {event.endTime}
                                    </span>
                                  </div>
                                  
                                  {event.description && (
                                    <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                  
                                  {event.class && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                        <BookOpen className="h-3 w-3" />
                                        {event.class}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-base mb-2">{t('calendar.view.noEventsToday', 'No events scheduled for today')}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-3 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEvent(formatDate(currentDate));
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t('calendar.view.addEvent', 'Add Event')}
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
    </div>
  );
}
