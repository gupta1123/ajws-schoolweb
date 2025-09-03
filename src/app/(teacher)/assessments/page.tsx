// src/app/(teacher)/assessments/page.tsx

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
  Plus,
  Edit,
  BookOpen,
  FileText,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// Mock data for assessments
const mockAssessments = [
  { 
    id: '1', 
    title: 'Mathematics Mid-Term Exam', 
    subject: 'Mathematics', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-15',
    maxMarks: 100,
    averageScore: 78,
    totalStudents: 32,
    graded: 30,
    pending: 2
  },
  { 
    id: '2', 
    title: 'Science Chapter Test', 
    subject: 'Science', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-10',
    maxMarks: 50,
    averageScore: 42,
    totalStudents: 32,
    graded: 32,
    pending: 0
  },
  { 
    id: '3', 
    title: 'English Grammar Quiz', 
    subject: 'English', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-05',
    maxMarks: 25,
    averageScore: 20,
    totalStudents: 32,
    graded: 32,
    pending: 0
  },
  { 
    id: '4', 
    title: 'Mathematics Term 1 Exam', 
    subject: 'Mathematics', 
    class: 'Grade 5 - Section A', 
    date: '2025-07-15',
    maxMarks: 100,
    averageScore: 85,
    totalStudents: 32,
    graded: 32,
    pending: 0
  }
];

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

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

  // Get unique subjects and classes for filters
  const subjects = Array.from(new Set(mockAssessments.map(a => a.subject)));
  const classes = Array.from(new Set(mockAssessments.map(a => a.class)));

  // Filter assessments based on search term and filters
  const filteredAssessments = mockAssessments.filter(assessment => {
    const matchesSearch = 
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.class.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'all' || assessment.subject === subjectFilter;
    const matchesClass = classFilter === 'all' || assessment.class === classFilter;
    
    return matchesSearch && matchesSubject && matchesClass;
  });

  // Calculate overall statistics
  const totalAssessments = mockAssessments.length;
  const pendingGrading = mockAssessments.reduce((sum, a) => sum + a.pending, 0);
  const overallAverage = mockAssessments.length > 0 ? 
    Math.round(mockAssessments.reduce((sum, a) => sum + a.averageScore, 0) / mockAssessments.length) : 0;

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Assessments</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and grade assessments for your classes
              </p>
            </div>
            <Button asChild>
              <Link href="/assessments/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Assessment
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Assessments</p>
                  <p className="text-xl font-bold">{totalAssessments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Edit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Grading</p>
                  <p className="text-xl font-bold">{pendingGrading}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
                  <p className="text-xl font-bold">{overallAverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment List</CardTitle>
              <CardDescription>
                View and manage your assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assessments..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Assessment</th>
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Class</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Avg. Score</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{assessment.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Max Marks: {assessment.maxMarks}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{assessment.subject}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {assessment.class}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{assessment.date}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-blue-500">
                            {assessment.averageScore}/{assessment.maxMarks}
                          </div>
                        </td>
                        <td className="p-4">
                          {assessment.pending > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Edit className="h-3 w-3 mr-1" />
                              {assessment.pending} pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/assessments/${assessment.id}/grade`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Grade
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/assessments/${assessment.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}