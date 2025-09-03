// src/app/(teacher)/classwork/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, X, BookOpen, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { academicServices } from '@/lib/api/academic';
import { classworkServices } from '@/lib/api/classwork';
import { toast } from '@/hooks/use-toast';
import { TruncatedText } from '@/components/ui/truncated-text';

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
  subject?: string; // Subject for subject teacher assignments
}



export default function CreateClassworkPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    classDivisionId: '',
    subject: '',
    summary: '',
    topics: [] as string[],
    date: new Date().toISOString().split('T')[0], // Default to today

  });
  const [topicInput, setTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignedClasses, setAssignedClasses] = useState<TransformedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Fetch teacher's assigned classes
  const fetchAssignedClasses = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingClasses(true);
      const response = await academicServices.getMyTeacherClasses(token);
      if (response.status === 'success' && response.data) {
        // Filter for only subject teacher assignments
        const subjectTeacherClasses = (response.data.assigned_classes as AssignedClass[]).filter(
          (assignedClass: AssignedClass) => assignedClass.assignment_type === 'subject_teacher'
        );
        
        // Extract unique subjects from subject teacher assignments
        const subjects = [...new Set(
          subjectTeacherClasses
            .map(assignedClass => assignedClass.subject)
            .filter((subject): subject is string => !!subject)
        )];
        setAvailableSubjects(subjects);
        
        // Transform the filtered assigned classes to match the expected format
        const transformedClasses = subjectTeacherClasses.map(assignedClass => ({
          id: assignedClass.class_division_id,
          division: assignedClass.division,
          class_level: {
            name: assignedClass.class_level
          },
          academic_year: {
            year_name: assignedClass.academic_year
          }
        }));
        
        // Filter out duplicates based on ID to prevent React key conflicts
        const uniqueClasses = transformedClasses.filter((classItem, index, self) => 
          index === self.findIndex(c => c.id === classItem.id)
        );
        
        setAssignedClasses(uniqueClasses);
      }
    } catch (error: unknown) {
      console.error('Error fetching assigned classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your assigned classes',
        variant: 'error',
      });
    } finally {
      setLoadingClasses(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAssignedClasses();
    }
  }, [fetchAssignedClasses, token]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleTopicAdd = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()]
      }));
      setTopicInput('');
    }
  };

  const handleTopicRemove = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const handleTopicKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTopicAdd();
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.classDivisionId) newErrors.classDivisionId = 'Please select a class';
    if (!formData.subject) newErrors.subject = 'Please enter a subject';
    if (!formData.summary) newErrors.summary = 'Please enter a summary';
    if (formData.topics.length === 0) newErrors.topics = 'Please add at least one topic';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        class_division_id: formData.classDivisionId,
        subject: formData.subject,
        summary: formData.summary,
        topics_covered: formData.topics,
        date: formData.date,
        is_shared_with_parents: true, // Default to sharing with parents
      };
      
      const response = await classworkServices.createClasswork(payload, token!);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        throw new Error('Unexpected response format from API');
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        throw new Error(response.message || 'Failed to create classwork');
      }

      // Handle successful response
      if ('status' in response && response.status === 'success') {
        toast({
          title: 'Success',
          description: 'Classwork created successfully!',
          variant: 'success',
        });
        router.push('/classwork');
      }
    } catch (error: unknown) {
      console.error('Error creating classwork:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create classwork',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-3xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Classwork
            </Button>
            <h1 className="text-3xl font-bold mb-2">Record Classwork</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Record today&apos;s classwork activities
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Classwork Details</CardTitle>
                    <CardDescription>
                      Fill in the details for today&apos;s classwork
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Class, Subject, Date in one line */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="classDivisionId">Class Division *</Label>
                        <select
                          id="classDivisionId"
                          name="classDivisionId"
                          value={formData.classDivisionId}
                          onChange={handleInputChange}
                          className={`border rounded-md px-3 py-2 w-full ${errors.classDivisionId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Select a class</option>
                          {loadingClasses ? (
                            <option value="">Loading classes...</option>
                          ) : assignedClasses.length === 0 ? (
                            <option value="">No classes assigned</option>
                          ) : (
                            assignedClasses.map(division => (
                              <option key={division.id} value={division.id}>
                                {`${division.class_level?.name || 'Unknown'} - Section ${division.division}`}
                              </option>
                            ))
                          )}
                        </select>
                        {errors.classDivisionId && (
                          <p className="text-sm text-red-500">{errors.classDivisionId}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`border rounded-md px-3 py-2 w-full ${errors.subject ? 'border-red-500' : ''}`}
                          required
                        >
                          <option value="">Select a subject</option>
                          {availableSubjects.length === 0 ? (
                            <option value="">No subjects assigned</option>
                          ) : (
                            availableSubjects.map((subject, index) => (
                              <option key={`${subject}-${index}`} value={subject}>
                                {subject}
                              </option>
                            ))
                          )}
                        </select>
                        {errors.subject && (
                          <p className="text-sm text-red-500">{errors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className={`pl-10 ${errors.date ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.date && (
                          <p className="text-sm text-red-500">{errors.date}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="summary">Summary *</Label>
                      <Textarea
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        placeholder="Brief summary of today&apos;s class activities"
                        rows={4}
                        className={errors.summary ? 'border-red-500' : ''}
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

                    <div className="space-y-2">
                      <Label htmlFor="topics">Topics Covered</Label>
                      <div className="flex gap-2">
                        <Input
                          id="topics"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          onKeyDown={handleTopicKeyPress}
                          placeholder="Add a topic"
                        />
                        <Button type="button" onClick={handleTopicAdd} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.topics.map((topic, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1 text-primary px-3 py-1 text-sm"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{topic}</span>
                            <button 
                              type="button" 
                              onClick={() => handleTopicRemove(topic)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Press Enter or click Add to include topics
                      </p>
                    </div>


                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <BookOpen className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <p>Be specific in your summary to help with future lesson planning.</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Tag className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <p>Add relevant topics to help categorize and search classwork later.</p>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card className="mt-6">
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? 'Recording...' : 'Record Classwork'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}