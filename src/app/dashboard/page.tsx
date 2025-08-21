// src/app/dashboard/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { ClassOverviewCard } from '@/components/dashboard/class-overview-card';
import { SchoolHealthDashboard } from '@/components/dashboard/school-health-dashboard';
import { ApprovalPipeline } from '@/components/dashboard/approval-pipeline';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { UpcomingBirthdays } from '@/components/dashboard/upcoming-birthdays';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PerformanceSummaryCard } from '@/components/dashboard/performance-summary-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/use-analytics';
import Link from 'next/link';
import {
  UserCheck,
  User,
  MessageSquare,
  GraduationCap,
  Building2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();

  const adminQuickAccessCards = [
    {
      title: 'Students',
      description: 'Manage student records',
      icon: <GraduationCap className="h-6 w-6" />,
      href: '/students',
      color: 'bg-blue-500',
      stats: analyticsData?.totalStudents || 0,
      loading: analyticsLoading
    },
    {
      title: 'Parents',
      description: 'Parent management',
      icon: <UserCheck className="h-6 w-6" />,
      href: '/parents',
      color: 'bg-green-500',
      stats: 'Manage',
      loading: false
    },
    {
      title: 'Staff',
      description: 'Teacher & staff management',
      icon: <User className="h-6 w-6" />,
      href: '/staff',
      color: 'bg-purple-500',
      stats: analyticsData?.totalStaff || 0,
      loading: analyticsLoading
    },
    {
      title: 'Academic Structure',
      description: 'Classes & subjects',
      icon: <Building2 className="h-6 w-6" />,
      href: '/academic',
      color: 'bg-orange-500',
      stats: analyticsData?.activeClasses || 0,
      loading: analyticsLoading
    }
  ];

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <WelcomeBanner />
        
        {user?.role === 'teacher' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ClassOverviewCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UpcomingEvents />
                <UpcomingBirthdays />
              </div>
            </div>
            <div>
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
              {/* KPIs Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Total Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          analyticsData?.activeClasses || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Active divisions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          analyticsData?.totalStudents || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Enrolled students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Total Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Skeleton className="h-8 w-12" />
                        ) : (
                          analyticsData?.totalStaff || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Teaching staff</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {adminQuickAccessCards.map((card, index) => (
                    <Link key={index} href={card.href}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {card.icon}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                              <CardDescription className="text-sm">{card.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {card.loading ? (
                              <Skeleton className="h-8 w-12" />
                            ) : (
                              card.stats
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* School Health Dashboard */}
              <SchoolHealthDashboard />
              
              {/* Performance Summary */}
              <PerformanceSummaryCard />
              
              {/* Approval Pipeline */}
              <ApprovalPipeline />
              
              {/* Recent Activity */}
              <RecentActivity />
            </div>

            {/* Right Pane - Events and Birthdays */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <UpcomingEvents />
              
              {/* Upcoming Birthdays */}
              <UpcomingBirthdays />
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
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
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          analyticsData?.activeUsers || 0
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">Messages Sent</div>
                        <div className="text-sm text-muted-foreground">This week</div>
                      </div>
                                              <div className="text-2xl font-bold">
                          {analyticsLoading ? (
                            <Skeleton className="h-8 w-12" />
                          ) : (
                            analyticsData?.newMessages || 0
                          )}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">Pending Requests</div>
                        <div className="text-sm text-muted-foreground">Awaiting approval</div>
                      </div>
                                              <div className="text-2xl font-bold text-orange-500">
                          {analyticsLoading ? (
                            <Skeleton className="h-8 w-12" />
                          ) : (
                            analyticsData?.pendingApprovals || 0
                          )}
                        </div>
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