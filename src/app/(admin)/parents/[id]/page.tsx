// src/app/(admin)/parents/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { parentServices, ParentDetailsResponse } from '@/lib/api/parents';

export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [parentId, setParentId] = useState<string>('');
  const [parentData, setParentData] = useState<ParentDetailsResponse['parent'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely get parent data
  const getParent = () => {
    if (!parentData) return null;
    return parentData;
  };

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

        const response = await parentServices.getParentById(parentId, token);

        // Handle Blob response (shouldn't happen for JSON endpoints)
        if (response instanceof Blob) {
          setError('Unexpected response format from API');
          return;
        }

        // Handle error response
        if ('status' in response && response.status === 'error') {
          // Handle API error response
          const errorResponse = response as { statusCode?: number; message?: string };
          if (errorResponse.statusCode === 404) {
            setError('Parent not found. The parent may have been deleted or you may not have access.');
          } else if (errorResponse.statusCode === 403) {
            setError('Access denied. You do not have permission to view this parent.');
          } else if (errorResponse.statusCode === 401) {
            setError('Authentication required. Please log in again.');
          } else if (errorResponse.statusCode && errorResponse.statusCode >= 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(errorResponse.message || 'Failed to fetch parent data');
          }
        }
        // Handle successful response
        else if ('status' in response && response.status === 'success' && response.data) {
          // Single parent response from /api/parent-student/parents/:parent_id
          setParentData(response.data.parent);
        } else {
          setError('Failed to fetch parent data');
        }
      } catch (err: unknown) {
        console.error('Error fetching parent data:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token && parentId) {
      fetchParentData();
    }
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
          <main className="max-w-2xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading parent details...</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !parentData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-2xl mx-auto pt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-gray-600">{error || 'Parent not found'}</p>
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
        <main className="max-w-4xl mx-auto pt-16">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Parents
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{parentData.full_name || 'Unknown Parent'}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    Registered
                  </Badge>
                  <Badge variant="outline">
                    {getParent()?.role || 'Unknown'}
                  </Badge>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parent Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Parent Information</CardTitle>
                <CardDescription>
                  Personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="mr-2 h-4 w-4" />
                    Full Name
                  </div>
                  <p className="font-medium">{getParent()?.full_name || 'Unknown'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="mr-2 h-4 w-4" />
                      Phone Number
                    </div>
                    <p className="font-medium">{getParent()?.phone_number || 'Unknown'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Address
                    </div>
                    <p className="font-medium">{getParent()?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Registration Status
                    </div>
                    <Badge variant="default">
                      Registered
                    </Badge>
                  </div>

                  {getParent()?.created_at && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="mr-2 h-4 w-4" />
                        Created Date
                      </div>
                      <p className="font-medium">{getParent()?.created_at ? formatDate(getParent()!.created_at) : 'N/A'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Overview of parent account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {getParent()?.children?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Children
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {getParent()?.children?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Primary Guardian
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children/Students Section */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Children ({getParent()?.children?.length || 0})</CardTitle>
                <CardDescription>
                  Students associated with this parent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const children = getParent()?.children;
                  if (children && children.length > 0) {
                    return (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Admission Number</TableHead>
                              <TableHead>Primary Guardian</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {children.map((child) => (
                              <TableRow key={child.id}>
                                <TableCell className="font-medium">
                                  {child.full_name}
                                </TableCell>
                                <TableCell>{child.admission_number}</TableCell>
                                <TableCell>
                                  <Badge variant={child.is_primary_guardian ? "default" : "secondary"}>
                                    {child.is_primary_guardian ? "Primary" : "Secondary"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/students/${child.id}`}>
                                      View Student
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No children associated with this parent.</p>
                        <p className="text-sm">You can link students to this parent from the student management page.</p>
                      </div>
                    );
                  }
                })()}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}