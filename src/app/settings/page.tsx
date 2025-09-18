// src/app/settings/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const settingsCategories = [
    {
      title: t('settings.profile.title'),
      description: t('settings.profile.desc'),
      icon: User,
      href: '/profile',
      color: 'text-blue-600',
    },
    {
      title: t('settings.appearance.title'),
      description: t('settings.appearance.desc'),
      icon: Palette,
      href: '/profile',
      color: 'text-purple-600',
    },
    {
      title: t('settings.notifications.title'),
      description: t('settings.notifications.desc'),
      icon: Bell,
      href: '/notifications',
      color: 'text-orange-600',
    },
    {
      title: t('settings.security.title'),
      description: t('settings.security.desc'),
      icon: Shield,
      href: '/change-password',
      color: 'text-green-600',
    },
    {
      title: t('settings.language.title'),
      description: t('settings.language.desc'),
      icon: Globe,
      href: '/profile',
      color: 'text-indigo-600',
    },
    {
      title: t('settings.data.title'),
      description: t('settings.data.desc'),
      icon: Database,
      href: '/data-settings',
      color: 'text-gray-600',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.title}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(category.href)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={category.href}>{t('settings.configure')}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Settings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t('settings.accountInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('settings.fullName')}</label>
                <p className="font-medium">{user?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('auth.phoneNumber')}</label>
                <p className="font-medium">{user?.phone_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('settings.email')}</label>
                <p className="font-medium">{user?.email || t('settings.notProvided')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('settings.role')}</label>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
