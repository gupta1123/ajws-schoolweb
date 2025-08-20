// src/app/(teacher)/classwork/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, BookOpen, Calendar, Share2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { classworkServices } from '@/lib/api/classwork';
import { Classwork } from '@/types/classwork';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  entry: Classwork; 
  onDelete: (id: string) => void;
}) => {
  const SubjectIcon = subjectIcons[entry.subject] || subjectIcons.default;
  const classDisplayName = entry.class_division ? 
    `${entry.class_division.level.name} - Section ${entry.class_division.division}` : 
    'Unknown Class';
  
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
              <p className="text-sm text-gray-600 dark:text-gray-300">{classDisplayName}</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-300">{entry.summary}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {entry.topics_covered.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                {topic}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(entry.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              {entry.is_shared_with_parents ? (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>Shared with parents</span>
                </>
              ) : (
                <span>Not shared</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ClassworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [classwork, setClasswork] = useState<Classwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchClasswork = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await classworkServices.getClasswork(token, currentPage, itemsPerPage, {
        subject: subjectFilter === 'all' ? undefined : subjectFilter,
        class_division_id: classFilter === 'all' ? undefined : classFilter,
      });
      if (response.status === 'success' && response.data) {
        setClasswork(response.data.classwork);
        setTotalItems(response.data.total_count);
      }
    } catch (err: unknown) {
      setError('Failed to fetch classwork');
      toast({
        title: 'Error fetching classwork',
        description: err instanceof Error ? err.message : 'Failed to fetch classwork',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, subjectFilter, classFilter, token]);

  useEffect(() => {
    if (token) {
      fetchClasswork();
    }
  }, [fetchClasswork, token]);

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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await classworkServices.deleteClasswork(id, token);
      toast({
        title: 'Classwork deleted',
        description: 'Classwork entry deleted successfully!',
        variant: 'success',
      });
      fetchClasswork(); // Refresh the list
    } catch (err: unknown) {
      toast({
        title: 'Error deleting classwork',
        description: err instanceof Error ? err.message : 'Failed to delete classwork',
        variant: 'error',
      });
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                    {/* Assuming subjects are fetched from the API or a global list */}
                    {/* For now, we'll use a placeholder or fetch them */}
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                    <option value="PE">PE</option>
                    <option value="Foreign Language">Foreign Language</option>
                  </select>
                  <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm w-full md:w-auto"
                  >
                    <option value="all">All Classes</option>
                    {/* Assuming classes are fetched from the API or a global list */}
                    {/* For now, we'll use a placeholder or fetch them */}
                    <option value="Grade 5 - Section A">Grade 5 - Section A</option>
                    <option value="Grade 6 - Section B">Grade 6 - Section B</option>
                    <option value="Grade 7 - Section C">Grade 7 - Section C</option>
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                  <p className="ml-4 text-gray-500 dark:text-gray-400">Loading classwork...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : classwork.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classwork.map((entry) => (
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
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="mr-2"
                  >
                    Previous
                  </Button>
                  <span className="mx-2 text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}