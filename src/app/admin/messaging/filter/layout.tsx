// src/app/admin/messaging/filter/layout.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';

export default function PrincipalMessagingFilterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Only allow admins and principals to access this page
  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
