// src/app/birthdays/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function BirthdaysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}