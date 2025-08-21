// src/app/reports/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DashboardWidgets } from '@/components/reports/dashboard-widgets';

export default function ReportsDashboardPage() {
  const { user } = useAuth();

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  const handleExportAll = () => {
    // In a real app, this would export all reports
    alert('All reports exported successfully!');
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-end">
          <Button onClick={handleExportAll} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export All Reports
          </Button>
        </div>

        <DashboardWidgets />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>Student Reports</CardTitle>
              </div>
              <CardDescription>
                Academic performance and enrollment data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Detailed analysis of student performance across grades and subjects.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/students">
                  View Student Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                <CardTitle>Staff Reports</CardTitle>
              </div>
              <CardDescription>
                Teacher and staff performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Evaluation of staff performance and professional development.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/staff">
                  View Staff Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <CardTitle>Communication Reports</CardTitle>
              </div>
              <CardDescription>
                Messaging and communication analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Insights into communication patterns and response rates.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/communication">
                  View Communication Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}