// src/app/leave-requests/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowLeft, Phone, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/lib/theme/context';
import { useLeaveRequests } from '@/hooks/use-leave-requests';
import { useEffect, useState } from 'react';
import type { LeaveRequest } from '@/types/leave-requests';
import { formatDate } from '@/lib/utils';

// Simple status badge component with theme support
const StatusBadge = ({ status }: { status: string }) => {
  const { colorScheme } = useTheme();
  
  // Get theme-aware colors
  const getThemeColors = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
      case 'green':
        return {
          pending: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
          rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
        };
      case 'purple':
        return {
          pending: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
          approved: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
          rejected: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
        };
      case 'orange':
        return {
          pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
          approved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
      default:
        return {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
    }
  };
  
  const themeColors = getThemeColors();
  const statusConfig = {
    pending: { text: 'Pending', className: themeColors.pending },
    approved: { text: 'Approved', className: themeColors.approved },
    rejected: { text: 'Rejected', className: themeColors.rejected }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { text: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.text}
    </span>
  );
};

export default function LeaveRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const router = useRouter();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getLeaveRequestById, approveLeaveRequest, rejectLeaveRequest } = useLeaveRequests();

  // Extract request ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: requestIdFromParams } = resolvedParams;
      
      // Fetch leave request data on mount
      const fetchLeaveRequest = async () => {
        if (!requestIdFromParams) return;
        
        try {
          setLoading(true);
          setError(null);
          const data = await getLeaveRequestById(requestIdFromParams);
          if (data) {
            setLeaveRequest(data);
          } else {
            setError('Leave request not found');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch leave request');
        } finally {
          setLoading(false);
        }
      };

      fetchLeaveRequest();
    };
    
    extractId();
  }, [params, getLeaveRequestById]);

  // Allow admins, principals, and teachers to access this page
  // Teachers can view and manage leave requests for their assigned classes
  if (user?.role !== 'admin' && user?.role !== 'principal' && user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins, principals, and teachers can access this page.</p>
        </div>
      </div>
    );
  }

  // Get theme-aware button colors
  const getButtonColors = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          approve: 'bg-blue-500 hover:bg-blue-600',
          reject: 'bg-red-500 hover:bg-red-600'
        };
      case 'green':
        return {
          approve: 'bg-green-500 hover:bg-green-600',
          reject: 'bg-rose-500 hover:bg-rose-600'
        };
      case 'purple':
        return {
          approve: 'bg-purple-500 hover:bg-purple-600',
          reject: 'bg-pink-500 hover:bg-pink-600'
        };
      case 'orange':
        return {
          approve: 'bg-orange-500 hover:bg-orange-600',
          reject: 'bg-red-500 hover:bg-red-600'
        };
      default:
        return {
          approve: 'bg-green-500 hover:bg-green-600',
          reject: 'bg-red-500 hover:bg-red-600'
        };
    }
  };

  const buttonColors = getButtonColors();

  const handleApproveRequest = async (requestId: string) => {
    const success = await approveLeaveRequest(requestId);
    if (success) {
      // Refresh the data
      const updatedData = await getLeaveRequestById(requestId);
      if (updatedData) {
        setLeaveRequest(updatedData);
      }
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (rejectionReason !== null) {
      const success = await rejectLeaveRequest(requestId, rejectionReason);
      if (success) {
        // Refresh the data
        const updatedData = await getLeaveRequestById(requestId);
        if (updatedData) {
          setLeaveRequest(updatedData);
        }
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-4xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leave Requests
            </Button>
            <h1 className="text-3xl font-bold mb-2">Leave Request Details</h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage student leave request
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading leave request...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {leaveRequest && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Request Information</CardTitle>
                    <CardDescription>
                      Details of the leave request
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-medium">{leaveRequest.student.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-medium">
                        {(() => {
                          const currentRecord = leaveRequest.student.student_academic_records.find(record => record.roll_number);
                          return currentRecord?.class_division 
                            ? `${currentRecord.class_division.level.name} - Section ${currentRecord.class_division.division}`
                            : 'N/A';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(leaveRequest.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(leaveRequest.end_date)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Reason</p>
                      <p className="font-medium">{leaveRequest.reason}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Additional Notes</p>
                      <p className="font-medium">{leaveRequest.additional_notes || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested Date</p>
                      <p className="font-medium">{formatDate(leaveRequest.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <StatusBadge status={leaveRequest.status} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Parent/Guardian Information</CardTitle>
                    <CardDescription>
                      Contact details for parents/guardians
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leaveRequest.parent ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Parent Name</p>
                          <p className="font-medium">{leaveRequest.parent.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{leaveRequest.parent.phone_number}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{leaveRequest.parent.email}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2 text-center py-4 text-gray-500">
                        No parent information available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {(user?.role === 'admin' || user?.role === 'principal' || user?.role === 'teacher') && leaveRequest.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                      <CardDescription>
                        Approve or reject this leave request
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className={`w-full flex items-center gap-2 ${buttonColors.approve}`}
                        onClick={() => handleApproveRequest(leaveRequest.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve Request
                      </Button>
                      <Button 
                        className={`w-full flex items-center gap-2 ${buttonColors.reject}`}
                        onClick={() => handleRejectRequest(leaveRequest.id)}
                      >
                        <X className="h-4 w-4" />
                        Reject Request
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Leave History</CardTitle>
                    <CardDescription>
                      Student&apos;s previous leave requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4 text-gray-500">
                      Leave history feature coming soon
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}