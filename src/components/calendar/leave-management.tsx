// src/components/calendar/leave-management.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon 
} from 'lucide-react';

import { useLeaveRequests } from '@/hooks/use-leave-requests';
import type { LeaveRequest } from '@/types/leave-requests';
import { formatDate } from '@/lib/utils';

interface LeaveManagementProps {
  userRole: 'admin' | 'principal' | 'teacher';
}

export function LeaveManagement({ userRole }: LeaveManagementProps) {
  const { leaveRequests, loading, approveLeaveRequest, rejectLeaveRequest } = useLeaveRequests();
  

  
  // Filter requests based on user role
  const visibleRequests = leaveRequests
    .filter(req => req.student) // Only show requests with valid student data
    .filter(req => userRole === 'teacher' 
      ? req.student?.full_name === 'Rajesh Kumar' // Mock current teacher - should be replaced with actual teacher ID
      : true
    );

  const handleApprove = async (id: string) => {
    await approveLeaveRequest(id);
  };

  const handleReject = async (id: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (rejectionReason !== null) {
      await rejectLeaveRequest(id, rejectionReason);
    }
  };

  const getStatusIcon = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getStatusClass = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'rejected':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'pending':
      default:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Management</CardTitle>
        <CardDescription>
          {userRole === 'teacher' 
            ? 'Your leave requests' 
            : 'Staff leave requests'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading leave requests...
          </div>
        ) : visibleRequests.length > 0 ? (
          <div className="space-y-4">
            {visibleRequests.map(request => (
              <div 
                key={request.id} 
                className="p-4 rounded-lg border bg-white dark:bg-gray-900/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{request.student?.full_name || 'Unknown Student'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {request.reason}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Submitted: {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      <span>{getStatusText(request.status)}</span>
                    </div>
                  </div>
                </div>
                
                {userRole !== 'teacher' && request.status === 'pending' && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No leave requests found
          </p>
        )}
      </CardContent>
    </Card>
  );
}