// src/components/dashboard/welcome-banner.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sun,
  Moon,
  Coffee
} from 'lucide-react';
import { useTheme } from '@/lib/theme/context';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

export function WelcomeBanner() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const [greeting, setGreeting] = useState({ textKey: 'welcome.goodMorning', icon: <Sun className="h-5 w-5" /> });

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ textKey: 'welcome.goodMorning', icon: <Coffee className="h-5 w-5" /> });
    } else if (hour < 17) {
      setGreeting({ textKey: 'welcome.goodAfternoon', icon: <Sun className="h-5 w-5" /> });
    } else {
      setGreeting({ textKey: 'welcome.goodEvening', icon: <Moon className="h-5 w-5" /> });
    }
  }, []);


  const getRoleSpecificSubtitle = () => {
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
  };


  return (
    <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {greeting.icon}
              </div>
              <h1 className="text-2xl font-bold">
                {t(greeting.textKey)}, {user?.full_name?.split(' ')[0] || t('welcome.user')}!
              </h1>
            </div>
            <p className="text-muted-foreground">
              {getRoleSpecificSubtitle()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium capitalize">{theme} {t('welcome.mode')}</div>
                <div className="text-muted-foreground text-xs">{t('welcome.theme')}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
