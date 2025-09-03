// src/app/demo/page.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { StatCard } from '@/components/ui/stat-card';
import { QuickActionButton } from '@/components/ui/quick-action-button';
import { ClassHealthIndicator } from '@/components/classes/class-health-indicator';
import { PerformanceIndicator } from '@/components/students/performance-indicator';
import { 
  BookOpen, 
  Users, 
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Demo</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Showcase of all new UI components
        </p>
      </div>

      {/* Progress Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Progress Indicators</CardTitle>
          <CardDescription>
            Status-based progress indication components
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <ProgressIndicator status="pending" />
          <ProgressIndicator status="in-progress" />
          <ProgressIndicator status="completed" />
          <ProgressIndicator status="failed" />
          <ProgressIndicator status="cancelled" />
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stat Cards</CardTitle>
          <CardDescription>
            Metric display with trend information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value="1,247"
              description="Across all grades"
              trend="up"
              trendValue="+12%"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Attendance Rate"
              value="94.2%"
              description="This month"
              trend="up"
              trendValue="+2.3%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              title="Pending Approvals"
              value="12"
              description="Awaiting review"
              trend="down"
              trendValue="-3"
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              title="Messages Sent"
              value="89"
              description="This week"
              trend="neutral"
              trendValue="Stable"
              icon={<MessageSquare className="h-5 w-5" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Action Buttons</CardTitle>
          <CardDescription>
            Vertically oriented action buttons with icons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              href="#"
              icon={<BookOpen className="h-6 w-6" />}
              label="Homework"
              description="Create assignments"
            />
            <QuickActionButton
              href="#"
              icon={<FileText className="h-6 w-6" />}
              label="Classwork"
              description="Record activities"
            />
            <QuickActionButton
              href="#"
              icon={<Users className="h-6 w-6" />}
              label="Students"
              description="Manage roster"
            />
            <QuickActionButton
              href="#"
              icon={<Calendar className="h-6 w-6" />}
              label="Calendar"
              description="Schedule events"
            />
          </div>
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Health Indicators</CardTitle>
          <CardDescription>
            Visual indicators for performance and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <ClassHealthIndicator score={92} size="lg" />
              <p className="text-sm mt-2">Class Health</p>
            </div>
            <div className="flex gap-8">
              <PerformanceIndicator value={85} label="Attendance" trend="up" />
              <PerformanceIndicator value={92} label="Homework" trend="up" />
              <PerformanceIndicator value={78} label="Behavior" trend="down" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Status Variants</CardTitle>
          <CardDescription>
            Different visual treatments for various statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Progress Indicators</h3>
            <div className="flex flex-wrap gap-2">
              <ProgressIndicator status="pending" variant="default" />
              <ProgressIndicator status="in-progress" variant="info" />
              <ProgressIndicator status="completed" variant="success" />
              <ProgressIndicator status="failed" variant="error" />
              <ProgressIndicator status="cancelled" variant="warning" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Stat Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Success Metric"
                value="98.5%"
                description="Target achieved"
                trend="up"
                trendValue="+5.2%"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                title="Warning Metric"
                value="72.3%"
                description="Below threshold"
                trend="down"
                trendValue="-3.1%"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <StatCard
                title="Neutral Metric"
                value="1,247"
                description="Stable count"
                trend="neutral"
                trendValue="No change"
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}