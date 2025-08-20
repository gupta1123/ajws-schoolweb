// src/components/dashboard/school-health-dashboard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCog, 
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

// Mock data - in a real app this would come from an API
const mockMetrics = {
  totalStudents: 542,
  totalStaff: 45,
  activeClasses: 18,
  pendingApprovals: 12,
  attendanceRate: 94.2,
  homeworkCompletion: 87.5
};

export function SchoolHealthDashboard() {
  const metrics = [
    {
      title: 'Total Students',
      value: mockMetrics.totalStudents,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
      trend: '+2.3% from last month'
    },
    {
      title: 'Total Staff',
      value: mockMetrics.totalStaff,
      icon: <UserCog className="h-5 w-5" />,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-500',
      trend: '+1 from last month'
    },
    {
      title: 'Active Classes',
      value: mockMetrics.activeClasses,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-500',
      trend: 'Stable'
    },
    {
      title: 'Pending Approvals',
      value: mockMetrics.pendingApprovals,
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-500',
      trend: '-3 from yesterday'
    },
    {
      title: 'Attendance Rate',
      value: `${mockMetrics.attendanceRate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-500',
      trend: '+1.2% from last week'
    },
    {
      title: 'Homework Completion',
      value: `${mockMetrics.homeworkCompletion}%`,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-500',
      trend: '+3.1% from last week'
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
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}