// src/app/(admin)/academic/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { ComprehensiveAcademicManager } from '@/components/academic/comprehensive-academic-manager';

export default function AcademicStructurePage() {
  const { user } = useAuth();

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <ComprehensiveAcademicManager />
      </div>
    </ProtectedRoute>
  );
}