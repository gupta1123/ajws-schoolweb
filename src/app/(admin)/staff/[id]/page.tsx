// src/app/(admin)/staff/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Phone, Mail, User, Book, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { staffServices } from '@/lib/api';
import type { Staff } from '@/types/staff';
import { formatDate } from '@/lib/utils';

export default function StaffDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract staff ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setStaffId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch staff details
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!token || !staffId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Since there's no specific endpoint for single staff member,
        // we'll fetch all staff and find the one we need
        const response = await staffServices.getStaff(token);
        
        if (response.status === 'success') {
          const foundStaff = response.data.staff.find(s => s.id === staffId);
          if (foundStaff) {
            setStaff(foundStaff);
          } else {
            setError('Staff member not found');
          }
        } else {
          setError('Failed to fetch staff details');
        }
      } catch (err) {
        console.error('Fetch staff details error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staff details');
      } finally {
        setLoading(false);
      }
    };

    if (token && staffId) {
      fetchStaffDetails();
    }
  }, [token, staffId]);

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
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading staff details...</span>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !staff) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-6xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Staff Details</h2>
                <p className="text-gray-600 mb-4">{error || 'Staff member not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
              </div>
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
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Staff
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{staff.full_name}</h1>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={staff.is_active !== false ? 'default' : 'secondary'}
                    className={staff.is_active !== false ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {staff.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/messages?staffId=${staff.id}`}>
                    Message
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/staff/${staff.id}/edit`}>
                    Edit Staff
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Staff member&apos;s professional details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="mr-2 h-4 w-4" />
                    Full Name
                  </div>
                  <p className="font-medium">{staff.full_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Book className="mr-2 h-4 w-4" />
                    Role
                  </div>
                  <p className="font-medium">{staff.role}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Phone className="mr-2 h-4 w-4" />
                    Phone Number
                  </div>
                  <p className="font-medium">{staff.phone_number}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Book className="mr-2 h-4 w-4" />
                    Department
                  </div>
                  <p className="font-medium">{staff.department}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Book className="mr-2 h-4 w-4" />
                    Designation
                  </div>
                  <p className="font-medium">{staff.designation || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Book className="mr-2 h-4 w-4" />
                    Subject
                  </div>
                  <p className="font-medium">{staff.subject || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="mr-2 h-4 w-4" />
                    Created At
                  </div>
                  <p className="font-medium">
                    {staff.created_at ? formatDate(staff.created_at) : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="mr-2 h-4 w-4" />
                    Last Updated
                  </div>
                  <p className="font-medium">
                    {staff.updated_at ? formatDate(staff.updated_at) : 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for this staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/messages?staffId=${staff.id}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/leave-requests?staffId=${staff.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View Leave Records
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Note about classes */}
          <div className="grid gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Assignments</CardTitle>
                <CardDescription>
                  Class assignment information for this staff member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Book className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Class assignments not available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Class assignment information is not currently available in the API.
                    This feature may be added in future updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}