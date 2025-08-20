// src/components/dashboard/upcoming-events.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock,
  Users,
  BookOpen,
  Cake
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app this would come from an API
const mockEvents = [
  {
    id: '1',
    title: 'Parent-Teacher Meeting',
    type: 'meeting',
    date: '2025-08-20',
    time: '15:00',
    location: 'Room 101',
    attendees: 'Grade 5A Parents'
  },
  {
    id: '2',
    title: 'Mathematics Test',
    type: 'test',
    date: '2025-08-25',
    time: '10:00',
    location: 'Classroom 5A',
    attendees: 'Grade 5A Students'
  },
  {
    id: '3',
    title: 'Student Birthday - Aarav Patel',
    type: 'birthday',
    date: '2025-08-15',
    time: 'All day',
    location: 'Classroom 5A',
    attendees: 'Grade 5A Students'
  }
];

export function UpcomingEvents() {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'test':
        return <BookOpen className="h-4 w-4" />;
      case 'birthday':
        return <Cake className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'text-blue-500';
      case 'test':
        return 'text-green-500';
      case 'birthday':
        return 'text-pink-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/calendar">
              View Calendar
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
              <div className={`mt-0.5 ${getTypeColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{event.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <Clock className="h-3 w-3" />
                  <span>{event.time}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {event.location} • {event.attendees}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}