// src/app/(teacher)/homework/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { DataChart } from '@/components/ui/data-chart';
import { ProgressIndicator } from '@/components/ui/progress-indicator';

// Mock data for homework assignments with extended information
const mockHomework = [
  {
    id: '1',
    class: 'Grade 5 - Section A',
    subject: 'Mathematics',
    title: 'Chapter 3 Exercises',
    description: 'Complete exercises 1-10 from Chapter 3',
    dueDate: '2025-08-20',
    createdDate: '2025-08-15',
    submissionRate: 85,
    avgScore: 78,
    status: 'active'
  },
  {
    id: '2',
    class: 'Grade 6 - Section B',
    subject: 'Science',
    title: 'Project Work',
    description: 'Complete the photosynthesis project',
    dueDate: '2025-08-25',
    createdDate: '2025-08-14',
    submissionRate: 72,
    avgScore: 85,
    status: 'pending'
  },
  {
    id: '3',
    class: 'Grade 7 - Section C',
    subject: 'English',
    title: 'Essay Writing',
    description: 'Write an essay on "My Summer Vacation"',
    dueDate: '2025-08-22',
    createdDate: '2025-08-12',
    submissionRate: 92,
    avgScore: 88,
    status: 'completed'
  },
  {
    id: '4',
    class: 'Grade 5 - Section A',
    subject: 'Mathematics',
    title: 'Geometry Problems',
    description: 'Solve problems 15-25 from Chapter 4',
    dueDate: '2025-08-18',
    createdDate: '2025-08-10',
    submissionRate: 68,
    avgScore: 72,
    status: 'active'
  }
];

// Mock data for charts
const mockSubmissionData = [
  { day: 'Mon', submissions: 12 },
  { day: 'Tue', submissions: 18 },
  { day: 'Wed', submissions: 22 },
  { day: 'Thu', submissions: 28 },
  { day: 'Fri', submissions: 35 },
  { day: 'Sat', submissions: 42 },
  { day: 'Sun', submissions: 48 }
];

const mockSubjectPerformance = [
  { subject: 'Mathematics', avgScore: 78 },
  { subject: 'Science', avgScore: 85 },
  { subject: 'English', avgScore: 88 },
  { subject: 'History', avgScore: 82 },
  { subject: 'Art', avgScore: 92 }
];

export default function HomeworkPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

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

  // Filter homework based on search term and filters
  const filteredHomework = mockHomework.filter(assignment => 
    (assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.class.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedSubject === 'all' || assignment.subject === selectedSubject) &&
    (selectedClass === 'all' || assignment.class === selectedClass)
  );

  const handleDelete = (id: string) => {
    // Here you would typically send the delete request to your API
    console.log(`Deleting homework with id: ${id}`);
    // Update the UI to reflect the deletion
    alert(`Homework assignment deleted successfully!`);
  };

  // Calculate summary statistics
  const totalAssignments = mockHomework.length;
  const completedAssignments = mockHomework.filter(hw => hw.status === 'completed').length;
  const avgSubmissionRate = Math.round(mockHomework.reduce((sum, hw) => sum + hw.submissionRate, 0) / mockHomework.length) || 0;
  const avgScore = Math.round(mockHomework.reduce((sum, hw) => sum + hw.avgScore, 0) / mockHomework.length) || 0;

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Homework</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create and manage homework assignments for your classes
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/homework/create">
                <Plus className="mr-2 h-5 w-5" />
                Create Homework
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assignments"
            value={totalAssignments}
            description="Across all classes"
            icon={<BookOpen className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Completed"
            value={completedAssignments}
            description="Fully graded assignments"
            trend="up"
            trendValue="+12%"
            icon={<CheckCircle className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Avg. Submission"
            value={`${avgSubmissionRate}%`}
            description="Across all assignments"
            trend="up"
            trendValue="+3.2%"
            icon={<Clock className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Avg. Score"
            value={`${avgScore}%`}
            description="Class average"
            trend="neutral"
            trendValue="Stable"
            icon={<TrendingUp className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Submission Trends
              </CardTitle>
              <CardDescription>
                Weekly submission rate across all assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataChart
                data={mockSubmissionData}
                type="line"
                dataKey="submissions"
                xAxisKey="day"
                height={250}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Subject Performance
              </CardTitle>
              <CardDescription>
                Average scores by subject area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataChart
                data={mockSubjectPerformance}
                type="bar"
                dataKey="avgScore"
                xAxisKey="subject"
                height={250}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search homework..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>History</option>
                    <option>Art</option>
                  </select>
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    <option>Grade 5 - Section A</option>
                    <option>Grade 6 - Section B</option>
                    <option>Grade 7 - Section C</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Homework Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Homework Assignments</CardTitle>
              <CardDescription>
                List of homework assignments you&apos;ve created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Avg. Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHomework.map((assignment) => (
                      <TableRow key={assignment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {assignment.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.title}</div>
                            <div className="text-sm text-muted-foreground">{assignment.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.class}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {assignment.dueDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <div className="text-sm font-medium">{assignment.submissionRate}%</div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full" 
                                  style={{ width: `${assignment.submissionRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${
                            assignment.avgScore >= 90 ? 'text-green-500' : 
                            assignment.avgScore >= 75 ? 'text-blue-500' : 
                            'text-yellow-500'
                          }`}>
                            {assignment.avgScore}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <ProgressIndicator 
                            status={
                              assignment.status === 'completed' ? 'completed' : 
                              assignment.status === 'active' ? 'in-progress' : 
                              'pending'
                            } 
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/homework/edit/${assignment.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredHomework.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No homework found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No homework matches your search.' : 'You haven\'t created any homework yet.'}
                  </p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/homework/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Homework
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}