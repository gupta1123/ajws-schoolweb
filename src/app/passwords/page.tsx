// src/app/passwords/page.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, User, Users, GraduationCap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { SinglePasswordReset } from '@/components/passwords/single-password-reset';
import { BulkPasswordReset } from '@/components/passwords/bulk-password-reset';

type ResetMode = 'single' | 'bulk' | null;

export default function PasswordsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<ResetMode>(null);

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
            <p className="text-gray-600">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (mode === 'single') {
    return <SinglePasswordReset onBack={() => setMode(null)} />;
  }

  if (mode === 'bulk') {
    return <BulkPasswordReset onBack={() => setMode(null)} />;
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('passwords.title', 'Password Management')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('passwords.subtitle', 'Reset passwords for staff, students, and parents')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Password Reset */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('single')}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('passwords.single.title', 'Single Password Reset')}</CardTitle>
              </div>
              <CardDescription>
                {t('passwords.single.description', 'Reset password for a single user')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setMode('single')}>
                {t('passwords.single.select', 'Select')}
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Password Reset */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('bulk')}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('passwords.bulk.title', 'Bulk Password Reset')}</CardTitle>
              </div>
              <CardDescription>
                {t('passwords.bulk.description', 'Reset passwords for multiple users at once')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setMode('bulk')}>
                {t('passwords.bulk.select', 'Select')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

