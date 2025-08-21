// src/app/(teacher)/homework/edit/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { homeworkServices } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { Homework } from '@/types/homework';
import { toast } from '@/hooks/use-toast';

// Interface for the API response structure
interface AssignedClass {
  assignment_id: string;
  class_division_id: string;
  division: string;
  class_name: string;
  class_level: string;
  sequence_number: number;
  academic_year: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary: boolean;
  assigned_date: string;
  subject?: string;
}

// Interface for the transformed class data we're using
interface TransformedClass {
  id: string;
  division: string;
  class_level: {
    name: string;
  };
  academic_year: {
    year_name: string;
  };
}



export default function EditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [classDivisions, setClassDivisions] = useState<TransformedClass[]>([]);


  // Format class division name for display
  const formatClassName = (division: TransformedClass) => {
    return `${division.class_level?.name || 'Unknown'} - Section ${division.division}`;
  };
  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    title: '',
    description: '',
    due_date: ''
  });

  // Extract homework ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: homeworkIdFromParams } = resolvedParams;
      
      // Fetch homework data and class divisions for editing
      const fetchData = async () => {
        if (!user || !token || !homeworkIdFromParams) return;

        try {
          setLoading(true);
          setError(null);

          // Fetch class divisions and subjects first
          const teacherResponse = await academicServices.getMyTeacherClasses(token);
          if (teacherResponse.status === 'success' && teacherResponse.data) {
            // Filter for only subject teacher assignments
            const subjectTeacherClasses = teacherResponse.data.assigned_classes.filter(
              (assignment: AssignedClass) => assignment.assignment_type === 'subject_teacher'
            );



            // Transform classes for the dropdown
            const transformedClasses = subjectTeacherClasses.map((assignment: AssignedClass) => ({
              id: assignment.class_division_id,
              division: assignment.division,
              class_level: {
                name: assignment.class_level
              },
              academic_year: {
                year_name: assignment.academic_year
              }
            }));

            // Remove duplicates
            const uniqueClasses = transformedClasses.filter((classItem: TransformedClass, index: number, self: TransformedClass[]) =>
              index === self.findIndex(c => c.id === classItem.id)
            );

            setClassDivisions(uniqueClasses);
          }

          // Fetch specific homework data
          console.log('Fetching homework with ID:', homeworkIdFromParams);
          const homeworkResponse = await homeworkServices.getHomeworkById(token, homeworkIdFromParams);
          console.log('API Response:', homeworkResponse);

          // Handle different possible response structures
          if (homeworkResponse.status === 'success') {
            const homeworkData = homeworkResponse.data?.homework || homeworkResponse.data;
            if (homeworkData) {
              console.log('Found homework data:', homeworkData);
              setHomework(homeworkData);
              const formattedDueDate = homeworkData.due_date ? new Date(homeworkData.due_date).toISOString().split('T')[0] : '';
              console.log('Original due_date:', homeworkData.due_date);
              console.log('Formatted due_date:', formattedDueDate);

              setFormData({
                class_division_id: homeworkData.class_division_id,
                subject: homeworkData.subject,
                title: homeworkData.title,
                description: homeworkData.description,
                due_date: formattedDueDate
              });
            } else {
              setError('Homework data not found in response');
              console.error('No homework data in response:', homeworkResponse.data);
            }
          } else {
            setError('Failed to fetch homework');
            console.error('API Error:', homeworkResponse);
          }
        } catch (err) {
          setError('Failed to load homework data');
          console.error('Error fetching data:', err);
          toast({
            title: "Error",
            description: "Failed to load homework data",
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    };
    
    extractId();
  }, [params, user, token]);

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

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-600">Loading homework...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error || !homework) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Homework</h2>
            <p className="text-gray-600 mb-4">{error || 'Homework not found'}</p>
            <Button onClick={() => router.back()}>
              ← Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Update the homework using the API
      const response = await homeworkServices.updateHomework(homework!.id, formData, token!);
      
      if (response.status === 'success') {
        // Redirect to homework list or show success message
        router.push('/homework');
      } else {
        setError('Failed to update homework');
      }
    } catch (err) {
      setError('An error occurred while updating homework');
      console.error('Error updating homework:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="mb-4"
          >
            ← Back to Homework
          </Button>
          <h1 className="text-3xl font-bold mb-2">Edit Homework</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Update the homework assignment details
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Edit Homework Assignment</CardTitle>
              <CardDescription>
                Update the details for the homework assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_division_id">Class</Label>
                  <select
                    id="class_division_id"
                    name="class_division_id"
                    value={formData.class_division_id}
                    onChange={handleChange}
                    className="border rounded-md px-3 py-2 w-full"
                    required
                  >
                    <option value="">Select a class</option>
                    {classDivisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {formatClassName(division)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter homework title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter detailed description of the homework"
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Homework'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}