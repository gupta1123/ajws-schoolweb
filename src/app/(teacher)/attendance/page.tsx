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

import { attendanceApi } from '@/lib/api/attendance';
import { useI18n } from '@/lib/i18n/context';




// Interface for class data
interface ClassData {
  id: string;
  name: string;
  division: string;
  studentCount: number;
}

export default function AttendancePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTeacherData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Get teacher information and assignments
      const teacherInfoResponse = await attendanceApi.getTeacherInfo(token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (teacherInfoResponse instanceof Blob) {
        console.error('Unexpected Blob response');
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
      console.error('Failed to load teacher data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load teacher's classes and summary data
  useEffect(() => {
    if (token && user?.role === 'teacher') {
      loadTeacherData();
    }
  }, [token, user, loadTeacherData]);

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.teachersOnlyPage', 'Only teachers can access this page.')}</p>
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
    loadTeacherData();
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unmarked attendance classes - since we don't have attendance history, show all classes
  const unmarkedClasses = classes; // All classes are considered unmarked since we don't have history

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('attendanceTeacher.take.title', 'Take Attendance')}</CardTitle>
                    <CardDescription>
                      {t('attendanceTeacher.take.desc', 'Select a class and date to take attendance')}
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
                              {cls.name} - {t('timetable.section', 'Section')} {cls.division}
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
                    <CardTitle>{t('attendanceTeacher.classes.title', 'Class Overview')}</CardTitle>
                    <CardDescription>
                      {t('attendanceTeacher.classes.desc', 'View your assigned classes and their details')}
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
                              <th className="text-left p-4 font-medium">{t('attendanceMgmt.details.totalStudents', 'Total Students')}</th>
                              <th className="text-right p-4 font-medium">{t('academicSetup.cols.actions', 'Actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClasses.map((cls) => (
                              <tr key={cls.id} className="border-b hover:bg-muted/50">
                                <td className="p-4">
                                  <div className="font-medium">{cls.name} - {t('timetable.section', 'Section')} {cls.division}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium">{cls.studentCount}</div>
                                </td>
                                <td className="p-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedClass(cls.id);
                                      setDate(new Date().toISOString().split('T')[0]);
                                      router.push(`/attendance/${cls.id}?date=${new Date().toISOString().split('T')[0]}`);
                                    }}
                                  >
                                    {t('attendanceTeacher.take.cta', 'Take Attendance')}
                                  </Button>
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

              <div className="space-y-6">
                {/* Unmarked Attendance Alert */}
                {unmarkedClasses.length > 0 && (
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        {t('attendanceMgmt.actionRequired', 'Action Required')}
                      </CardTitle>
                      <CardDescription>
                        {t('attendanceTeacher.unmarked.desc', 'Your assigned classes - ready for attendance marking')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {unmarkedClasses.slice(0, 3).map((cls) => (
                          <div key={cls.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{cls.name} - {t('timetable.section', 'Section')} {cls.division}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {cls.studentCount} {t('dashboard.teacher.classOverview.students', 'students')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedClass(cls.id);
                                  setDate(new Date().toISOString().split('T')[0]);
                                  router.push(`/attendance/${cls.id}?date=${new Date().toISOString().split('T')[0]}`);
                                }}
                              >
                                {t('attendanceTeacher.unmarked.markNow', 'Mark Now')}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {unmarkedClasses.length > 3 && (
                          <p className="text-sm text-gray-500 text-center">
                            +{unmarkedClasses.length - 3} {t('attendanceTeacher.unmarked.moreClasses', 'more classes need attention')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}


              </div>
            </div>
          </div>
        </ProtectedRoute>
      );
    }
