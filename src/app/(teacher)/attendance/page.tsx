// src/app/(teacher)/attendance/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  Filter,
  Users,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { attendanceApi, ClassAttendanceSummary } from '@/lib/api/attendance';
import { useI18n } from '@/lib/i18n/context';




// Interface for class data
interface ClassData {
  id: string;
  name: string;
  division: string;
  studentCount: number;
  attendanceMarked?: boolean;
  isHoliday?: boolean;
  presentCount?: number;
  absentCount?: number;
  attendancePercentage?: number;
}

export default function AttendancePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAttendanceStaff = user?.role === 'attendance_staff';
  const canAccessAttendance = user?.role === 'teacher' || isAttendanceStaff;

  const formatClassName = (classData: ClassData) => {
    return classData.division
      ? `${classData.name} - ${t('timetable.section', 'Section')} ${classData.division}`
      : classData.name;
  };

  const mapAttendanceSummaryToClassData = useCallback((classData: ClassAttendanceSummary): ClassData => ({
    id: classData.class_division_id,
    name: classData.class_name,
    division: '',
    studentCount: classData.total_students,
    attendanceMarked: classData.attendance_marked,
    isHoliday: classData.is_holiday,
    presentCount: classData.present_count,
    absentCount: classData.absent_count,
    attendancePercentage: classData.attendance_percentage,
  }), []);

  const loadAttendanceData = useCallback(async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      setError(null);

      if (user.role === 'attendance_staff') {
        const response = await attendanceApi.getAllClassesSummary(date, token);

        if (response instanceof Blob) {
          setError('Unexpected response format from API');
          setClasses([]);
          return;
        }

        if (response.status === 'error') {
          setError(response.message || 'Failed to load attendance classes');
          setClasses([]);
          return;
        }

        if (response.status === 'success') {
          setClasses(response.data.class_attendance.map(mapAttendanceSummaryToClassData));
        }

        return;
      }

      // Get teacher information and assignments
      const teacherInfoResponse = await attendanceApi.getTeacherInfo(token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (teacherInfoResponse instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format from API');
        return;
      }

      if (teacherInfoResponse.status === 'error') {
        setError(teacherInfoResponse.message || 'Failed to load teacher classes');
        setClasses([]);
        return;
      }

      if (teacherInfoResponse && teacherInfoResponse.status === 'success') {
        const teacherData = teacherInfoResponse.data;

        // Only use primary classes (where teacher is class teacher, not subject teacher)
        const classList: ClassData[] = teacherData.primary_classes.map(cls => ({
          id: cls.class_division_id,
          name: cls.class_level, // e.g., "Grade 1"
          division: cls.division, // e.g., "B"
          studentCount: cls.student_count
        }));

        setClasses(classList);
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [date, mapAttendanceSummaryToClassData, token, user]);

  // Load attendance classes for the current role
  useEffect(() => {
    if (token && canAccessAttendance) {
      loadAttendanceData();
    }
  }, [token, canAccessAttendance, loadAttendanceData]);

  if (authLoading || !user) {
    return (
      <ProtectedRoute>
        <div />
      </ProtectedRoute>
    );
  }

  // Only allow teachers and attendance staff to access this page
  if (!canAccessAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('attendanceMgmt.accessDetails', 'Only authorized attendance users can access this page.')}</p>
        </div>
      </div>
    );
  }

  const handleTakeAttendance = () => {
    if (selectedClass && date) {
      router.push(`/attendance/${selectedClass}?date=${date}`);
    }
  };

  const handleRefresh = () => {
    loadAttendanceData();
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls =>
    formatClassName(cls).toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('attendanceTeacher.title', 'Attendance Management')}</h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('actions.refresh', 'Refresh')}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('attendanceTeacher.take.title', 'Take Attendance')}</CardTitle>
                    <CardDescription>
                      {isAttendanceStaff
                        ? t('attendanceStaff.take.desc', 'Select any class and date to take attendance')
                        : t('attendanceTeacher.take.desc', 'Select a class and date to take attendance')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="date" className="text-sm font-medium">
                          {t('attendanceTeacher.labels.date', 'Date')}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-10"
                            max={new Date().toISOString().split('T')[0]} // Can't mark future dates
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="class" className="text-sm font-medium">
                          {t('attendanceTeacher.labels.class', 'Class')}
                        </label>
                        <select
                          id="class"
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          <option value="">{t('attendanceTeacher.labels.selectClass', 'Select a class')}</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {formatClassName(cls)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button
                      onClick={handleTakeAttendance}
                      disabled={!selectedClass || !date || loading}
                      className="w-full"
                    >
                      {loading ? t('attendanceTeacher.loading', 'Loading...') : t('attendanceTeacher.take.cta', 'Take Attendance')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isAttendanceStaff
                        ? t('attendanceStaff.classes.title', 'All Classes')
                        : t('attendanceTeacher.classes.title', 'Class Overview')}
                    </CardTitle>
                    <CardDescription>
                      {isAttendanceStaff
                        ? t('attendanceStaff.classes.desc', 'View all classes and mark attendance')
                        : t('attendanceTeacher.classes.desc', 'View your assigned classes and their details')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('attendanceTeacher.classes.searchPlaceholder', 'Search classes...')}
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        {t('attendanceTeacher.classes.filter', 'Filter')}
                      </Button>
                    </div>

                    {loading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>{t('classes.loading', 'Loading classes...')}</p>
                      </div>
                    ) : filteredClasses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>{t('classes.emptyTitle', 'No classes found')}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4 font-medium">{t('attendanceMgmt.cols.class', 'Class')}</th>
                              {isAttendanceStaff && <th className="text-left p-4 font-medium">{t('attendanceMgmt.cols.status', 'Status')}</th>}
                              <th className="text-left p-4 font-medium">{t('attendanceMgmt.details.totalStudents', 'Total Students')}</th>
                              {isAttendanceStaff && <th className="text-left p-4 font-medium">{t('attendanceMgmt.cols.present', 'Present')}</th>}
                              {isAttendanceStaff && <th className="text-left p-4 font-medium">{t('attendanceMgmt.cols.absent', 'Absent')}</th>}
                              <th className="text-right p-4 font-medium">{t('academicSetup.cols.actions', 'Actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClasses.map((cls) => (
                              <tr key={cls.id} className="border-b hover:bg-muted/50">
                                <td className="p-4">
                                  <div className="font-medium">{formatClassName(cls)}</div>
                                </td>
                                {isAttendanceStaff && (
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      cls.isHoliday
                                        ? 'bg-purple-100 text-purple-800'
                                        : cls.attendanceMarked
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {cls.isHoliday
                                        ? t('attendanceMgmt.status.holiday', 'Holiday')
                                        : cls.attendanceMarked
                                          ? t('attendanceMgmt.status.marked', 'Marked')
                                          : t('attendanceMgmt.status.pending', 'Pending')}
                                    </span>
                                  </td>
                                )}
                                <td className="p-4">
                                  <div className="font-medium">{cls.studentCount}</div>
                                </td>
                                {isAttendanceStaff && <td className="p-4">{cls.presentCount ?? 0}</td>}
                                {isAttendanceStaff && <td className="p-4">{cls.absentCount ?? 0}</td>}
                                <td className="p-4">
                                  <div className="flex justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedClass(cls.id);
                                      router.push(`/attendance/${cls.id}?date=${date}`);
                                    }}
                                  >
                                    {t('attendanceTeacher.take.cta', 'Take Attendance')}
                                  </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

            </div>
          </div>
        </ProtectedRoute>
      );
    }
