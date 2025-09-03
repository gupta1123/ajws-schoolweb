// src/app/(admin)/students/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { studentServices, CreateStudentRequest } from '@/lib/api/students';
import { academicServices } from '@/lib/api/academic';

export default function CreateStudentPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    dateOfBirth: '',
    admissionDate: '',
    classDivisionId: '',
    rollNumber: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [classDivisions, setClassDivisions] = useState<Array<{
    id: string;
    division: string;
    level?: { name: string; sequence_number: number };
    class_level?: { name: string; sequence_number: number };
  }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch available class divisions
  useEffect(() => {
    const fetchClassDivisions = async () => {
      if (!token) return;
      
      try {
        setLoadingClasses(true);
        const response = await academicServices.getClassDivisionsSummary(token);
        
        if (response.status === 'success' && response.data) {
          // Transform the data to match our expected structure
          const transformedDivisions = response.data.divisions.map((division: {
            id: string;
            division: string;
            level: { name: string; sequence_number: number };
          }) => ({
            id: division.id,
            division: division.division,
            level: division.level,
            class_level: division.level
          }));
          setClassDivisions(transformedDivisions);
        }
      } catch (err: unknown) {
        console.error('Error fetching class divisions:', err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClassDivisions();
  }, [token]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      const studentData: CreateStudentRequest = {
        admission_number: formData.admissionNumber,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        admission_date: formData.admissionDate,
        class_division_id: formData.classDivisionId,
        roll_number: formData.rollNumber,
        phone_number: undefined, // Removed phone number
        email: undefined // Removed email
      };

      const response = await studentServices.createStudent(studentData, token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        console.error('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        console.error('Failed to create student:', response.message);
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success') {
        // Redirect to students list
        router.push('/students');
      }
    } catch (err: unknown) {
      console.error('Error creating student:', err);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-2xl mx-auto pt-16">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              ← Back to Students
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>
                  Enter the student&apos;s personal and academic details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter student&apos;s full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionNumber">Admission Number</Label>
                    <Input
                      id="admissionNumber"
                      name="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 2025001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 501"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissionDate">Admission Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admissionDate"
                        name="admissionDate"
                        type="date"
                        value={formData.admissionDate}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classDivisionId">Class Division</Label>
                  {loadingClasses ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Loading classes...</span>
                    </div>
                  ) : (
                    <select
                      id="classDivisionId"
                      name="classDivisionId"
                      value={formData.classDivisionId}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full"
                      required
                    >
                      <option value="">Select a class</option>
                      {classDivisions.map(division => (
                        <option key={division.id} value={division.id}>
                          {division.level?.name || division.class_level?.name} - Section {division.division}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </CardContent>
            </Card>



            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || loadingClasses}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
