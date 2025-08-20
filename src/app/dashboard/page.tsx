// src/app/dashboard/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { QuickActionsCarousel } from '@/components/dashboard/quick-actions-carousel';
import { PriorityAlerts } from '@/components/dashboard/priority-alerts';
import { ClassOverviewCard } from '@/components/dashboard/class-overview-card';
import { SchoolHealthDashboard } from '@/components/dashboard/school-health-dashboard';
import { ApprovalPipeline } from '@/components/dashboard/approval-pipeline';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PerformanceSummaryCard } from '@/components/dashboard/performance-summary-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <WelcomeBanner />
        <QuickActionsCarousel />
        <PriorityAlerts />
        
        {user?.role === 'teacher' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ClassOverviewCard />
              <PerformanceSummaryCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UpcomingEvents />
                <RecentActivity />
              </div>
            </div>
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Class Performance</span>
                        <span className="text-lg font-bold text-green-500">88%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Homework Submission</span>
                        <span className="text-lg font-bold text-blue-500">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Parent Engagement</span>
                        <span className="text-lg font-bold text-purple-500">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Quick Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="font-medium text-sm">Message all parents</div>
                      <div className="text-xs text-muted-foreground">Send announcement to Grade 5A parents</div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="font-medium text-sm">Send homework reminder</div>
                      <div className="text-xs text-muted-foreground">Remind about pending assignments</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : user?.role === 'admin' || user?.role === 'principal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SchoolHealthDashboard />
              <PerformanceSummaryCard />
              <ApprovalPipeline />
              <RecentActivity />
            </div>
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">Active Users</div>
                        <div className="text-sm text-muted-foreground">Today</div>
                      </div>
                      <div className="text-2xl font-bold">1,247</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">Messages Sent</div>
                        <div className="text-sm text-muted-foreground">This week</div>
                      </div>
                      <div className="text-2xl font-bold">89</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">Pending Requests</div>
                        <div className="text-sm text-muted-foreground">Awaiting approval</div>
                      </div>
                      <div className="text-2xl font-bold text-orange-500">12</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border">
                      <div className="font-medium text-sm">Annual Report Submission</div>
                      <div className="text-xs text-muted-foreground">Due: Aug 30, 2025</div>
                      <div className="text-xs text-red-500 mt-1">2 days remaining</div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="font-medium text-sm">Staff Meeting Minutes</div>
                      <div className="text-xs text-muted-foreground">Due: Sep 5, 2025</div>
                      <div className="text-xs text-orange-500 mt-1">1 week remaining</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}