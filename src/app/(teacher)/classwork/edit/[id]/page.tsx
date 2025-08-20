// src/app/(teacher)/classwork/edit/[id]/page.tsx

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
import { Calendar, X, BookOpen, Share2, Tag, Loader2 } from 'lucide-react';
import { classworkServices } from '@/lib/api/classwork';
import { Classwork } from '@/types/classwork';

// Mock data for class divisions (this would come from an API in a real implementation)
const mockClassDivisions = [
  { id: '1', name: 'Grade 5 - Section A' },
  { id: '2', name: 'Grade 6 - Section B' },
  { id: '3', name: 'Grade 7 - Section C' }
];

// Common subjects
const commonSubjects = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Foreign Language'
];

export default function EditClassworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classwork, setClasswork] = useState<Classwork | null>(null);
  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    summary: '',
    topics_covered: [] as string[],
    date: '',
    is_shared_with_parents: false
  });
  const [topicInput, setTopicInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract classwork ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: classworkIdFromParams } = resolvedParams;
      
      // Fetch classwork data for editing
      const fetchClasswork = async () => {
        if (!token || !classworkIdFromParams || !user) return;
        
        try {
          setLoading(true);
          setError(null);
          
          // For now, we'll simulate fetching the classwork data
          // In a real implementation, you'd have a getClassworkById API call
          // For now, we'll create mock data based on the ID
          const mockClassworkData: Classwork = {
            id: classworkIdFromParams,
            class_division_id: '1',
            teacher_id: user.id || '',
            subject: 'Mathematics',
            summary: 'Introduction to Fractions',
            topics_covered: ['Fractions', 'Numerators', 'Denominators'],
            date: '2025-08-15',
            is_shared_with_parents: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setClasswork(mockClassworkData);
          setFormData({
            class_division_id: mockClassworkData.class_division_id,
            subject: mockClassworkData.subject,
            summary: mockClassworkData.summary,
            topics_covered: [...mockClassworkData.topics_covered],
            date: mockClassworkData.date,
            is_shared_with_parents: mockClassworkData.is_shared_with_parents
          });
        } catch (err) {
          setError('Failed to load classwork data');
          console.error('Error fetching classwork:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchClasswork();
    };
    
    extractId();
  }, [params, token, user]);

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
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-600">Loading classwork...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error || !classwork) {
    return (
      <ProtectedRoute>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Classwork</h2>
            <p className="text-gray-600 mb-4">{error || 'Classwork not found'}</p>
            <Button onClick={() => router.back()}>
              ← Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleTopicAdd = () => {
    if (topicInput.trim() && !formData.topics_covered.includes(topicInput.trim())) {
      setFormData(prev => ({
        ...prev,
        topics_covered: [...prev.topics_covered, topicInput.trim()]
      }));
      setTopicInput('');
    }
  };

  const handleTopicRemove = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics_covered: prev.topics_covered.filter(t => t !== topic)
    }));
  };

  const handleTopicKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTopicAdd();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.class_division_id) {
      newErrors.class_division_id = 'Please select a class';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Please enter a subject';
    }
    
    if (!formData.summary) {
      newErrors.summary = 'Please enter a summary';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Update the classwork using the API
      if (!token) {
        setError('Authentication token not available');
        return;
      }
      
      const response = await classworkServices.updateClasswork(classwork.id, formData, token);
      
      if (response.status === 'success') {
        // Redirect to classwork list or show success message
        router.push('/classwork');
      } else {
        setError('Failed to update classwork');
      }
    } catch (err) {
      setError('An error occurred while updating classwork');
      console.error('Error updating classwork:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="mb-4"
          >
            ← Back to Classwork
          </Button>
          <h1 className="text-3xl font-bold mb-2">Edit Classwork</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Update the details of your classwork entry
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Classwork Details
              </CardTitle>
              <CardDescription>
                Modify the classwork information and topics covered
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Class Selection */}
              <div className="space-y-2">
                <Label htmlFor="class_division_id">Class</Label>
                <select
                  id="class_division_id"
                  name="class_division_id"
                  value={formData.class_division_id}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select a class</option>
                  {mockClassDivisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
                {errors.class_division_id && (
                  <p className="text-sm text-red-500">{errors.class_division_id}</p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select a subject</option>
                  {commonSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Brief description of what was covered in class"
                  rows={3}
                />
                {errors.summary && (
                  <p className="text-sm text-red-500">{errors.summary}</p>
                )}
              </div>

              {/* Topics Covered */}
              <div className="space-y-2">
                <Label>Topics Covered</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyPress={handleTopicKeyPress}
                      placeholder="Add a topic"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleTopicAdd}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.topics_covered.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.topics_covered.map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleTopicRemove(topic)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
              </div>

              {/* Share with Parents */}
              <div className="flex items-center space-x-2">
                <input
                  id="is_shared_with_parents"
                  name="is_shared_with_parents"
                  type="checkbox"
                  checked={formData.is_shared_with_parents}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_shared_with_parents" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share with Parents
                </Label>
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
                  <>
                    <BookOpen className="h-4 w-4" />
                    Update Classwork
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  );
}