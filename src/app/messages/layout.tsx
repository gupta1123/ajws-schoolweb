// src/app/messages/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function MessagesLayout({
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