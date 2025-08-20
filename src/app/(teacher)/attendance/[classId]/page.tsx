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
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock data for students in a class
const mockStudents = [
  { id: '1', name: 'Aarav Patel', rollNumber: '501', onLeave: false },
  { id: '2', name: 'Aditi Sharma', rollNumber: '502', onLeave: true }, // On approved leave
  { id: '3', name: 'Arjun Reddy', rollNumber: '503', onLeave: false },
  { id: '4', name: 'Diya Nair', rollNumber: '504', onLeave: false },
  { id: '5', name: 'Ishaan Kumar', rollNumber: '505', onLeave: false },
  { id: '6', name: 'Kiara Mehta', rollNumber: '506', onLeave: false },
  { id: '7', name: 'Rohan Singh', rollNumber: '507', onLeave: false },
  { id: '8', name: 'Saanvi Gupta', rollNumber: '508', onLeave: false }
];

export default function ClassAttendancePage({ params, searchParams }: { params: Promise<{ classId: string }>, searchParams: Promise<{ date?: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [mode, setMode] = useState<'normal' | 'absentFirst'>('normal'); // New mode for easier absent marking
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');

  // Extract class ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.classId);
    };
    extractId();
  }, [params]);

  // Extract date from search params
  useEffect(() => {
    const extractSearchParams = async () => {
      const resolvedSearchParams = await searchParams;
      const dateFromParams = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
      setDate(dateFromParams);
    };
    extractSearchParams();
  }, [searchParams]);
  
  // Initialize attendance state
  useEffect(() => {
    const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    mockStudents.forEach(student => {
      // Students on leave are automatically marked as present
      initialAttendance[student.id] = student.onLeave ? 'present' : 'present'; // Default to present
    });
    setAttendance(initialAttendance);
  }, []);

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

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Mark all unmarked students as absent (for absentFirst mode)
  const markAllAbsent = () => {
    const updatedAttendance = { ...attendance };
    mockStudents.forEach(student => {
      if (!student.onLeave && (!updatedAttendance[student.id] || updatedAttendance[student.id] === 'present')) {
        updatedAttendance[student.id] = 'absent';
      }
    });
    setAttendance(updatedAttendance);
  };

  const handleSubmit = () => {
    // Here you would typically send the attendance data to your API
    console.log('Attendance data:', { classId, date, attendance });
    alert('Attendance recorded successfully!');
    router.push('/attendance');
  };

  // Filter students based on search term and filter
  const filteredStudents = mockStudents.filter(student => {
    // Search filter
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.includes(searchTerm);
    
    // Status filter
    let matchesStatus = true;
    if (filter === 'present') {
      matchesStatus = attendance[student.id] === 'present' && !student.onLeave;
    } else if (filter === 'absent') {
      matchesStatus = attendance[student.id] === 'absent';
    } else if (filter === 'leave') {
      matchesStatus = student.onLeave;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const presentCount = mockStudents.filter(s => attendance[s.id] === 'present' && !s.onLeave).length;
  const absentCount = mockStudents.filter(s => attendance[s.id] === 'absent').length;
  const lateCount = mockStudents.filter(s => attendance[s.id] === 'late').length;
  const leaveCount = mockStudents.filter(s => s.onLeave).length;

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
              <h1 className="text-3xl font-bold mb-2">Grade 5 - Section A</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Taking attendance for {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-500">{presentCount}</div>
              <div className="text-xs text-gray-500">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-red-500">{absentCount}</div>
              <div className="text-xs text-gray-500">Absent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-yellow-500">{lateCount}</div>
              <div className="text-xs text-gray-500">Late</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-500">{leaveCount}</div>
              <div className="text-xs text-gray-500">On Leave</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{mockStudents.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </CardContent>
          </Card>
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
                        markAllAbsent();
                      }
                    }}
                  >
                    {mode === 'absentFirst' ? 'Normal Mode' : 'Absent First'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Mark all as present
                      const updatedAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
                      mockStudents.forEach(student => {
                        updatedAttendance[student.id] = student.onLeave ? 'present' : 'present';
                      });
                      setAttendance(updatedAttendance);
                    }}
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
                    onChange={(e) => setFilter(e.target.value as 'all' | 'present' | 'absent' | 'leave')}
                  >
                    <option value="all">All Students</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">On Leave</option>
                  </select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Student</th>
                      <th className="text-center p-4 font-medium">Present</th>
                      <th className="text-center p-4 font-medium">Absent</th>
                      <th className="text-center p-4 font-medium">Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        className={`border-b hover:bg-muted/50 ${student.onLeave ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span>Roll #{student.rollNumber}</span>
                                {student.onLeave && (
                                  <span className="flex items-center gap-1 text-blue-500">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>On Leave</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full p-2 ${!student.onLeave && attendance[student.id] === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                            onClick={() => !student.onLeave && handleAttendanceChange(student.id, 'present')}
                            disabled={student.onLeave}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full p-2 ${!student.onLeave && attendance[student.id] === 'absent' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}`}
                            onClick={() => !student.onLeave && handleAttendanceChange(student.id, 'absent')}
                            disabled={student.onLeave}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full p-2 ${!student.onLeave && attendance[student.id] === 'late' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}`}
                            onClick={() => !student.onLeave && handleAttendanceChange(student.id, 'late')}
                            disabled={student.onLeave}
                          >
                            <Clock className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Save Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}