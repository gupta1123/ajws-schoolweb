// src/components/homework/homework-overview-dashboard.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart,
  PieChart,
  Clipboard
} from 'lucide-react';
import Link from 'next/link';
import { DataChart } from '@/components/ui/data-chart';
import { Progress } from '@/components/ui/progress';

interface HomeworkOverviewDashboardProps {
  totalAssignments: number;
  completedAssignments: number;
  avgSubmissionRate: number;
  avgScore: number;
  pendingGrading: number;
  upcomingDeadlines: number;
  classPerformance: Array<{ subject: string; avgScore: number }>;
  submissionTrends: Array<{ day: string; submissions: number }>;
}

export function HomeworkOverviewDashboard({
  totalAssignments,
  completedAssignments,
  avgSubmissionRate,
  avgScore,
  pendingGrading,
  upcomingDeadlines,
  classPerformance,
  submissionTrends,
}: HomeworkOverviewDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalAssignments}</div>
                <div className="text-sm font-normal text-muted-foreground">Total Assignments</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>{completedAssignments} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{avgSubmissionRate}%</div>
                <div className="text-sm font-normal text-muted-foreground">Avg. Submission</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${avgSubmissionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{avgScore}%</div>
                <div className="text-sm font-normal text-muted-foreground">Avg. Score</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-medium ${
              avgScore >= 90 ? 'text-green-500' : 
              avgScore >= 75 ? 'text-blue-500' : 'text-yellow-500'
            }`}>
              {avgScore >= 90 ? 'Excellent' : 
               avgScore >= 75 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pendingGrading}</div>
                <div className="text-sm font-normal text-muted-foreground">Pending Grading</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
              <span>{upcomingDeadlines} upcoming</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Submission Trends
            </CardTitle>
            <CardDescription>
              Weekly submission rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataChart
              data={submissionTrends}
              type="line"
              dataKey="submissions"
              xAxisKey="day"
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Average scores by subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataChart
              data={classPerformance}
              type="bar"
              dataKey="avgScore"
              xAxisKey="subject"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Assignment Progress
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/homework">
                View All Assignments
              </Link>
            </Button>
          </CardTitle>
          <CardDescription>
            Track your homework assignments and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Assignment Completion</span>
                <span>{avgSubmissionRate}%</span>
              </div>
              <Progress value={avgSubmissionRate} className="h-3" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Grading Progress</span>
                <span>
                  {completedAssignments > 0 
                    ? Math.round(((completedAssignments - pendingGrading) / completedAssignments) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={
                  completedAssignments > 0 
                    ? ((completedAssignments - pendingGrading) / completedAssignments) * 100
                    : 0
                } 
                className="h-3" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-blue-500">{totalAssignments}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-green-500">{completedAssignments}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-orange-500">{pendingGrading}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
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
            Common homework-related tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href="/homework/create">
                <BookOpen className="h-5 w-5 mb-1" />
                <span className="text-xs">Create Homework</span>
              </Link>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href="/classwork/create">
                <Clipboard className="h-5 w-5 mb-1" />
                <span className="text-xs">Record Classwork</span>
              </Link>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href="/homework/submissions">
                <CheckCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">Grade Submissions</span>
              </Link>
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-auto p-4" asChild>
              <Link href="/reports/homework">
                <BarChart className="h-5 w-5 mb-1" />
                <span className="text-xs">View Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}