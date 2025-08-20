// src/components/dashboard/class-overview-card.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Clipboard,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

// Mock class data - in a real app this would come from an API
const mockClasses = [
  {
    id: '1',
    name: 'Grade 5',
    division: 'A',
    studentCount: 32,
    homeworkCompletion: 85,
    recentClasswork: 'Mathematics - Fractions',
    upcomingAssignments: 2,
    healthScore: 92
  },
  {
    id: '2',
    name: 'Grade 6',
    division: 'B',
    studentCount: 28,
    homeworkCompletion: 78,
    recentClasswork: 'Science - Photosynthesis',
    upcomingAssignments: 1,
    healthScore: 85
  },
  {
    id: '3',
    name: 'Grade 7',
    division: 'C',
    studentCount: 30,
    homeworkCompletion: 92,
    recentClasswork: 'English - Poetry',
    upcomingAssignments: 3,
    healthScore: 95
  }
];

export function ClassOverviewCard() {
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Class Overview</h2>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/classes">
            View All
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {classItem.name} - {classItem.division}
                </CardTitle>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthBackground(classItem.healthScore)}`}>
                  <span className={getHealthColor(classItem.healthScore)}>
                    {classItem.healthScore}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classItem.studentCount} students</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Homework Completion</span>
                  <span className="font-medium">{classItem.homeworkCompletion}%</span>
                </div>
                <Progress value={classItem.homeworkCompletion} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Recent:</span>
                  <span className="font-medium truncate">{classItem.recentClasswork}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Upcoming:</span>
                  <span className="font-medium">{classItem.upcomingAssignments} assignments</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href={`/homework/create?classId=${classItem.id}`}>
                    <BookOpen className="h-3 w-3 mr-1" />
                    Homework
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href={`/classwork/create?classId=${classItem.id}`}>
                    <Clipboard className="h-3 w-3 mr-1" />
                    Classwork
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}