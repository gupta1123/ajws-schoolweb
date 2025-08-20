// src/app/change-password/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function ChangePasswordLayout({
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