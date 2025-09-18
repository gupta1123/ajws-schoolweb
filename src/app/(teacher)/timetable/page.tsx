// src/app/(teacher)/timetable/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  BookOpen,
  User,
  RefreshCw,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTimetable } from '@/hooks/use-timetable';
import { useI18n } from '@/lib/i18n/context';

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function TimetablePage() {
  const { user } = useAuth();
  const { timetableData, loading, error, refreshTimetable } = useTimetable();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const { t } = useI18n();

  const dayLabels = useMemo(
    () => DAY_KEYS.map((d) => ({ key: d, label: t(`days.${d.toLowerCase()}`, d) })),
    [t]
  );

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.teachersOnlyPage', 'Only teachers can access this page.')}</p>
        </div>
      </div>
    );
  }

  const currentDayTimetable = timetableData?.timetable[selectedDay] || [];

  const formatTime = (periodNumber: number) => {
    // Simple time calculation based on period number
    const startHour = 8 + Math.floor((periodNumber - 1) * 0.75);
    const startMinute = ((periodNumber - 1) * 45) % 60;
    const endHour = 8 + Math.floor(periodNumber * 0.75);
    const endMinute = (periodNumber * 45) % 60;
    
    return `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600">{t('timetableTeacher.loading', 'Loading your timetable...')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">{t('timetableTeacher.errorTitle', 'Error Loading Timetable')}</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refreshTimetable} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('timetableTeacher.tryAgain', 'Try Again')}
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('timetableTeacher.title', 'My Timetable')}</h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('timetableTeacher.subtitle', 'Your weekly teaching schedule')}
              </p>
            </div>
            <Button onClick={refreshTimetable} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('actions.refresh', 'Refresh')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('timetableTeacher.weekly', 'Weekly Schedule')}
              </CardTitle>
              <CardDescription>
                {(timetableData?.teacher?.full_name || t('common.teacher', 'Teacher')) + ' ' + t('timetableTeacher.forWeek', "teaching timetable for the week")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {dayLabels.map(({ key, label }) => {
                  const hasClasses = timetableData?.timetable && timetableData.timetable[key]?.length > 0;
                  return (
                    <Button
                      key={key}
                      variant={selectedDay === key ? 'default' : 'outline'}
                      onClick={() => setSelectedDay(key)}
                      className={`relative ${hasClasses ? 'border-green-200' : ''}`}
                    >
                      {label}
                      {hasClasses && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                          {timetableData?.timetable[key]?.length}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {currentDayTimetable.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{t('timetableTeacher.noClasses', 'No Classes Scheduled')}</h3>
                  <p className="text-gray-600">{t('timetableTeacher.noClassesDesc', 'You have no classes scheduled for {day}').replace('{day}', t(`days.${selectedDay.toLowerCase()}`, selectedDay))}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">{t('timetableTeacher.table.period', 'Period')}</th>
                        <th className="text-left p-4 font-medium">{t('timetableTeacher.table.time', 'Time')}</th>
                        <th className="text-left p-4 font-medium">{t('timetableTeacher.table.subject', 'Subject')}</th>
                        <th className="text-left p-4 font-medium">{t('timetableTeacher.table.class', 'Class')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDayTimetable
                        .sort((a, b) => a.period_number - b.period_number)
                        .map((entry) => (
                        <tr 
                          key={entry.id} 
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4">
                            <Badge variant="outline" className="font-mono">
                              P{entry.period_number}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">
                                {formatTime(entry.period_number)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{entry.subject}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {entry.class_division
                                  ? `${entry.class_division.class_level.name} ${entry.class_division.division}`
                                  : `Class ${entry.class_division_id}`
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </div>
    </ProtectedRoute>
  );
}
