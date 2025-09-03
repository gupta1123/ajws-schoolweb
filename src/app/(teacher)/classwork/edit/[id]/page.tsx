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
import { Calendar, X, BookOpen, Tag, Loader2 } from 'lucide-react';
import { classworkServices } from '@/lib/api/classwork';
import { academicServices } from '@/lib/api/academic';
import { Classwork } from '@/types/classwork';
import { toast } from '@/hooks/use-toast';
import { TruncatedText } from '@/components/ui/truncated-text';



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

export default function EditClassworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classwork, setClasswork] = useState<Classwork | null>(null);
  const [classDivisions, setClassDivisions] = useState<TransformedClass[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Format class division name for display
  const formatClassName = (division: TransformedClass) => {
    return `${division.class_level?.name || 'Unknown'} - Section ${division.division}`;
  };
  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    summary: '',
    topics_covered: [] as string[],
    date: ''
  });
  const [topicInput, setTopicInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract classwork ID from params and fetch data
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      const { id: classworkIdFromParams } = resolvedParams;
      
      // Fetch classwork data and class divisions for editing
      const fetchData = async () => {
        if (!token || !classworkIdFromParams || !user) return;

        try {
          setLoading(true);
          setError(null);

          // First fetch teacher assignments
          const teacherResponse = await academicServices.getMyTeacherClasses(token);
          if (teacherResponse.status === 'success' && teacherResponse.data) {
            // Filter for only subject teacher assignments
            const subjectTeacherClasses = teacherResponse.data.assigned_classes.filter(
              (assignment: AssignedClass) => assignment.assignment_type === 'subject_teacher'
            );

            // Extract unique subjects
            const subjects = [...new Set(
              subjectTeacherClasses
                .map((assignment: AssignedClass) => assignment.subject)
                .filter((subject: string | undefined): subject is string => !!subject)
            )];
            setAvailableSubjects(subjects);

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

          // Fetch specific classwork data
          const classworkResponse = await classworkServices.getClassworkById(token, classworkIdFromParams);

          // Handle Blob response (shouldn't happen for JSON endpoints)
          if (classworkResponse instanceof Blob) {
            setError('Unexpected response format from API');
            return;
          }

          // Handle error response
          if ('status' in classworkResponse && classworkResponse.status === 'error') {
            setError(classworkResponse.message || 'Failed to fetch classwork');
            return;
          }

          // Handle successful response
          if ('status' in classworkResponse && classworkResponse.status === 'success' && classworkResponse.data?.classwork) {
            const classworkData = classworkResponse.data.classwork;
            setClasswork(classworkData);
            setFormData({
              class_division_id: classworkData.class_division_id,
              subject: classworkData.subject,
              summary: classworkData.summary,
              topics_covered: [...classworkData.topics_covered],
              date: classworkData.date
            });
          } else {
            setError('Classwork not found');
            console.error('API Response:', classworkResponse);
          }
        } catch (err) {
          setError('Failed to load classwork data');
          console.error('Error fetching data:', err);
          toast({
            title: "Error",
            description: "Failed to load classwork data",
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchData();
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
              {/* Class, Subject, Date in one line */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {classDivisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {formatClassName(division)}
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
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject}</p>
                  )}
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
                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                  <span className={formData.summary.length > 200 ? 'text-destructive' : 'text-muted-foreground'}>
                    Characters: {formData.summary.length}
                  </span>
                  <span className={formData.summary.length > 200 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {formData.summary.length > 200 ? 'Text is getting long!' : 'Recommended: Keep under 200 characters for better display'}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      formData.summary.length > 200 
                        ? 'bg-destructive' 
                        : formData.summary.length > 150 
                          ? 'bg-accent' 
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((formData.summary.length / 200) * 100, 100)}%` }}
                  ></div>
                </div>
                </div>
                {errors.summary && (
                  <p className="text-sm text-red-500">{errors.summary}</p>
                )}
                {formData.summary && (
                  <div className="mt-2 p-3 bg-black text-white border border-border rounded-md">
                    <Label className="text-sm font-medium text-white mb-2 block">
                      Preview (as it will appear in the list):
                    </Label>
                    <TruncatedText 
                      text={formData.summary} 
                      maxLines={2} 
                      maxLength={60}
                      className="text-sm text-white"
                    />
                  </div>
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
                          className="flex items-center gap-2 text-primary px-3 py-1 text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleTopicRemove(topic)}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>



              {/* Share with Parents */}

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