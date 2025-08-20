// src/app/(teacher)/timetable/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  BookOpen,
  User,
  MapPin
} from 'lucide-react';
import { useState } from 'react';

// Mock data for timetable
const mockTimetable = [
  { 
    id: '1', 
    day: 'Monday', 
    periods: [
      { time: '09:00 - 09:50', subject: 'Mathematics', class: 'Grade 5A', room: 'Room 101' },
      { time: '09:50 - 10:40', subject: 'Science', class: 'Grade 6B', room: 'Room 102' },
      { time: '10:40 - 11:30', subject: 'Break', class: '', room: '' },
      { time: '11:30 - 12:20', subject: 'English', class: 'Grade 5A', room: 'Room 101' },
      { time: '12:20 - 13:10', subject: 'Lunch', class: '', room: '' },
      { time: '13:10 - 14:00', subject: 'History', class: 'Grade 7C', room: 'Room 103' }
    ]
  },
  { 
    id: '2', 
    day: 'Tuesday', 
    periods: [
      { time: '09:00 - 09:50', subject: 'Science', class: 'Grade 6B', room: 'Room 102' },
      { time: '09:50 - 10:40', subject: 'Mathematics', class: 'Grade 5A', room: 'Room 101' },
      { time: '10:40 - 11:30', subject: 'Break', class: '', room: '' },
      { time: '11:30 - 12:20', subject: 'Geography', class: 'Grade 7C', room: 'Room 103' },
      { time: '12:20 - 13:10', subject: 'Lunch', class: '', room: '' },
      { time: '13:10 - 14:00', subject: 'Art', class: 'Grade 5A', room: 'Art Room' }
    ]
  },
  { 
    id: '3', 
    day: 'Wednesday', 
    periods: [
      { time: '09:00 - 09:50', subject: 'English', class: 'Grade 5A', room: 'Room 101' },
      { time: '09:50 - 10:40', subject: 'History', class: 'Grade 7C', room: 'Room 103' },
      { time: '10:40 - 11:30', subject: 'Break', class: '', room: '' },
      { time: '11:30 - 12:20', subject: 'Mathematics', class: 'Grade 6B', room: 'Room 102' },
      { time: '12:20 - 13:10', subject: 'Lunch', class: '', room: '' },
      { time: '13:10 - 14:00', subject: 'Science', class: 'Grade 5A', room: 'Room 101' }
    ]
  }
];

export default function TimetablePage() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  const currentDayTimetable = mockTimetable.find(day => day.day === selectedDay) || mockTimetable[0];

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Timetable</h1>
              <p className="text-gray-600 dark:text-gray-300">
                View your weekly teaching schedule
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Your teaching timetable for the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {mockTimetable.map((day) => (
                  <Button
                    key={day.id}
                    variant={selectedDay === day.day ? 'default' : 'outline'}
                    onClick={() => setSelectedDay(day.day)}
                  >
                    {day.day}
                  </Button>
                ))}
              </div>
              
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Time</th>
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Class</th>
                      <th className="text-left p-4 font-medium">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDayTimetable.periods.map((period, index) => (
                      <tr 
                        key={index} 
                        className={`border-b ${period.subject === 'Break' || period.subject === 'Lunch' ? 'bg-muted/30' : 'hover:bg-muted/50'}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{period.time}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {period.subject === 'Break' || period.subject === 'Lunch' ? (
                            <span className="font-medium">{period.subject}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{period.subject}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {period.class && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{period.class}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {period.room && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{period.room}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}