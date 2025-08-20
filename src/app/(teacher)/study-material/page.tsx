// src/app/(teacher)/resources/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Upload,
  Filter,
  BookOpen,
  File,
  Video,
  Link as LinkIcon,
  Download,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

// Mock data for resources
const mockResources = [
  { 
    id: '1', 
    title: 'Mathematics Chapter 3 Notes', 
    type: 'document', 
    subject: 'Mathematics', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-15',
    fileSize: '2.4 MB'
  },
  { 
    id: '2', 
    title: 'Science Photosynthesis Video', 
    type: 'video', 
    subject: 'Science', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-10',
    fileSize: '45.2 MB'
  },
  { 
    id: '3', 
    title: 'English Grammar Worksheet', 
    type: 'document', 
    subject: 'English', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-05',
    fileSize: '1.1 MB'
  },
  { 
    id: '4', 
    title: 'History Chapter 5 Presentation', 
    type: 'document', 
    subject: 'History', 
    class: 'Grade 5 - Section A', 
    date: '2025-08-01',
    fileSize: '3.7 MB'
  }
];

export default function ResourcesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      // Simulate file upload
      setTimeout(() => {
        setIsUploading(false);
        alert(`File "${files[0].name}" uploaded successfully!`);
      }, 2000);
    }
  };

  // Filter resources based on search term
  const filteredResources = mockResources.filter(resource => 
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Upload and manage learning resources for your classes
              </p>
            </div>
            <div className="relative">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Resource'}
                </label>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Library</CardTitle>
              <CardDescription>
                View and manage your uploaded resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
              
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Resource</th>
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Class</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Size</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((resource) => (
                      <tr key={resource.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(resource.type)}
                            <div>
                              <div className="font-medium">{resource.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{resource.subject}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {resource.class}
                        </td>
                        <td className="p-4">
                          {resource.date}
                        </td>
                        <td className="p-4">
                          {resource.fileSize}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}