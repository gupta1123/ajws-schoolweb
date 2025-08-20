// src/app/dashboard/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AppLayout>
  );
}