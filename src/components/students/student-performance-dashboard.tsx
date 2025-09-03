// src/components/students/student-performance-dashboard.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { DataChart } from '@/components/ui/data-chart';

interface StudentPerformanceDashboardProps {
  studentId: string;
  name: string;
  rollNumber: string;
  class: string;
  attendanceRate: number;
  homeworkCompletion: number;
  behaviorScore: number;
  recentClasswork: string;
  upcomingBirthdays: boolean;
  unreadMessages: number;
  phoneNumber: string;
  parentName: string;
  parentPhone: string;
}

export function StudentPerformanceDashboard({
  studentId,
  name,
  attendanceRate,
  homeworkCompletion,
  behaviorScore,
  recentClasswork,
  unreadMessages,
  phoneNumber,
  parentName,
  parentPhone,
}: StudentPerformanceDashboardProps) {
  // Mock data for charts
  const mockAttendanceData = [
    { week: 'Week 1', rate: 92 },
    { week: 'Week 2', rate: 88 },
    { week: 'Week 3', rate: 95 },
    { week: 'Week 4', rate: 90 },
  ];

  const mockHomeworkData = [
    { subject: 'Math', score: 85 },
    { subject: 'Science', score: 78 },
    { subject: 'English', score: 92 },
    { subject: 'History', score: 88 },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Attendance
            </CardTitle>
            <CardDescription>
              Class attendance rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className={`text-3xl font-bold mb-2 ${
                attendanceRate >= 90 ? 'text-green-500' : 
                attendanceRate >= 75 ? 'text-blue-500' : 'text-yellow-500'
              }`}>
                {attendanceRate}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    attendanceRate >= 90 ? 'bg-green-500' : 
                    attendanceRate >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} 
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {attendanceRate >= 90 ? 'Excellent attendance' : 
                 attendanceRate >= 75 ? 'Good attendance' : 'Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Homework
            </CardTitle>
            <CardDescription>
              Assignment completion rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className={`text-3xl font-bold mb-2 ${
                homeworkCompletion >= 90 ? 'text-green-500' : 
                homeworkCompletion >= 75 ? 'text-blue-500' : 'text-yellow-500'
              }`}>
                {homeworkCompletion}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    homeworkCompletion >= 90 ? 'bg-green-500' : 
                    homeworkCompletion >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} 
                  style={{ width: `${homeworkCompletion}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {homeworkCompletion >= 90 ? 'Excellent submission' : 
                 homeworkCompletion >= 75 ? 'Good submission' : 'Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Behavior
            </CardTitle>
            <CardDescription>
              Conduct and participation score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className={`text-3xl font-bold mb-2 ${
                behaviorScore >= 90 ? 'text-green-500' : 
                behaviorScore >= 75 ? 'text-blue-500' : 'text-yellow-500'
              }`}>
                {behaviorScore}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    behaviorScore >= 90 ? 'bg-green-500' : 
                    behaviorScore >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} 
                  style={{ width: `${behaviorScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {behaviorScore >= 90 ? 'Outstanding behavior' : 
                 behaviorScore >= 75 ? 'Good behavior' : 'Needs attention'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Trend
            </CardTitle>
            <CardDescription>
              Weekly attendance pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataChart
              data={mockAttendanceData}
              type="line"
              dataKey="rate"
              xAxisKey="week"
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Scores by academic subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataChart
              data={mockHomeworkData}
              type="bar"
              dataKey="score"
              xAxisKey="subject"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest classwork and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-sm">Recent Classwork</div>
                <div className="text-muted-foreground text-xs">{recentClasswork}</div>
                <div className="text-muted-foreground text-xs mt-1">2 days ago</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-sm">Parent Message</div>
                <div className="text-muted-foreground text-xs">Message from {parentName}</div>
                <div className="text-muted-foreground text-xs mt-1">1 day ago</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-sm">Homework Assignment</div>
                <div className="text-muted-foreground text-xs">Mathematics - Chapter 3 Exercises</div>
                <div className="text-muted-foreground text-xs mt-1">Due: Tomorrow</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Communicate and engage with {name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href={`/messages?studentId=${studentId}`}>
                <MessageSquare className="h-5 w-5 mb-2" />
                <span className="font-medium text-sm">Message Parent</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {unreadMessages > 0 && (
                    <span className="text-destructive font-medium">
                      {unreadMessages} unread
                    </span>
                  )}
                </span>
              </Link>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href={`tel:${phoneNumber}`}>
                <Phone className="h-5 w-5 mb-2" />
                <span className="font-medium text-sm">Call Parent</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {parentPhone}
                </span>
              </Link>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href={`/students/${studentId}/report`}>
                <TrendingUp className="h-5 w-5 mb-2" />
                <span className="font-medium text-sm">Generate Report</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Academic progress
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}