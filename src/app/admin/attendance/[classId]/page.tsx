// src/app/admin/attendance/[classId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { attendanceApi, AttendanceStatusResponse } from '@/lib/api/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  Search,
  FileText
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export default function AttendanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { t } = useI18n();

  const classId = params.classId as string;
  const dateParam = searchParams.get('date');

  const [attendanceData, setAttendanceData] = useState<AttendanceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAttendanceData = useCallback(async () => {
    if (!token || !dateParam) return;

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAttendanceStatus(classId, dateParam, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'success') {
        setAttendanceData(response.data);
      } else {
        setError(response.message || 'Failed to load attendance data');
      }
    } catch (err) {
      setError('Failed to load attendance data');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [token, classId, dateParam]);

  useEffect(() => {
    if (token && classId && dateParam) {
      loadAttendanceData();
    }
  }, [token, classId, dateParam, loadAttendanceData]);

  // Only allow admins and principals to access this page
  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('attendanceMgmt.accessDetails', 'Only admins and principals can access attendance details.')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full_day':
        return <Badge className="bg-green-100 text-green-800">{t('attendanceMgmt.status.present', 'Present')}</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">{t('attendanceMgmt.status.absent', 'Absent')}</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('attendanceMgmt.status.late', 'Late')}</Badge>;
      case 'half_day':
        return <Badge className="bg-orange-100 text-orange-800">{t('attendanceMgmt.status.halfDay', 'Half Day')}</Badge>;
      default:
        return <Badge variant="secondary">{t('attendanceMgmt.status.unknown', 'Unknown')}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full_day':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
      case 'half_day':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter students based on search term
  const filteredStudents = attendanceData?.student_records.filter(record =>
    record.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.student?.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate attendance statistics
  const totalStudents = attendanceData?.student_records.length || 0;
  const presentCount = attendanceData?.student_records.filter(r => r.status === 'full_day').length || 0;
  const absentCount = attendanceData?.student_records.filter(r => r.status === 'absent').length || 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Attendance Overview
        </Button>
      </div>

      {/* Page Header */}
      <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Attendance Details</h1>
              </div>
              <p className="text-muted-foreground">
                Detailed attendance information for {attendanceData?.daily_attendance.attendance_date ?
                  formatDate(attendanceData.daily_attendance.attendance_date) : dateParam}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadAttendanceData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance Statistics */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.details.totalStudents', 'Total Students')}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.status.present', 'Present')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.status.absent', 'Absent')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Attendance List */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold">{t('attendanceMgmt.details.recordsTitle', 'Student Attendance Records')}</CardTitle>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('attendanceMgmt.details.searchStudents', 'Search students...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">{t('attendanceMgmt.details.loading', 'Loading attendance data...')}</span>
            </div>
          ) : attendanceData && filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('attendanceMgmt.details.admissionNo', 'Admission No.')}</TableHead>
                    <TableHead>{t('attendanceMgmt.details.studentName', 'Student Name')}</TableHead>
                    <TableHead>{t('attendanceMgmt.cols.status', 'Status')}</TableHead>
                    <TableHead>{t('attendanceMgmt.details.remarks', 'Remarks')}</TableHead>
                    <TableHead>{t('attendanceMgmt.details.markedBy', 'Marked By')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.student?.admission_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          {record.student?.full_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.remarks || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.marked_by_name || record.marked_by_user?.full_name || record.marked_by || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>{t('attendanceMgmt.details.empty', 'No attendance records found for this date.')}</p>
            </div>
          )}

          {filteredStudents.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              {t('pagination.showing', 'Showing')} {filteredStudents.length} {t('pagination.of', 'of')} {attendanceData?.student_records.length || 0} {t('attendanceMgmt.details.studentsLower', 'students')}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
