// src/app/(admin)/students/[id]/edit/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentServices, Student } from '@/lib/api/students';
import { Loader2 } from 'lucide-react';

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    class: '',
    dateOfBirth: '',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: ''
  });

  // Extract student ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: studentIdFromParams } = resolvedParams;
      
      // Fetch student data for editing
      const fetchStudentData = async () => {
        if (!token || !studentIdFromParams) return;
        
        try {
          setLoading(true);
          setError(null);
          
          const response = await studentServices.getStudentById(studentIdFromParams, token);

          // Handle Blob response (shouldn't happen for JSON endpoints)
          if (response instanceof Blob) {
            setError('Unexpected response format from API');
            return;
          }

          // Handle error response
          if ('status' in response && response.status === 'error') {
            setError(response.message || 'Failed to fetch student data');
            return;
          }

          // Handle successful response
          if ('status' in response && response.status === 'success' && response.data) {
            const student = response.data.student;
            setStudentData(student);

            // Get current academic record
            const currentRecord = student.student_academic_records.find(record => record.status === 'ongoing');
            const primaryParent = student.parent_mappings?.find(mapping => mapping.is_primary_guardian);
            
            // Populate form with current data
            // Derive class/grade name, supporting both class_level and level keys
            const classLevelName = currentRecord?.class_division
              ? (
                  // Some API responses use class_level, others use level
                  (currentRecord.class_division as { class_level?: { name: string }; level?: { name: string } }).class_level?.name ||
                  (currentRecord.class_division as { class_level?: { name: string }; level?: { name: string } }).level?.name ||
                  'Unknown'
                )
              : '';

            setFormData({
              fullName: student.full_name,
              rollNumber: currentRecord?.roll_number || '',
              class: currentRecord && currentRecord.class_division
                ? `${classLevelName} - Section ${currentRecord.class_division.division || 'Unknown'}`
                : '',
              dateOfBirth: student.date_of_birth,
              fatherName: primaryParent?.parent.full_name || '',
              motherName: '', // Not available in current API
              parentPhone: primaryParent?.parent.phone_number || '',
              parentEmail: primaryParent?.parent.email || '',
              emergencyContact: '' // Not available in current API
            });
          }
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

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !studentData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare update payload with only the edited field
      const updatePayload = {
        full_name: formData.fullName
      };
      
      const response = await studentServices.updateStudent(studentData.id, updatePayload, token);
      
      if (response.status === 'success') {
        // Update local state with new data
        setStudentData(response.data.student);
        
        // Show success message and redirect back
        alert('Student updated successfully!');
        router.back();
      } else {
        setError('Failed to update student');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student';
      setError(errorMessage);
      console.error('Error updating student:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading student data...</span>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !studentData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-gray-600">{error || 'Student not found'}</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

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
              ← Back to Student Details
            </Button>
          </div>



          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>
                  Update the student&apos;s personal and academic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="Enter roll number"
                      required
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Input
                      id="class"
                      name="class"
                      value={formData.class}
                      onChange={handleChange}
                      placeholder="Enter class"
                      required
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                

                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father&apos;s Name</Label>
                      <Input
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        placeholder="Enter father&apos;s name"
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother&apos;s Name</Label>
                      <Input
                        id="motherName"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleChange}
                        placeholder="Enter mother&apos;s name"
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Parent Phone *</Label>
                      <Input
                        id="parentPhone"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleChange}
                        placeholder="Enter parent&apos;s phone number"
                        required
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        name="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={handleChange}
                        placeholder="Enter parent&apos;s email"
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        placeholder="Enter emergency contact information"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Student'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
