// src/components/dashboard/teacher-workload-summary.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

export function TeacherWorkloadSummary() {
  // Mock data for workload summary
  const workloadData = {
    totalClasses: 3,
    totalStudents: 90,
    pendingHomework: 12,
    upcomingDeadlines: 5,
    unreadMessages: 8,
    pendingApprovals: 3,
    averageClassPerformance: 88,
    homeworkCompletionRate: 92,
    parentEngagementRate: 75
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workload Summary
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/workload">
              View Details
            </Link>
          </Button>
        </div>
        <CardDescription>
          Your teaching responsibilities and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <div className="text-lg font-bold text-blue-500">{workloadData.totalClasses}</div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <div className="text-lg font-bold text-green-500">{workloadData.totalStudents}</div>
            <div className="text-xs text-muted-foreground">Students</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <div className="text-lg font-bold text-orange-500">{workloadData.pendingHomework}</div>
            <div className="text-xs text-muted-foreground">Homework</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <div className="text-lg font-bold text-purple-500">{workloadData.unreadMessages}</div>
            <div className="text-xs text-muted-foreground">Messages</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Avg. Class Performance</span>
              <span className="font-medium">{workloadData.averageClassPerformance}%</span>
            </div>
            <Progress value={workloadData.averageClassPerformance} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Homework Completion</span>
              <span className="font-medium">{workloadData.homeworkCompletionRate}%</span>
            </div>
            <Progress value={workloadData.homeworkCompletionRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Parent Engagement</span>
              <span className="font-medium">{workloadData.parentEngagementRate}%</span>
            </div>
            <Progress value={workloadData.parentEngagementRate} className="h-2" />
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/homework/create">
                <BookOpen className="h-3 w-3 mr-1" />
                Create Homework
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/messages">
                <AlertTriangle className="h-3 w-3 mr-1" />
                View Messages ({workloadData.unreadMessages})
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/approvals">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approvals ({workloadData.pendingApprovals})
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}