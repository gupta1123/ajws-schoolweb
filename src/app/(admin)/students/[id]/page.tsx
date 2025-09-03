// src/app/students/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Calendar, Phone, Mail, User, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { ParentLinking } from '@/components/students/parent-linking';
import { CreateParentModal } from '@/components/students/create-parent-modal';
import { studentServices, Student } from '@/lib/api/students';
import { leaveRequestServices } from '@/lib/api/leave-requests';
import { formatDate } from '@/lib/utils';
import { LeaveRequest } from '@/types/leave-requests';

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [showParentLinking, setShowParentLinking] = useState(false);
  const [showCreateParent, setShowCreateParent] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [leaveHistoryLoading, setLeaveHistoryLoading] = useState(false);

  // Extract student ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setStudentId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch leave history for the student
  const fetchLeaveHistory = useCallback(async () => {
    if (!token || !studentId) return;

    try {
      setLeaveHistoryLoading(true);
      const response = await leaveRequestServices.getByStudent(studentId, {}, token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        console.error('Unexpected blob response for leave requests');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        console.error('Error fetching leave history:', response.message);
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        setLeaveHistory(response.data.leave_requests || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching leave history:', err);
      // Don't show error for leave history, just log it
    } finally {
      setLeaveHistoryLoading(false);
    }
  }, [token, studentId]);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!token || !studentId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await studentServices.getStudentById(studentId, token);

        // Handle Blob response (shouldn't happen for JSON endpoints)
        if (response instanceof Blob) {
          setError('Unexpected response format from API');
          return;
        }

        // Handle error response
        if ('status' in response && response.status === 'error') {
          setError(response.message || 'Failed to fetch student data');
          return;
        }

        // Handle successful response
        if ('status' in response && response.status === 'success' && response.data) {
          setStudentData(response.data.student);
          // Fetch leave history after student data is loaded
          fetchLeaveHistory();
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student data';
        setError(errorMessage);
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token && studentId) {
      fetchStudentData();
    }
  }, [token, studentId, fetchLeaveHistory]);




  const handleLinkParent = async (parentId: string, relationship: string, isPrimary: boolean, accessLevel: string) => {
    if (!token || !studentData) return;
    
    try {
      const response = await studentServices.linkStudentToParent(
        studentData.id,
        {
          parent_id: parentId,
          relationship: relationship as 'father' | 'mother' | 'guardian',
          is_primary_guardian: isPrimary,
          access_level: accessLevel as 'full' | 'restricted' | 'readonly'
        },
        token
      );

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        console.error('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        console.error('Failed to link parent:', response.message);
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success') {
        // Add a small delay to ensure the backend has processed the link
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh student data to show the new parent
        const updatedResponse = await studentServices.getStudentById(studentId, token);

        // Handle Blob response for updated response
        if (updatedResponse instanceof Blob) {
          console.error('Unexpected response format from API for updated data');
          return;
        }

        // Handle error response for updated response
        if ('status' in updatedResponse && updatedResponse.status === 'error') {
          console.error('Failed to get updated student data:', updatedResponse.message);
          return;
        }

        // Handle successful response for updated response
        if ('status' in updatedResponse && updatedResponse.status === 'success' && updatedResponse.data) {
          setStudentData(updatedResponse.data.student);
        } else {
          console.error('Failed to get updated student data:', updatedResponse);
        }
      } else {
        console.error('Failed to link parent:', response);
      }
    } catch (err: unknown) {
      console.error('Error linking parent:', err);
      // You might want to show an error message to the user here
    }
    
    // Close the parent linking modal
    setShowParentLinking(false);
  };

  // Function to handle canceling parent linking
  const handleCancelParentLinking = () => {
    setShowParentLinking(false);
  };

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
              <span className="ml-2">Loading student details...</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !studentData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-6xl mx-auto pt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-gray-600">{error || 'Student not found'}</p>
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
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Students
            </Button>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {studentData.profile_photo_url ? (
                    <Image
                      src={studentData.profile_photo_url}
                      alt={`${studentData.full_name}'s profile picture`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Student Info */}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{studentData.full_name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={studentData.status === 'active' ? 'default' : 'secondary'}
                      className={studentData.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                    >
                      {studentData.status.charAt(0).toUpperCase() + studentData.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Message Parent button removed */}
                {/* Edit Student button commented out for now */}
                {/*
                <Button asChild>
                  <Link href={`/students/${studentData.id}/edit`}>
                    Edit Student
                  </Link>
                </Button>
                */}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Student&apos;s personal and admission details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="mr-2 h-4 w-4" />
                    Full Name
                  </div>
                  <p className="font-medium">{studentData.full_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Mail className="mr-2 h-4 w-4" />
                    Admission Number
                  </div>
                  <p className="font-medium">{studentData.admission_number}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="mr-2 h-4 w-4" />
                    Date of Birth
                  </div>
                  <p className="font-medium">{formatDate(studentData.date_of_birth)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="mr-2 h-4 w-4" />
                    Admission Date
                  </div>
                  <p className="font-medium">{formatDate(studentData.admission_date)}</p>
                </div>

              </CardContent>
            </Card>


          </div>

          {/* Academic History */}
          <div className="grid gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic History</CardTitle>
                <CardDescription>
                  Student&apos;s academic records across different years
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentData.student_academic_records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">N/A</TableCell>
                          <TableCell>{record.class_division.class_level?.name || 'N/A'}</TableCell>
                          <TableCell>{record.class_division.division || 'N/A'}</TableCell>
                          <TableCell>{record.roll_number}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Guardians */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Guardians</CardTitle>
                    <CardDescription>
                      Student&apos;s parent/guardian information
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowParentLinking(true)}
                    disabled={studentData.parent_mappings && studentData.parent_mappings.length >= 5}
                    title={studentData.parent_mappings && studentData.parent_mappings.length >= 5 ? 'All relationship types are already assigned' : ''}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Link Parent
                  </Button>
                  {studentData.parent_mappings && studentData.parent_mappings.length >= 5 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      All relationship types are already assigned to this student.
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">

                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentData.parent_mappings?.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-medium">{mapping.parent.full_name}</TableCell>
                          <TableCell>{mapping.relationship}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              {mapping.parent.phone_number}
                            </div>
                          </TableCell>
                          <TableCell>{mapping.parent.email || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                

              </CardContent>
            </Card>

            {/* Leave History */}
            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>
                  Student&apos;s leave request history and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaveHistoryLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading leave history...</span>
                  </div>
                ) : leaveHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No leave requests found for this student.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveHistory.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell>
                              <div className="font-medium">
                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {Math.ceil((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24))} day(s)
                              </div>
                            </TableCell>
                            <TableCell>{leave.reason}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  leave.status === 'approved' ? 'default' :
                                  leave.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(leave.created_at)}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/leave-requests/${leave.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Parent Modal */}
      <CreateParentModal
        isOpen={showCreateParent}
        onClose={() => setShowCreateParent(false)}
        onSuccess={(parentId) => {
          // Optionally refresh student data or show success message
          console.log('Parent created with ID:', parentId);
        }}
      />

      {/* Parent Linking Modal */}
      {showParentLinking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Link Parent</CardTitle>
                <CardDescription>
                  Link an existing parent to this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParentLinking
                  onLinkParent={handleLinkParent}
                  onCancel={handleCancelParentLinking}
                  existingParentMappings={studentData?.parent_mappings?.map(mapping => ({
                    relationship: mapping.relationship,
                    parent: {
                      id: mapping.parent.id,
                      full_name: mapping.parent.full_name
                    }
                  })) || []}
                  studentAdmissionNumber={studentData?.admission_number}
                  relationship="father"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}