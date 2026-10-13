// src/components/dashboard/welcome-banner.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Sun, Moon, Coffee } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { PageHeader } from '@/components/ui/page-kit';

const greetingFor = (hour: number) => {
  if (hour < 12) return { textKey: 'welcome.goodMorning', icon: <Coffee /> };
  if (hour < 17) return { textKey: 'welcome.goodAfternoon', icon: <Sun /> };
  return { textKey: 'welcome.goodEvening', icon: <Moon /> };
};

export function WelcomeBanner() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [greeting, setGreeting] = useState(() => greetingFor(9));
  const [today, setToday] = useState('');

  useEffect(() => {
    const now = new Date();
    setGreeting(greetingFor(now.getHours()));
    setToday(
      now.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
    );
  }, [lang]);

  const subtitle = (() => {
    switch (user?.role) {
      case 'teacher':
        return t('welcome.subtitles.teacher');
      case 'admin':
        return t('welcome.subtitles.admin');
      case 'principal':
        return t('welcome.subtitles.principal');
      default:
        return t('welcome.subtitles.default');
    }
  })();

  return (
    <PageHeader
      icon={greeting.icon}
      title={`${t(greeting.textKey)}, ${user?.full_name?.split(' ')[0] || t('welcome.user')}!`}
      subtitle={subtitle}
      actions={
        today ? (
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">{today}</span>
        ) : undefined
      }
    />
  );
}
