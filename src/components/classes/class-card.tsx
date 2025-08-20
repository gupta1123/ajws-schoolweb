// src/components/classes/class-card.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Clipboard,
  Calendar,
  Cake,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface ClassCardProps {
  id: string;
  name: string;
  division: string;
  studentCount: number;
  homeworkCompletion: number;
  recentClasswork: string;
  upcomingAssignments: number;
  upcomingBirthdays: number;
  unreadMessages: number;
  healthScore: number;
}

export function ClassCard({
  id,
  name,
  division,
  studentCount,
  homeworkCompletion,
  recentClasswork,
  upcomingAssignments,
  upcomingBirthdays,
  unreadMessages,
  healthScore
}: ClassCardProps) {
  // Function to get health score color
  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Function to get health background
  const getHealthBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 75) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {name} - {division}
          </CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthBackground(healthScore)}`}>
            <span className={getHealthColor(healthScore)}>
              {healthScore}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{studentCount} students</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Homework Completion</span>
            <span className="font-medium">{homeworkCompletion}%</span>
          </div>
          <Progress value={homeworkCompletion} className="h-2" />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clipboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Recent:</span>
            <span className="font-medium truncate">{recentClasswork}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{upcomingAssignments}</span>
              <span className="text-muted-foreground text-xs">Assignments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cake className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{upcomingBirthdays}</span>
              <span className="text-muted-foreground text-xs">Birthdays</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{unreadMessages}</span>
              <span className="text-muted-foreground text-xs">Messages</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/classes/${id}`}>
              <Users className="h-3 w-3 mr-1" />
              Students
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/homework?classId=${id}`}>
              <BookOpen className="h-3 w-3 mr-1" />
              HW
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/classwork?classId=${id}`}>
              <Clipboard className="h-3 w-3 mr-1" />
              CW
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}