// src/app/(teacher)/messaging/layout.tsx

'use client';

import { PageHeader } from '@/components/page-header';
import { useI18n } from '@/lib/i18n/context';

export default function MessagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title={t('messaging.title')} 
        description={t('messaging.subtitle')} 
      />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
