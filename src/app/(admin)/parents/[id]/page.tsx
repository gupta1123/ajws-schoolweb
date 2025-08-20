// src/app/(admin)/parents/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { 
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [parentId, setParentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract parent ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setParentId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch parent data
  useEffect(() => {
    const fetchParentData = async () => {
      if (!token || !parentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Since parent details endpoint doesn't exist, show a message
        setError('Parent details view is not yet implemented. Please use the students page to view parent information.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parent data';
        setError(errorMessage);
        console.error('Error fetching parent data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, [parentId, token]);

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-6xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading parent details...</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-6xl mx-auto pt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-6xl mx-auto pt-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Parent Details</h2>
            <p className="text-gray-600">Parent details view is not yet implemented. Please use the students page to view parent information.</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}