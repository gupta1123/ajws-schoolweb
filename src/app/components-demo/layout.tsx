// src/app/components-demo/layout.tsx

import { AppLayout } from '@/components/layout/app-layout';

export default function ComponentsDemoLayout({
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