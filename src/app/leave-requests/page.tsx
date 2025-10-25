// src/app/leave-requests/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Check, X, Calendar, User, Filter, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useI18n } from '@/lib/i18n/context';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/context';
import { useLeaveRequests } from '@/hooks/use-leave-requests';
import { useSearchParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';


// Simple status badge component with theme support
const StatusBadge = ({ status }: { status: string }) => {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  
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
    pending: { text: t('leave.status.pending', 'Pending'), className: themeColors.pending },
    approved: { text: t('leave.status.approved', 'Approved'), className: themeColors.approved },
    rejected: { text: t('leave.status.rejected', 'Rejected'), className: themeColors.rejected }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { text: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.text}
    </span>
  );
};

// Component that uses useSearchParams - must be wrapped in Suspense
function LeaveRequestsContent() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [classFilter, setClassFilter] = useState('all');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  });
  
  // Keep date range consistent and ensure both from/to are present
  const handleStartDateChange = (value: string) => {
    setDateRange((prev) => {
      const start = value;
      const end = prev.end && new Date(start) > new Date(prev.end) ? start : (prev.end || value);
      return { start, end };
    });
  };
  const handleEndDateChange = (value: string) => {
    setDateRange((prev) => {
      const end = value;
      const start = prev.start && new Date(prev.start) > new Date(end) ? end : (prev.start || value);
      return { start, end };
    });
  };
  const [showFilters, setShowFilters] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  
  // Get student ID from URL params if filtering by student
  const studentId = searchParams.get('studentId');
  
  // Use the leave requests hook
  const {
    leaveRequests,
    loading,
    error,
    fetchLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    clearError
  } = useLeaveRequests({ autoFetch: false });

  // Get theme-aware colors for summary cards
  const getSummaryCardColors = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          total: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
      case 'green':
        return {
          total: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
          rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
        };
      case 'purple':
        return {
          total: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
          rejected: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
        };
      case 'orange':
        return {
          total: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
      default:
        return {
          total: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
        };
    }
  };

  const cardColors = getSummaryCardColors();

  // Default current month for admin/principal; do not override selected status
  useEffect(() => {
    if (!user?.role) return;
    if (user.role === 'admin' || user.role === 'principal') {
      // Set default date range to current month if not already set
      if (!dateRange.start || !dateRange.end) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toISO = (d: Date) => d.toISOString().slice(0, 10);
        setDateRange({ start: toISO(firstDay), end: toISO(lastDay) });
      }
      // Make filters visible to expose date range selector
      setShowFilters(true);
    }
  }, [user?.role, dateRange.start, dateRange.end, statusFilter]);

  // Fetch data when filters change
  useEffect(() => {
    const params: {
      status?: 'pending' | 'approved' | 'rejected';
      student_id?: string;
      start_date?: string;
      end_date?: string;
    } = {};
    
    if (statusFilter !== 'all') params.status = statusFilter as 'pending' | 'approved' | 'rejected';
    if (studentId) params.student_id = studentId;
    // Only include date params if both are present
    if (dateRange.start && dateRange.end) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }
    
    // Avoid redundant unfiltered call: For admin/principal, require both dates
    if ((user?.role === 'admin' || user?.role === 'principal')) {
      if (!(dateRange.start && dateRange.end)) return;
    }

    fetchLeaveRequests(params);
  }, [statusFilter, studentId, dateRange.start, dateRange.end, fetchLeaveRequests, user?.role]);

  // Debug: Log the data structure when it changes
  useEffect(() => {
    if (leaveRequests.length > 0) {
      console.log('Leave requests data structure:', leaveRequests[0]);
    }
  }, [leaveRequests]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('leave.loadingAuth')}</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    console.log('Auth state:', { isAuthenticated, token: token ? 'present' : 'missing', user });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('auth.required', 'Authentication Required')}</h2>
          <p className="text-gray-600 mb-4">{t('leave.loginToAccess')}</p>
          <div className="mb-4 p-4 bg-gray-100 rounded text-left text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Token: {token ? 'Present' : 'Missing'}</p>
            <p>User: {user ? `${user.full_name} (${user.role})` : 'None'}</p>
          </div>
          <Link href="/login">
            <Button>{t('leave.goToLogin')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Allow admins, principals, and teachers to access this page
  // Teachers can view and approve/reject leave requests for their assigned classes
  if (user?.role !== 'admin' && user?.role !== 'principal' && user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('leave.noPermission')}</p>
        </div>
      </div>
    );
  }

  // Filter leave requests based on search term and filters
  const filteredLeaveRequests = leaveRequests
    .filter(request => request.student) // Only show requests with valid student data
    .filter(request => 
      (searchTerm === '' || 
       (request.student?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       `Class ${request.student?.student_academic_records?.[0]?.class_division?.level?.sequence_number || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       `Division ${request.student?.student_academic_records?.[0]?.class_division?.division || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       request.reason.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (classFilter === 'all' || 
       classFilter === `Class ${request.student?.student_academic_records?.[0]?.class_division?.level?.sequence_number} Division ${request.student?.student_academic_records?.[0]?.class_division?.division}`)
    );

  // Get unique class names for filters
  const availableClasses = Array.from(new Set(
    leaveRequests
      .filter(request => request.student?.student_academic_records?.[0]?.class_division?.level?.sequence_number && request.student?.student_academic_records?.[0]?.class_division?.division)
      .map(request => `Class ${request.student?.student_academic_records?.[0]?.class_division?.level?.sequence_number} Division ${request.student?.student_academic_records?.[0]?.class_division?.division}`)
  )).sort();

  // Calculate summary metrics
  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const urgentCount = leaveRequests.filter(r => {
    const startDate = new Date(r.start_date);
    const endDate = new Date(r.end_date);
    const today = new Date();
    return startDate <= today && endDate >= today && r.status === 'pending';
  }).length;

  const handleApproveRequest = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      console.log('Approving leave request:', requestId);
      const success = await approveLeaveRequest(requestId);
      if (success) {
        setActionMessage({ type: 'success', message: t('leave.actions.approveSuccess') });
        // Clear message after 3 seconds
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionMessage({ type: 'error', message: t('leave.actions.approveError') });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setActionMessage({ type: 'error', message: t('leave.actions.approveGenericError') });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setRequestToReject(requestId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const confirmRejectRequest = async () => {
    if (!requestToReject || !rejectReason.trim()) {
      return;
    }

    try {
      setProcessingRequests(prev => new Set(prev).add(requestToReject));
      console.log('Rejecting leave request:', requestToReject, 'Reason:', rejectReason);
      const success = await rejectLeaveRequest(requestToReject, rejectReason.trim());
      if (success) {
        setActionMessage({ type: 'success', message: t('leave.actions.rejectSuccess') });
        setTimeout(() => setActionMessage(null), 3000);
        setRejectModalOpen(false);
        setRejectReason('');
        setRequestToReject(null);
      } else {
        setActionMessage({ type: 'error', message: t('leave.actions.rejectError') });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setActionMessage({ type: 'error', message: t('leave.actions.rejectGenericError') });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestToReject);
        return newSet;
      });
    }
  };

  const cancelRejectRequest = () => {
    setRejectModalOpen(false);
    setRejectReason('');
    setRequestToReject(null);
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        {/* Action Message Display */}
        {actionMessage && (
          <div className={`mb-4 p-4 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{actionMessage.message}</span>
              <button 
                onClick={() => setActionMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Action Bar with Status Indicators */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                <AlertTriangle className="h-4 w-4" />
                {urgentCount} {t('leave.urgent')}
              </div>
            )}
            {pendingCount > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {pendingCount} {t('leave.kpi.pending')}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('leave.loggedInAs')} <span className="font-medium">{user?.role}</span>
          </div>
        </div>

        {/* Summary Cards - Simple KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className={`rounded-full ${cardColors.total.replace('text-', 'text-').replace('dark:text-', 'dark:text-')} p-3 mr-4`}>
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('leave.kpi.total')}</p>
                <p className="text-2xl font-bold">{leaveRequests.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className={`rounded-full ${cardColors.pending.replace('text-', 'text-').replace('dark:text-', 'dark:text-')} p-3 mr-4`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('leave.kpi.pending')}</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className={`rounded-full ${cardColors.approved.replace('text-', 'text-').replace('dark:text-', 'dark:text-')} p-3 mr-4`}>
                <Check className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('leave.kpi.approved')}</p>
                <p className="text-2xl font-bold">{leaveRequests.filter(r => r.status === 'approved').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className={`rounded-full ${cardColors.rejected.replace('text-', 'text-').replace('dark:text-', 'dark:text-')} p-3 mr-4`}>
                <X className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('leave.kpi.rejected')}</p>
                <p className="text-2xl font-bold">{leaveRequests.filter(r => r.status === 'rejected').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 dark:text-red-200">
                    {error}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('leave.title')}</CardTitle>
              <CardDescription>
                {user?.role === 'admin' || user?.role === 'principal'
                  ? t('leave.subtitle.admin')
                  : user?.role === 'teacher'
                  ? t('leave.subtitle.teacher')
                  : t('leave.subtitle.default')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('leave.searchPlaceholder')} 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {t('leave.filters.title')}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters - Collapsible */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('leave.filters.status')}</label>
                    <select 
                      className="border rounded-md px-3 py-2 text-sm w-full"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                    >
                      <option value="all">{t('leave.filters.allStatuses')}</option>
                      <option value="pending">{t('leave.status.pending')}</option>
                      <option value="approved">{t('leave.status.approved')}</option>
                      <option value="rejected">{t('leave.status.rejected')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('leave.filters.class')}</label>
                    <select 
                      className="border rounded-md px-3 py-2 text-sm w-full"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                    >
                      <option value="all">{t('leave.filters.allClasses')}</option>
                      {availableClasses.map(className => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('leave.filters.startDate')}</label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('leave.filters.endDate')}</label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Leave Requests Table */}
              <div className="rounded-md border">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('leave.loading')}</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('leave.columns.student')}</TableHead>
                        <TableHead>{t('leave.columns.classInfo')}</TableHead>
                        <TableHead>{t('leave.columns.dates')}</TableHead>
                        <TableHead>{t('leave.columns.reason')}</TableHead>
                        <TableHead>{t('leave.columns.requestedDate')}</TableHead>
                        <TableHead>{t('leave.columns.status')}</TableHead>
                        <TableHead className="text-right">{t('leave.columns.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaveRequests.length > 0 ? (
                        filteredLeaveRequests.map((request) => {
                          // Ensure we have valid student data before rendering
                          if (!request.student) {
                            console.warn('Leave request missing student data:', request);
                            return null;
                          }
                          
                          return (
                            <TableRow 
                              key={request.id}
                              className={(() => {
                                const startDate = new Date(request.start_date);
                                const endDate = new Date(request.end_date);
                                const today = new Date();
                                const isUrgent = startDate <= today && endDate >= today;
                                return isUrgent ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500' : '';
                              })()}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const startDate = new Date(request.start_date);
                                    const endDate = new Date(request.end_date);
                                    const today = new Date();
                                    const isUrgent = startDate <= today && endDate >= today;
                                    return isUrgent ? (
                                      <div className="relative group">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                          {t('leave.currentlyOnLeave')}
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                  <span>{request.student?.full_name || t('leave.unknownStudent')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {t('leave.class')} {request.student?.student_academic_records?.[0]?.class_division?.level?.sequence_number || t('students.na', 'N/A')}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 ml-5">
                                    {t('leave.division')} {request.student?.student_academic_records?.[0]?.class_division?.division || t('students.na', 'N/A')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(request.start_date)} {t('pagination.to', 'to')} {formatDate(request.end_date)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-500 dark:text-gray-400">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="max-w-xs truncate cursor-help">
                                        {request.reason}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      className="max-w-sm p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg border-0"
                                    >
                                      <div className="whitespace-pre-wrap break-words">
                                        {request.reason}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>{formatDate(request.created_at)}</TableCell>
                              <TableCell>
                                <StatusBadge status={request.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                {request.status === 'pending' && (user?.role === 'admin' || user?.role === 'principal' || user?.role === 'teacher') && (
                                  <>
                                                                          <Button
                                        variant="outline"
                                        size="sm"
                                        className="mr-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        onClick={() => handleApproveRequest(request.id)}
                                        disabled={processingRequests.has(request.id)}
                                      >
                                        {processingRequests.has(request.id) ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
                                        ) : (
                                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        )}
                                      </Button>
                                                                          <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => handleRejectRequest(request.id)}
                                        disabled={processingRequests.has(request.id)}
                                      >
                                        {processingRequests.has(request.id) ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-red-600 dark:text-red-400" />
                                        ) : (
                                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        )}
                                      </Button>
                                  </>
                                )}

                              </TableCell>
                            </TableRow>
                          );
                        })
                        .filter(Boolean) // Remove any null entries
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {t('leave.empty.title')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                              {searchTerm || statusFilter !== 'all' || classFilter !== 'all' || dateRange.start || dateRange.end
                                ? t('leave.empty.adjust') 
                                : t('leave.empty.none')}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rejection Reason Modal */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                {t('leave.actions.rejectTitle', 'Reject Leave Request')}
              </DialogTitle>
              <DialogDescription>
                {t('leave.actions.rejectDescription', 'Please provide a reason for rejecting this leave request.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reject-reason" className="text-sm font-medium">
                  {t('leave.actions.rejectionReason', 'Rejection Reason')} *
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder={t('leave.actions.rejectionPlaceholder', 'Enter the reason for rejection...')}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {rejectReason.length}/500
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={cancelRejectRequest}
                disabled={processingRequests.has(requestToReject || '')}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRejectRequest}
                disabled={!rejectReason.trim() || processingRequests.has(requestToReject || '')}
                className="min-w-[100px]"
              >
                {processingRequests.has(requestToReject || '') ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('common.rejecting', 'Rejecting...')}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('common.reject', 'Reject')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// Main page component that wraps the content in Suspense
export default function LeaveRequestsPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('leave.loading')}</p>
        </div>
      </div>
    }>
      <LeaveRequestsContent />
    </Suspense>
  );
}
