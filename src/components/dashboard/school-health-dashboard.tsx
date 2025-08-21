// src/components/dashboard/school-health-dashboard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCog,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

export function SchoolHealthDashboard() {
  const { data, loading, error } = useAnalytics();

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">School Health Dashboard</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load dashboard data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Students',
      value: loading ? null : data.totalStudents,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
      trend: loading ? null : '+2.3% from last month'
    },
    {
      title: 'Total Staff',
      value: loading ? null : data.totalStaff,
      icon: <UserCog className="h-5 w-5" />,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-500',
      trend: loading ? null : '+1 from last month'
    },
    {
      title: 'Active Classes',
      value: loading ? null : data.activeClasses,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-500',
      trend: loading ? null : 'Stable'
    },
    {
      title: 'Pending Approvals',
      value: loading ? null : data.pendingApprovals,
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-500',
      trend: loading ? null : '-3 from yesterday'
    },
    {
      title: 'Attendance Rate',
      value: loading ? null : `${data.attendanceRate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-500',
      trend: loading ? null : '+1.2% from last week'
    },
    {
      title: 'Homework Completion',
      value: loading ? null : `${data.homeworkCompletion}%`,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-500',
      trend: loading ? null : '+3.1% from last week'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">School Health Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.trend}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}