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
import { Homework } from '@/types/homework';

// Mock data for class divisions (this would come from an API in a real implementation)
const mockClassDivisions = [
  { id: '1', name: 'Grade 5 - Section A' },
  { id: '2', name: 'Grade 6 - Section B' },
  { id: '3', name: 'Grade 7 - Section C' }
];

export default function EditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
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
      
      // Fetch homework data for editing
      const fetchHomework = async () => {
        if (!user || !token || !homeworkIdFromParams) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // For now, we'll simulate fetching the homework data
          // In a real implementation, you'd have a getHomeworkById API call
          // For now, we'll create mock data based on the ID
          const mockHomeworkData: Homework = {
            id: homeworkIdFromParams,
            class_division_id: '1',
            teacher_id: user.id || '',
            subject: 'Mathematics',
            title: 'Chapter 3 Exercises',
            description: 'Complete exercises 1-10 from Chapter 3',
            due_date: '2025-08-20',
            created_at: new Date().toISOString()
          };
          
          setHomework(mockHomeworkData);
          setFormData({
            class_division_id: mockHomeworkData.class_division_id,
            subject: mockHomeworkData.subject,
            title: mockHomeworkData.title,
            description: mockHomeworkData.description,
            due_date: mockHomeworkData.due_date
          });
        } catch (err) {
          setError('Failed to load homework data');
          console.error('Error fetching homework:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchHomework();
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
                  {mockClassDivisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
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