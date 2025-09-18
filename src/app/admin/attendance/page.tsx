// src/app/(admin)/attendance/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { usePrincipalAttendance } from '@/hooks/use-principal-attendance';
import { classDivisionsServices, ClassDivision } from '@/lib/api/class-divisions';
import { AttendanceOverviewCards } from '@/components/attendance/attendance-overview-cards';
import { ClassAttendanceTable } from '@/components/attendance/class-attendance-table';
import { Card, CardContent, CardHeader, CardTitle, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  RefreshCw,
  Download,
  AlertTriangle,
  Users,
  CheckSquare
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export default function AdminAttendancePage() {
  const { user, token } = useAuth();
  const { t } = useI18n();

  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  
  const {
    allClassesSummary,
    loading,
    error,
    selectedDate,
    selectedClassId,
    setSelectedDate,
    setSelectedClassId,
    totalClasses,
    classesWithAttendance,
    classesWithoutAttendance,
    overallAttendancePercentage,
    classAttendanceList,
  } = usePrincipalAttendance();

  const loadClassDivisions = useCallback(async () => {
    if (!token) return;

    try {
      const response = await classDivisionsServices.getClassDivisions(token);

      if (response.status === 'success') {
        setClassDivisions(response.data.class_divisions);
      }
    } catch (err) {
      console.error('Failed to load class divisions:', err);
    }
  }, [token]);

  // Load class divisions
  useEffect(() => {
    if (token && user?.role && (user.role === 'admin' || user.role === 'principal')) {
      loadClassDivisions();
    }
  }, [token, user, loadClassDivisions]);



  // Get unique classes and divisions for filters
  const uniqueClasses = Array.from(new Set(classDivisions.map(cd => cd.class_level.name))).sort();
  const uniqueDivisions = Array.from(new Set(classDivisions.map(cd => cd.division))).sort();



  // Filter attendance list based on selected class divisions
  const filteredAttendanceList = selectedClass || selectedDivision
    ? classAttendanceList.filter(attendance => {
        const classDivision = classDivisions.find(cd => cd.id === attendance.class_division_id);
        if (!classDivision) return false;

        const classMatch = !selectedClass || classDivision.class_level.name === selectedClass;
        const divisionMatch = !selectedDivision || classDivision.division === selectedDivision;
        return classMatch && divisionMatch;
      })
    : classAttendanceList;

  // Update selected class name when class is selected
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedDate) {
      // The hook will automatically reload when selectedDate changes
      setSelectedDate(selectedDate);
    }
  };

  // Export data (placeholder for future implementation)
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  // Only allow admins and principals to access this page
  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.adminsOnlySection', 'Only admins and principals can access this section.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">{t('attendanceMgmt.title', 'Attendance Management')}</h1>
              </div>
              <p className="text-muted-foreground">
                {t('attendanceMgmt.subtitle', 'Monitor and review attendance across all classes')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('actions.refresh', 'Refresh')}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('attendanceMgmt.export', 'Export')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('attendanceMgmt.selectDate', 'Select Date')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Selection */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="date" className="text-sm font-medium">
                  {t('attendanceMgmt.attendanceDate', 'Attendance Date:')}
                </label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>

              {allClassesSummary && (
                <div className="text-sm text-muted-foreground">
                  {t('attendanceMgmt.academicYear', 'Academic Year:')} {allClassesSummary.academic_year}
                </div>
              )}
            </div>

            {/* Class and Division Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="class-filter" className="text-sm font-medium">
                  {t('attendanceMgmt.filters.class', 'Filter by Class:')}
                </label>
                <select
                  id="class-filter"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('attendanceMgmt.allClasses', 'All Classes')}</option>
                  {uniqueClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="division-filter" className="text-sm font-medium">
                  {t('attendanceMgmt.filters.division', 'Filter by Division:')}
                </label>
                <select
                  id="division-filter"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('attendanceMgmt.allDivisions', 'All Divisions')}</option>
                  {uniqueDivisions.map((division) => (
                    <option key={division} value={division}>
                      {t('timetable.section', 'Section')} {division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedClass('');
                    setSelectedDivision('');
                  }}
                  className="flex-1"
                >
                  {t('attendanceMgmt.filters.clear', 'Clear Filters')}
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            {(selectedClass || selectedDivision) && (
              <div className="text-sm text-muted-foreground">
                {t('pagination.showing', 'Showing')} {filteredAttendanceList.length} {t('pagination.of', 'of')} {classAttendanceList.length} {t('attendanceMgmt.classesLower', 'classes')}
                {selectedClass && ` ${t('attendanceMgmt.for', 'for')} ${selectedClass}`}
                {selectedDivision && ` - ${t('timetable.section', 'Section')} ${selectedDivision}`}
              </div>
            )}
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

      {/* Overview Cards */}
      <AttendanceOverviewCards
        totalClasses={totalClasses}
        classesWithAttendance={classesWithAttendance}
        classesWithoutAttendance={classesWithoutAttendance}
        overallAttendancePercentage={overallAttendancePercentage}
        date={selectedDate}
      />

      {/* Main Content */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <ClassAttendanceTable
            classAttendanceList={filteredAttendanceList}
            onClassSelect={handleClassSelect}
            selectedClassId={selectedClassId}
            loading={loading}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {classesWithoutAttendance > 0 && (
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
          <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {t('attendanceMgmt.actionRequired', 'Action Required')}
              </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-foreground">
                  <strong>{classesWithoutAttendance}</strong> {t('attendanceMgmt.unmarkedNotice', 'classes still need attendance to be marked.')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('attendanceMgmt.unmarkedHelp', 'Teachers should mark attendance for these classes to maintain accurate records.')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  // Filter to show only unmarked classes from the filtered list
                  const unmarkedClasses = filteredAttendanceList.filter(
                    classData => !classData.attendance_marked && !classData.is_holiday
                  );
                  if (unmarkedClasses.length > 0) {
                    handleClassSelect(unmarkedClasses[0].class_division_id);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t('attendanceMgmt.viewPending', 'View Pending Classes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
