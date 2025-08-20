// src/components/layout/app-layout.tsx

'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { UserOnboardingWizard } from '@/components/onboarding/user-onboarding-wizard';

export function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 relative md:ml-64 pt-16">
        {children}
        <UserOnboardingWizard />
      </main>
    </div>
  );
}