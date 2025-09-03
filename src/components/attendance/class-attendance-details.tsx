// src/components/attendance/class-attendance-details.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { AttendanceStatusResponse } from '@/lib/api/attendance';

interface ClassAttendanceDetailsProps {
  attendanceData: AttendanceStatusResponse | null;
  className: string;
  loading?: boolean;
}

export function ClassAttendanceDetails({
  attendanceData,
  className,
  loading = false
}: ClassAttendanceDetailsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Class Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attendanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Class Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a class to view detailed attendance information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { daily_attendance, student_records, is_holiday, holiday_reason } = attendanceData;
  
  const presentCount = student_records.filter(record => record.status === 'full_day').length;
  const absentCount = student_records.filter(record => record.status === 'absent').length;
  const totalStudents = student_records.length;
  const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'half_day':
        return <Badge className="bg-blue-100 text-blue-800">Half Day</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  if (is_holiday) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            {className} - Holiday
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Holiday</h3>
            <p className="text-gray-600">{holiday_reason || 'No reason specified'}</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatDate(daily_attendance.attendance_date)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{className} - Attendance Details</CardTitle>
        <p className="text-sm text-gray-500">
          {formatDate(daily_attendance.attendance_date)}
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Present</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">{presentCount}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-gray-600">Absent</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1">{absentCount}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Attendance %</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {attendancePercentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Records Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Student Records</h3>
          
          {student_records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No student records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student_records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          {record.student?.full_name || 'Unknown Student'}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {record.student?.admission_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {record.remarks || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {record.marked_by || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Marked by:</span> {daily_attendance.marked_by || 'Not marked'}
            </div>
            <div>
              <span className="font-medium">Last updated:</span> {formatDate(daily_attendance.updated_at)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
