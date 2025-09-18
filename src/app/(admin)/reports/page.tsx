// src/app/reports/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DashboardWidgets } from '@/components/reports/dashboard-widgets';
import { useI18n } from '@/lib/i18n/context';

export default function ReportsDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
        </div>
      </div>
    );
  }

  const handleExportAll = () => {
    // In a real app, this would export all reports
    alert(t('reports.exportAllSuccess'));
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-end">
          <Button onClick={handleExportAll} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('reports.exportAll')}
          </Button>
        </div>

        <DashboardWidgets />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>{t('reports.students.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('reports.students.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('reports.students.detail')}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/students">
                  {t('reports.students.cta')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                <CardTitle>{t('reports.staff.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('reports.staff.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('reports.staff.detail')}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/staff">
                  {t('reports.staff.cta')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <CardTitle>{t('reports.communication.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('reports.communication.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('reports.communication.detail')}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/communication">
                  {t('reports.communication.cta')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
