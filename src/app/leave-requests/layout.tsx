// src/app/leave-requests/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function LeaveRequestsLayout({
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