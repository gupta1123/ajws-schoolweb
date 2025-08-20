// src/components/dashboard/recent-activity.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Clipboard,
  MessageSquare,
  FileText,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app this would come from an API
const mockActivities = [
  {
    id: '1',
    title: 'Homework assigned',
    description: 'Mathematics - Chapter 3 exercises',
    type: 'homework',
    time: '2 hours ago',
    user: 'John Doe'
  },
  {
    id: '2',
    title: 'Classwork recorded',
    description: 'Science - Photosynthesis experiment',
    type: 'classwork',
    time: '3 hours ago',
    user: 'John Doe'
  },
  {
    id: '3',
    title: 'Parent message',
    description: 'Message from Rajesh Patel regarding Aarav',
    type: 'message',
    time: '5 hours ago',
    user: 'Rajesh Patel'
  },
  {
    id: '4',
    title: 'Attendance marked',
    description: 'Morning attendance for Grade 5A',
    type: 'attendance',
    time: '1 day ago',
    user: 'John Doe'
  }
];

export function RecentActivity() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'homework':
        return <BookOpen className="h-4 w-4" />;
      case 'classwork':
        return <Clipboard className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'attendance':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework':
        return 'text-blue-500';
      case 'classwork':
        return 'text-green-500';
      case 'message':
        return 'text-purple-500';
      case 'attendance':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/activity">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`mt-0.5 ${getTypeColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{activity.title}</h3>
                <p className="text-muted-foreground text-xs">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}