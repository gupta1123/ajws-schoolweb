// src/app/(teacher)/assessments/[id]/grade/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search,
  User,
  Save,
  BarChart3,
  Filter,
  CheckCircle,
  Edit
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock data for students and their marks
const mockStudents = [
  { id: '1', name: 'Aarav Patel', rollNumber: '501', marks: 85, graded: true },
  { id: '2', name: 'Aditi Sharma', rollNumber: '502', marks: 92, graded: true },
  { id: '3', name: 'Arjun Reddy', rollNumber: '503', marks: 78, graded: true },
  { id: '4', name: 'Diya Nair', rollNumber: '504', marks: 88, graded: true },
  { id: '5', name: 'Ishaan Kumar', rollNumber: '505', marks: 95, graded: true },
  { id: '6', name: 'Kiara Mehta', rollNumber: '506', marks: 82, graded: false }, // Not yet graded
  { id: '7', name: 'Rohan Singh', rollNumber: '507', marks: 90, graded: true },
  { id: '8', name: 'Saanvi Gupta', rollNumber: '508', marks: 87, graded: true }
];

export default function GradeAssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const maxMarks = 100; // Default max marks

  // Initialize marks state with mock data
  useEffect(() => {
    const initialMarks: Record<string, number> = {};
    mockStudents.forEach(student => {
      initialMarks[student.id] = student.marks;
    });
    setMarks(initialMarks);
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

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxMarks) {
      setMarks(prev => ({
        ...prev,
        [studentId]: numValue
      }));
    }
  };

  const handleSubmit = () => {
    // Here you would typically send the marks data to your API
    console.log('Marks data:', marks);
    alert('Marks saved successfully!');
    router.push('/assessments');
  };

  // Filter students based on search term and filter
  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.includes(searchTerm);
    
    let matchesFilter = true;
    if (filter === 'graded') {
      matchesFilter = student.graded;
    } else if (filter === 'ungraded') {
      matchesFilter = !student.graded;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalStudents = mockStudents.length;
  const gradedStudents = mockStudents.filter(s => s.graded).length;
  const ungradedStudents = totalStudents - gradedStudents;
  const averageScore = mockStudents.length > 0 ? 
    Math.round(mockStudents.reduce((sum, s) => sum + s.marks, 0) / mockStudents.length) : 0;

  // Quick grading functions
  const gradeAll = (marksValue: number) => {
    const updatedMarks: Record<string, number> = {};
    mockStudents.forEach(student => {
      updatedMarks[student.id] = marksValue;
    });
    setMarks(updatedMarks);
  };

  const saveAndContinue = () => {
    // Save current marks and move to next ungraded student
    console.log('Saving current marks...');
    // In a real app, you would save to the API here
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-6xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Grade Assessment</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Mathematics Mid-Term Exam - Grade 5 - Section A
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveAndContinue}>
                  Save & Continue
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Marks
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                    <p className="text-xl font-bold">{totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Graded</p>
                    <p className="text-xl font-bold">{gradedStudents}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-xl font-bold">{ungradedStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
                    <p className="text-xl font-bold">{averageScore}/{maxMarks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Student Marks</CardTitle>
                  <CardDescription>
                    Enter marks for each student
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => gradeAll(Math.floor(maxMarks * 0.8))}
                  >
                    All Pass ({Math.floor(maxMarks * 0.8)})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => gradeAll(Math.floor(maxMarks * 0.6))}
                  >
                    Avg. ({Math.floor(maxMarks * 0.6)})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => gradeAll(0)}
                  >
                    All Zero
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
                    onChange={(e) => setFilter(e.target.value as 'all' | 'graded' | 'ungraded')}
                  >
                    <option value="all">All Students</option>
                    <option value="graded">Graded</option>
                    <option value="ungraded">Not Graded</option>
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
                      <th className="text-left p-4 font-medium">Roll Number</th>
                      <th className="text-right p-4 font-medium">Marks</th>
                      <th className="text-right p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        className={`border-b hover:bg-muted/50 ${!student.graded ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-muted-foreground">
                            #{student.rollNumber}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={marks[student.id] || ''}
                              onChange={(e) => handleMarksChange(student.id, e.target.value)}
                              className="w-24 text-right"
                            />
                            <div className="flex items-center ml-2">
                              / {maxMarks}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {student.graded ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Edit className="h-3 w-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}