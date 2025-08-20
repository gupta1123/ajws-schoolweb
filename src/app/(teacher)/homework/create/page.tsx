// src/app/(teacher)/homework/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock data for class divisions
const mockClassDivisions = [
  { id: '1', name: 'Grade 5 - Section A' },
  { id: '2', name: 'Grade 6 - Section B' },
  { id: '3', name: 'Grade 7 - Section C' }
];

export default function CreateHomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    classDivisionId: '',
    subject: '',
    title: '',
    description: '',
    dueDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/homework');
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-2xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Homework
            </Button>
            <h1 className="text-3xl font-bold mb-2">Create Homework</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Create a new homework assignment for your class
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Homework Details</CardTitle>
                <CardDescription>
                  Fill in the details for the homework assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classDivisionId">Class Division</Label>
                  <select
                    id="classDivisionId"
                    name="classDivisionId"
                    value={formData.classDivisionId}
                    onChange={handleInputChange}
                    className="border rounded-md px-3 py-2 w-full"
                    required
                  >
                    <option value="">Select a class</option>
                    {mockClassDivisions.map(division => (
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
                    onChange={handleInputChange}
                    placeholder="e.g., Mathematics, Science, English"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Chapter 3 Exercises"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter homework description and instructions"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Homework'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}