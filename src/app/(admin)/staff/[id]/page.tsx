// src/app/(admin)/staff/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Phone,
  MapPin,
  BookOpen,
  Edit,
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { staffServices } from '@/lib/api';
import type { Staff } from '@/types/staff';

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [staffId, setStaffId] = useState<string>('');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classAssignments, setClassAssignments] = useState<{
    assignment_type: string;
    is_primary: boolean;
    class_division: {
      id: string;
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
      academic_year: {
        year_name: string;
      };
    };
  }[]>([]);
  const [classAssignmentsLoading, setClassAssignmentsLoading] = useState(false);



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

  // Fetch class assignments for the teacher
  useEffect(() => {
    const fetchClassAssignments = async () => {
      if (!token || !staffId || !staff || staff.role !== 'teacher') return;

      try {
        setClassAssignmentsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://school-app-backend-d143b785b631.herokuapp.com'}/api/academic/teachers/${staffId}/classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setClassAssignments(data.data.classes || []);
          }
        }
      } catch (err) {
        console.error('Fetch class assignments error:', err);
      } finally {
        setClassAssignmentsLoading(false);
      }
    };

    if (token && staffId && staff?.role === 'teacher') {
      fetchClassAssignments();
    }
  }, [token, staffId, staff]);

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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Loading staff details...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !staff) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Staff
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Shield className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Staff Details</h2>
              <p className="text-gray-600 mb-4">{error || 'Staff member not found'}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff Directory
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                  {staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{staff.full_name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                    <Shield className="h-3 w-3" />
                    <span className="capitalize font-medium">{staff.role}</span>
                  </Badge>
                  <Badge
                    variant={staff.is_active !== false ? "default" : "secondary"}
                    className="flex items-center gap-1.5 px-3 py-1"
                  >
                    {staff.is_active !== false ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Inactive</span>
                      </>
                    )}
                  </Badge>
                </div>
                {staff.department && (
                  <p className="text-muted-foreground font-medium">
                    {staff.department} Department
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/staff/${staffId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Contact Information */}
          <div className="space-y-6">
            <Card className="shadow-sm border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-6 w-6 text-primary" />
                  Contact Information
                </CardTitle>
                <CardDescription className="text-base">
                  Professional contact details and communication information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-background/80 rounded-xl border border-primary/20 hover:bg-background/90 transition-colors">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-base">{staff.phone_number}</p>
                    <p className="text-sm text-muted-foreground">Primary Phone Number</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-background/80 rounded-xl border border-primary/20 hover:bg-background/90 transition-colors">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-base">School Campus</p>
                    <p className="text-sm text-muted-foreground">Work Location</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Account Details & Class Assignments */}
          <div className="space-y-6">
            {/* Account Details */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-6 w-6 text-secondary-foreground" />
                  Account Details
                </CardTitle>
                <CardDescription className="text-base">
                  System access and role information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2 p-4 bg-background/80 rounded-xl border border-secondary/20">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Role</p>
                    <p className="font-bold text-foreground text-lg capitalize">{staff.role}</p>
                  </div>

                  <div className="space-y-2 p-4 bg-background/80 rounded-xl border border-secondary/20">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Account Status</p>
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${staff.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className="font-bold text-foreground text-lg">
                        {staff.is_active !== false ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  {staff.department && (
                    <div className="space-y-2 p-4 bg-background/80 rounded-xl border border-secondary/20">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="font-bold text-foreground text-lg">{staff.department}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Class Assignments - Only for teachers */}
            {staff?.role === 'teacher' && (
              <Card className="shadow-sm border-0 bg-gradient-to-br from-accent/5 to-accent/10">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BookOpen className="h-6 w-6 text-accent-foreground" />
                    Class Assignments
                  </CardTitle>
                  <CardDescription className="text-base">
                    Academic classes and subjects assigned to this teacher
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {classAssignmentsLoading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-base text-muted-foreground">Loading class assignments...</span>
                    </div>
                  ) : classAssignments.length > 0 ? (
                    <div className="space-y-6">
                      {/* Class Teacher assignments */}
                      {classAssignments.filter(assignment => assignment.assignment_type === 'class_teacher').length > 0 && (
                        <div>
                          <h4 className="font-bold text-base text-primary mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Class Teacher Responsibilities
                          </h4>
                          <div className="space-y-3">
                            {classAssignments
                              .filter(assignment => assignment.assignment_type === 'class_teacher')
                              .map((assignment, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border-2 border-primary/20 hover:bg-primary/15 transition-colors">
                                  <div>
                                    <p className="font-bold text-foreground text-lg">
                                      {assignment.class_division?.level?.name} - {assignment.class_division?.division}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {assignment.class_division?.academic_year?.year_name}
                                    </p>
                                  </div>
                                  <Badge variant="default" className="bg-primary text-primary-foreground text-sm px-3 py-1">
                                    Primary Class Teacher
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Other assignments */}
                      {classAssignments.filter(assignment => assignment.assignment_type !== 'class_teacher').length > 0 && (
                        <div>
                          <h4 className="font-bold text-base text-muted-foreground mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Subject Teaching Assignments
                          </h4>
                          <div className="space-y-3">
                            {classAssignments
                              .filter(assignment => assignment.assignment_type !== 'class_teacher')
                              .map((assignment, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-muted hover:bg-muted/70 transition-colors">
                                  <div>
                                    <p className="font-semibold text-foreground text-base">
                                      {assignment.class_division?.level?.name} - {assignment.class_division?.division}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {assignment.class_division?.academic_year?.year_name}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="text-sm px-3 py-1">
                                    {assignment.assignment_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-base text-muted-foreground font-medium">No class assignments found</p>
                      <p className="text-sm text-muted-foreground mt-1">This teacher is not currently assigned to any classes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}