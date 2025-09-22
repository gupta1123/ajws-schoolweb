// src/components/students/student-card.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Cake,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface StudentCardProps {
  id: string;
  name: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  attendanceRate: number;
  homeworkCompletion: number;
  recentClasswork: string;
  upcomingBirthdays: boolean;
  unreadMessages: number;
  behaviorScore: number;
}

export function StudentCard({
  id,
  name,
  rollNumber,
  dateOfBirth,
  phoneNumber,
  attendanceRate,
  homeworkCompletion,
  recentClasswork,
  upcomingBirthdays,
  unreadMessages,
  behaviorScore
}: StudentCardProps) {
  // Function to get behavior score color
  const getBehaviorColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  // Function to get attendance color
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground">Roll #{rollNumber}</p>
            </div>
          </div>
          <Badge variant="secondary" className={getBehaviorColor(behaviorScore)}>
            {behaviorScore}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{phoneNumber}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Cake className="h-3 w-3 text-muted-foreground" />
            <span>{formatDate(dateOfBirth)}</span>
            {upcomingBirthdays && (
              <Badge variant="secondary" className="ml-1">
                Today!
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className={`text-sm font-bold ${getAttendanceColor(attendanceRate)}`}>
              {attendanceRate}%
            </div>
            <div className="text-xs text-muted-foreground">Attendance</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-sm font-bold text-blue-500">
              {homeworkCompletion}%
            </div>
            <div className="text-xs text-muted-foreground">Homework</div>
          </div>
        </div>

        <div className="text-xs mb-3">
          <div className="text-muted-foreground mb-1">Recent Classwork:</div>
          <div className="font-medium truncate">{recentClasswork}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="h-5">
                <MessageSquare className="h-3 w-3 mr-1" />
                {unreadMessages}
              </Badge>
            )}
            {upcomingBirthdays && (
              <Badge variant="secondary" className="h-5 bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400">
                <Cake className="h-3 w-3 mr-1" />
                Birthday
              </Badge>
            )}
          </div>
          
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={`/messaging?studentId=${id}`}>
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={`/students/${id}`}>
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}