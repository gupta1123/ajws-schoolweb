// src/app/birthdays/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Send, Cake, User, Calendar, GraduationCap, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BirthdayStudent } from '@/lib/api/birthdays';

export default function BirthdayDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<BirthdayStudent | null>(null);

  // Extract student ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: studentIdFromParams } = resolvedParams;
      
      // Fetch student data from API
      const fetchStudentData = async () => {
        if (!token || !studentIdFromParams) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // Since we don't have a direct endpoint for student by ID, we'll use the division endpoint
          // This is a limitation - ideally there should be a GET /api/students/:id endpoint
          // For now, we'll show a message that this feature needs the student endpoint
          
          // Mock data for demonstration - replace with actual API call when student endpoint is available
          const mockStudent: BirthdayStudent = {
            id: studentIdFromParams,
            full_name: 'Aarav Patel',
            date_of_birth: '2015-03-15',
            admission_number: '2025001',
            status: 'active',
            student_academic_records: [
              {
                class_division: {
                  division: 'A',
                  level: {
                    name: 'Grade 5',
                    sequence_number: 5
                  }
                },
                roll_number: '501'
              }
            ]
          };
          
          setStudentData(mockStudent);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student data';
          setError(errorMessage);
          console.error('Error fetching student data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchStudentData();
    };
    
    extractId();
  }, [params, token]);

  const handleSendWish = (studentName: string) => {
    // Here you would typically send the wish to your API or open a message composer
    console.log(`Sending birthday wish to ${studentName}`);
    // For now, we'll just show an alert
    alert(`Birthday wish sent to ${studentName}!`);
  };

  const handleRefresh = () => {
    // Refresh student data
    window.location.reload();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300">Loading student data...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="text-center py-8">
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                Try Again
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!studentData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-300">Student not found</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(studentData.date_of_birth);
  const classInfo = studentData.student_academic_records[0]?.class_division;
  const className = classInfo ? `${classInfo.level.name} - Section ${classInfo.division}` : 'Not Assigned';
  const rollNumber = studentData.student_academic_records[0]?.roll_number || 'Not Assigned';

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-4xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Birthdays
            </Button>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Cake className="h-8 w-8 text-pink-500" />
              Birthday Details
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              View student birthday information
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                  <CardDescription>
                    Birthday student details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium">{studentData.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admission Number</p>
                    <p className="font-medium">{studentData.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">{className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Roll Number</p>
                    <p className="font-medium">{rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Birthday Date</p>
                    <p className="font-medium">{studentData.date_of_birth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{age} years old</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{studentData.status}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                  <CardDescription>
                    Current academic details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Class Level</p>
                    <p className="font-medium">{classInfo?.level.name || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Division</p>
                    <p className="font-medium">{classInfo?.division || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sequence Number</p>
                    <p className="font-medium">{classInfo?.level.sequence_number || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Birthday Actions</CardTitle>
                  <CardDescription>
                    Send birthday wishes to the student
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full flex items-center gap-2"
                    onClick={() => handleSendWish(studentData.full_name)}
                  >
                    <Send className="h-4 w-4" />
                    Send Birthday Wish
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add to Calendar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Birthday Reminder</CardTitle>
                  <CardDescription>
                    Important information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This student&apos;s birthday is today! Don&apos;t forget to celebrate and make their day special.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                  <CardDescription>
                    Key details at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Birthday: {studentData.date_of_birth}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Age: {age} years</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span>Class: {className}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}