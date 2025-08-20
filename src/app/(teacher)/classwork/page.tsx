// src/app/(teacher)/classwork/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, BookOpen, Calendar, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Mock data for classwork entries
const mockClasswork = [
  {
    id: '1',
    class: 'Grade 5 - Section A',
    subject: 'Mathematics',
    summary: 'Introduction to Fractions',
    topics: ['Fractions', 'Numerators', 'Denominators'],
    date: '2025-08-15',
    sharedWithParents: true
  },
  {
    id: '2',
    class: 'Grade 6 - Section B',
    subject: 'Science',
    summary: 'Photosynthesis Process',
    topics: ['Photosynthesis', 'Chlorophyll', 'Sunlight'],
    date: '2025-08-14',
    sharedWithParents: false
  },
  {
    id: '3',
    class: 'Grade 7 - Section C',
    subject: 'English',
    summary: 'Poetry Analysis',
    topics: ['Poetry', 'Rhyme', 'Metaphor'],
    date: '2025-08-12',
    sharedWithParents: true
  }
];

// Subject icon mapping
const subjectIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Mathematics: BookOpen,
  Science: BookOpen,
  English: BookOpen,
  History: BookOpen,
  Geography: BookOpen,
  Art: BookOpen,
  Music: BookOpen,
  PE: BookOpen,
  'Foreign Language': BookOpen,
  default: BookOpen
};

// Classwork card component
const ClassworkCard = ({ 
  entry,
  onDelete
}: { 
  entry: typeof mockClasswork[0]; 
  onDelete: (id: string) => void;
}) => {
  const SubjectIcon = subjectIcons[entry.subject] || subjectIcons.default;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <SubjectIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <CardTitle className="text-lg">{entry.subject}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">{entry.class}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/classwork/edit/${entry.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{entry.summary}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {entry.topics.join(', ')}
            </p>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{entry.date}</span>
            </div>
            {entry.sharedWithParents ? (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Share2 className="h-4 w-4" />
                <span>Shared</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="h-4 w-4" />
                <span>Private</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ClassworkPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  // Filter classwork based on search term and filters
  const filteredClasswork = mockClasswork.filter(entry => 
    (searchTerm === '' || 
     entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
     entry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
     entry.class.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (subjectFilter === 'all' || entry.subject === subjectFilter) &&
    (classFilter === 'all' || entry.class === classFilter)
  );

  const handleDelete = (id: string) => {
    // Here you would typically send the delete request to your API
    console.log(`Deleting classwork with id: ${id}`);
    // Update the UI to reflect the deletion
    alert(`Classwork entry deleted successfully!`);
  };

  // Get unique subjects and classes for filters
  const subjects = Array.from(new Set(mockClasswork.map(entry => entry.subject)));
  const classes = Array.from(new Set(mockClasswork.map(entry => entry.class)));

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Classwork</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Record and manage classwork entries for your classes
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/classwork/create">
                <Plus className="mr-2 h-4 w-4" />
                Record Classwork
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Classwork Entries</CardTitle>
              <CardDescription>
                List of classwork entries you&apos;ve recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search classwork..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <select 
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {filteredClasswork.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClasswork.map((entry) => (
                    <ClassworkCard 
                      key={entry.id} 
                      entry={entry} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No classwork entries found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm || subjectFilter !== 'all' || classFilter !== 'all' 
                      ? 'Try adjusting your filters or search term' 
                      : 'Get started by recording your first classwork entry'}
                  </p>
                  {!(searchTerm || subjectFilter !== 'all' || classFilter !== 'all') && (
                    <Button asChild>
                      <Link href="/classwork/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Record Classwork
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}