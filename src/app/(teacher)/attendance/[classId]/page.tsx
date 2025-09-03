// src/app/(teacher)/attendance/[classId]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  ArrowLeft,
  AlertTriangle,
  Filter,
  Loader2,
  Save
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAttendance } from '@/hooks/use-attendance';
import { toast } from '@/hooks/use-toast';

// Custom date formatter for "11 Aug '25" format
const formatDateCustom = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} '${year}`;
};

export default function ClassAttendancePage({ params, searchParams }: { params: Promise<{ classId: string }>, searchParams: Promise<{ date?: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [mode, setMode] = useState<'normal' | 'absentFirst'>('normal');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Use the attendance hook
  const {
    students,
    attendance,
    loading,
    error,
    className,
    setAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
    loadClassAttendance
  } = useAttendance();

  // Extract class ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      console.log('Extracted class ID:', resolvedParams.classId);
      setClassId(resolvedParams.classId);
    };
    extractId();
  }, [params]);

  // Extract date from search params and load attendance
  useEffect(() => {
    const extractSearchParams = async () => {
      const resolvedSearchParams = await searchParams;
      const dateFromParams = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
      console.log('Extracted date:', dateFromParams);
      setDate(dateFromParams);
    };
    extractSearchParams();
  }, [searchParams]);

  // Load attendance data when classId and date are available
  useEffect(() => {
    console.log('useEffect triggered - classId:', classId, 'date:', date, 'user role:', user?.role);
    if (classId && date && user?.role === 'teacher') {
      console.log('Calling loadClassAttendance with:', { classId, date });
      loadClassAttendance(classId, date);
    }
  }, [classId, date, user, loadClassAttendance]);

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'half_day') => {
    setAttendance(studentId, status);
  };

  // Mark all unmarked students as absent (for absentFirst mode)
  const handleMarkAllAbsent = () => {
    markAllAbsent();
  };

  const handleSubmit = async () => {
    if (!classId || !date) {
              toast({
          title: "Error",
          description: "Missing class ID or date",
          variant: "error"
        });
      return;
    }

    const success = await submitAttendance(classId, date);
    
    if (success) {
      toast({
        title: "Success",
        description: "Attendance recorded successfully!",
      });
      router.push('/attendance');
    } else {
      toast({
        title: "Error",
        description: error || "Failed to record attendance",
        variant: "error"
      });
    }
  };

  // Filter students based on search term and filter
  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.includes(searchTerm);
    
    // Status filter
    let matchesStatus = true;
    if (filter === 'present') {
      matchesStatus = attendance[student.id] === 'present';
    } else if (filter === 'absent') {
      matchesStatus = attendance[student.id] === 'absent';
    }
    
    return matchesSearch && matchesStatus;
  });

  // Show loading state
  if (loading && students.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading class attendance...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error && students.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Attendance</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => loadClassAttendance(classId, date)}>
              Try Again
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attendance
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{className || 'Loading Class...'}</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Taking attendance for {formatDateCustom(date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{formatDateCustom(date)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>
                    Mark attendance for each student
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={mode === 'absentFirst' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => {
                      setMode(mode === 'normal' ? 'absentFirst' : 'normal');
                      if (mode === 'normal') {
                        handleMarkAllAbsent();
                      }
                    }}
                  >
                    {mode === 'absentFirst' ? 'Normal Mode' : 'Absent First'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={markAllPresent}
                  >
                    Mark All Present
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'present' | 'absent')}
                  >
                    <option value="all">All Students</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-8 w-8 mx-auto mb-2" />
                  <p>No students found matching your criteria</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-center p-4 font-medium">Present</th>
                        <th className="text-center p-4 font-medium">Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium">{student.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Roll #{student.rollNumber || student.admission_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-full p-2 ${attendance[student.id] === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-full p-2 ${attendance[student.id] === 'absent' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}`}
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}