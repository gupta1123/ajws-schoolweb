// src/app/bulk-import/students/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { StudentImport } from '@/components/bulk-import/student-import';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BulkImportStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();

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
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bulk Import
          </Button>
        </div>
        <StudentImport />
      </div>
    </ProtectedRoute>
  );
}