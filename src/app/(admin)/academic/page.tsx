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
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Academic Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage classes, sections, and academic years
              </p>
            </div>
          </div>
        </div>

        <ComprehensiveAcademicManager />
      </div>
    </ProtectedRoute>
  );
}