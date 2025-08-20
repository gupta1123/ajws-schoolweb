// src/app/(teacher)/classes/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  Users,
  BookOpen,
  Clipboard,
  Calendar,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { ClassCard } from '@/components/classes/class-card';
import { TeacherWorkloadSummary } from '@/components/dashboard/teacher-workload-summary';
import { PriorityAlerts } from '@/components/dashboard/priority-alerts';

// Mock data for classes with extended information
const mockClasses = [
  {
    id: '1',
    name: 'Grade 5',
    division: 'A',
    studentCount: 32,
    homeworkCompletion: 85,
    recentClasswork: 'Mathematics - Fractions',
    upcomingAssignments: 2,
    upcomingBirthdays: 3,
    unreadMessages: 1,
    healthScore: 92,
    level: {
      id: '1',
      name: 'Grade 5',
      sequence_number: 5
    },
    teacher: {
      id: '1',
      full_name: 'John Doe'
    }
  },
  {
    id: '2',
    name: 'Grade 6',
    division: 'B',
    studentCount: 28,
    homeworkCompletion: 78,
    recentClasswork: 'Science - Photosynthesis',
    upcomingAssignments: 1,
    upcomingBirthdays: 1,
    unreadMessages: 0,
    healthScore: 85,
    level: {
      id: '2',
      name: 'Grade 6',
      sequence_number: 6
    },
    teacher: {
      id: '1',
      full_name: 'John Doe'
    }
  },
  {
    id: '3',
    name: 'Grade 7',
    division: 'C',
    studentCount: 30,
    homeworkCompletion: 92,
    recentClasswork: 'English - Poetry',
    upcomingAssignments: 3,
    upcomingBirthdays: 2,
    unreadMessages: 2,
    healthScore: 95,
    level: {
      id: '3',
      name: 'Grade 7',
      sequence_number: 7
    },
    teacher: {
      id: '1',
      full_name: 'John Doe'
    }
  }
];

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Array<{
    id: string;
    name: string;
    division: string;
    studentCount: number;
    homeworkCompletion: number;
    recentClasswork: string;
    upcomingAssignments: number;
    upcomingBirthdays: number;
    unreadMessages: number;
    healthScore: number;
    level: {
      id: string;
      name: string;
      sequence_number: number;
    };
    teacher: {
      id: string;
      full_name: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setClasses(mockClasses);
      setLoading(false);
    }, 500);
  }, []);

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  // Filter and sort classes
  const filteredAndSortedClasses = classes
    .filter(cls => 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.division.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'students') {
        return b.studentCount - a.studentCount;
      } else if (sortBy === 'health') {
        return b.healthScore - a.healthScore;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading classes...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Classes</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your classes and view student information
          </p>
        </div>

        {/* Priority Alerts */}
        <PriorityAlerts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search classes..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="border rounded-md px-3 py-2 text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Sort by Name</option>
                      <option value="students">Sort by Students</option>
                      <option value="health">Sort by Health</option>
                    </select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Cards Grid */}
            {filteredAndSortedClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No classes match your search.' : 'You don\'t have any classes assigned to you yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    id={classItem.id}
                    name={classItem.name}
                    division={classItem.division}
                    studentCount={classItem.studentCount}
                    homeworkCompletion={classItem.homeworkCompletion}
                    recentClasswork={classItem.recentClasswork}
                    upcomingAssignments={classItem.upcomingAssignments}
                    upcomingBirthdays={classItem.upcomingBirthdays}
                    unreadMessages={classItem.unreadMessages}
                    healthScore={classItem.healthScore}
                  />
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Class Summary
                </CardTitle>
                <CardDescription>
                  Overview of your teaching responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">{classes.length}</div>
                    <div className="text-sm text-muted-foreground">Total Classes</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Math.round(classes.reduce((sum, cls) => sum + cls.homeworkCompletion, 0) / classes.length) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Completion</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {classes.reduce((sum, cls) => sum + cls.upcomingAssignments, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Upcoming Assignments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Teacher Workload Summary */}
            <TeacherWorkloadSummary />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common teaching tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/homework/create">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Homework
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/classwork/create">
                      <Clipboard className="h-4 w-4 mr-2" />
                      Record Classwork
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/messages">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Parents
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/calendar">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}