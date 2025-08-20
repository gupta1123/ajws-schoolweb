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
  CheckCircle,
  User,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock data for classes
const mockClasses = [
  { id: '1', name: 'Grade 5', division: 'A', studentCount: 32 },
  { id: '2', name: 'Grade 6', division: 'B', studentCount: 28 },
  { id: '3', name: 'Grade 7', division: 'C', studentCount: 30 }
];

// Mock data for attendance statistics
const mockStats = {
  todayMarked: 2,
  todayPending: 1,
  weeklyAverage: 92,
  monthlyTrend: 'up'
};

// Mock data for unmarked attendance
const mockUnmarkedAttendance = [
  { id: '2', name: 'Grade 6 - Section B', studentCount: 28, lastMarked: '2025-08-14' },
  { id: '3', name: 'Grade 7 - Section C', studentCount: 30, lastMarked: '2025-08-13' }
];

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

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



  const handleTakeAttendance = () => {
    if (selectedClass && date) {
      router.push(`/attendance/${selectedClass}?date=${date}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Take and manage attendance for your classes
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Today Marked</p>
                  <p className="text-xl font-bold">{mockStats.todayMarked}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-xl font-bold">{mockStats.todayPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Avg</p>
                  <p className="text-xl font-bold">{mockStats.weeklyAverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Classes</p>
                  <p className="text-xl font-bold">{mockClasses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Take Attendance</CardTitle>
                <CardDescription>
                  Select a class and date to take attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="class" className="text-sm font-medium">
                      Select Class
                    </label>
                    <select
                      id="class"
                      value={selectedClass || ''}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="border rounded-md px-3 py-2 w-full"
                    >
                      <option value="">Select a class</option>
                      {mockClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.division} ({cls.studentCount} students)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleTakeAttendance}
                  disabled={!selectedClass || !date}
                  className="w-full md:w-auto"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Take Attendance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  View and manage previous attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search attendance records..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Class</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Present</th>
                        <th className="text-left p-4 font-medium">Absent</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">Grade 5 - Section A</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>2025-08-15</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-green-500">30</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-red-500">2</div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">Grade 6 - Section B</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>2025-08-14</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-green-500">26</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-red-500">2</div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Unmarked Attendance Alert */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Action Required
                </CardTitle>
                <CardDescription>
                  Attendance not marked for these classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockUnmarkedAttendance.map((cls) => (
                    <div key={cls.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{cls.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cls.studentCount} students
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
                          Mark Now
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Last marked: {cls.lastMarked}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Attendance Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">Tip:</span> Mark absentees first using the &quot;Absent First&quot; mode in class attendance for faster entry.
                </p>
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Approved leaves are automatically marked and shown in reports.
                </p>
                <p className="text-sm">
                  <span className="font-medium">Reminder:</span> Daily attendance helps track student engagement patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}