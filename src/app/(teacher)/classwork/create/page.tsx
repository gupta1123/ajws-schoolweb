// src/app/(teacher)/classwork/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, X, BookOpen, Share2, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock data for class divisions
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

export default function CreateClassworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    classDivisionId: '',
    subject: '',
    summary: '',
    topics: [] as string[],
    date: new Date().toISOString().split('T')[0], // Default to today
    shareWithParents: false
  });
  const [topicInput, setTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.classDivisionId) {
      newErrors.classDivisionId = 'Please select a class';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/classwork');
    }, 1000);
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
                        {mockClassDivisions.map(division => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                      {errors.classDivisionId && (
                        <p className="text-sm text-red-500">{errors.classDivisionId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="e.g., Mathematics, Science, English"
                          className={errors.subject ? 'border-red-500' : ''}
                          list="common-subjects"
                        />
                        <datalist id="common-subjects">
                          {commonSubjects.map(subject => (
                            <option key={subject} value={subject} />
                          ))}
                        </datalist>
                      </div>
                      {errors.subject && (
                        <p className="text-sm text-red-500">{errors.subject}</p>
                      )}
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
                      {errors.summary && (
                        <p className="text-sm text-red-500">{errors.summary}</p>
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
                            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{topic}</span>
                            <button 
                              type="button" 
                              onClick={() => handleTopicRemove(topic)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Press Enter or click Add to include topics
                      </p>
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
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sharing Options</CardTitle>
                    <CardDescription>
                      Control who can see this classwork
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-2">
                      <input
                        id="shareWithParents"
                        name="shareWithParents"
                        type="checkbox"
                        checked={formData.shareWithParents}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <Label htmlFor="shareWithParents" className="font-medium">
                          Share with parents
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          When enabled, parents will be notified about this classwork.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
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
                    <div className="flex items-start gap-2 text-sm">
                      <Share2 className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <p>Sharing with parents helps keep them informed about class activities.</p>
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