// src/app/(teacher)/homework/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/stat-card';

import { homeworkServices } from '@/lib/api/homework';
import { Homework } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function HomeworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);

  // Fetch homework data from API
  useEffect(() => {
    const fetchHomework = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          console.log('No token available, skipping API call');
          return;
        }
        
        const response = await homeworkServices.getHomework(token);
        if (response.status === 'success' && response.data) {
          setHomework(response.data.homework);
          setFilteredHomework(response.data.homework);
        }
      } catch (error) {
        console.error('Error fetching homework:', error);
        toast({
          title: "Error",
          description: "Failed to fetch homework data",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHomework();
    } else {
      console.log('No token available, skipping API call');
    }
  }, [token]);

  // Filter homework based on search term and filters
  useEffect(() => {
    const filtered = homework.filter(assignment => 
      (assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${assignment.class_division.level.name} - Section ${assignment.class_division.division}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedSubject === 'all' || assignment.subject === selectedSubject) &&
      (selectedClass === 'all' || `${assignment.class_division.level.name} - Section ${assignment.class_division.division}` === selectedClass)
    );
    setFilteredHomework(filtered);
  }, [homework, searchTerm, selectedSubject, selectedClass]);

  // Debug: Log authentication state
  console.log('Auth state:', { user, token: !!token, isAuthenticated, authLoading });

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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
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
      <div className="flex items-center justify-center h-full">
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
      const response = await homeworkServices.deleteHomework(id, token || '');
      if (response.status === 'success') {
        setHomework(prev => prev.filter(hw => hw.id !== id));
        toast({
          title: "Success",
          description: "Homework assignment deleted successfully!",
        });
      }
    } catch (error) {
      console.error('Error deleting homework:', error);
        toast({
          title: "Error",
          description: "Failed to delete homework assignment",
          variant: "error",
        });
    }
  };

  // Calculate summary statistics
  const totalAssignments = homework.length;
  const completedAssignments = homework.filter(hw => {
    const dueDate = new Date(hw.due_date);
    const now = new Date();
    return dueDate < now;
  }).length;
  
  // For now, we'll use placeholder values since the API doesn't provide submission rates and scores
  const avgSubmissionRate = 75; // Placeholder
  const avgScore = 82; // Placeholder

  // Get unique subjects and classes for filters
  const subjects = Array.from(new Set(homework.map(hw => hw.subject)));
  const classes = Array.from(new Set(homework.map(hw => 
    `${hw.class_division.level.name} - Section ${hw.class_division.division}`
  )));

  // Date formatting is now handled by the formatDate utility function from @/lib/utils



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading homework...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Homework</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create and manage homework assignments for your classes
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/homework/create">
                <Plus className="mr-2 h-5 w-5" />
                Create Homework
              </Link>
            </Button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assignments"
            value={totalAssignments}
            description="Across all classes"
            icon={<BookOpen className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Completed"
            value={completedAssignments}
            description="Fully graded assignments"
            trend="up"
            trendValue="+12%"
            icon={<CheckCircle className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Avg. Submission"
            value={`${avgSubmissionRate}%`}
            description="Across all assignments"
            trend="up"
            trendValue="+3.2%"
            icon={<Clock className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Avg. Score"
            value={`${avgScore}%`}
            description="Class average"
            trend="neutral"
            trendValue="Stable"
            icon={<TrendingUp className="h-5 w-5" />}
            className="hover:shadow-md transition-shadow"
          />
        </div>



        <div className="grid gap-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search homework..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Homework Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Homework Assignments</CardTitle>
              <CardDescription>
                List of homework assignments you&apos;ve created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHomework.map((assignment) => (
                      <TableRow key={assignment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {assignment.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.title}</div>
                            <div className="text-sm text-muted-foreground">{assignment.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{`${assignment.class_division.level.name} - Section ${assignment.class_division.division}`}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(assignment.due_date)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/homework/edit/${assignment.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredHomework.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No homework found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No homework matches your search.' : 'You haven\'t created any homework yet.'}
                  </p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/homework/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Homework
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}