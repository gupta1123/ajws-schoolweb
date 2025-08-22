// src/app/(admin)/students/page.tsx

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
import { Search, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { studentServices, Student } from '@/lib/api/students';

export default function StudentsPage() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    class_division_id: '',
    class_level_id: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [availableFilters, setAvailableFilters] = useState({
    academic_years: [] as Array<{ id: string; year_name: string }>,
    class_levels: [] as Array<{ id: string; name: string; sequence_number: number }>,
    class_divisions: [] as Array<{
      id: string;
      division: string;
      level: { id: string; name: string };
      teacher: { id: string; full_name: string };
      academic_year: { id: string; year_name: string };
    }>
  });

  // Fetch students data
  const fetchStudents = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentServices.getAllStudents(token, filters);
      
      if (response.status === 'success' && response.data) {
        setStudents(response.data.students);
        setPagination({
          total: response.data.pagination.total,
          total_pages: response.data.pagination.total_pages,
          has_next: response.data.pagination.has_next,
          has_prev: response.data.pagination.has_prev
        });
        
        if (response.data.available_filters) {
          setAvailableFilters(response.data.available_filters);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading && students.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading students...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-8"
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={filters.class_level_id}
              onChange={(e) => handleFilterChange('class_level_id', e.target.value)}
            >
              <option value="">All Classes</option>
              {availableFilters.class_levels?.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
          <Button asChild>
            <Link href="/students/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              List of all students in the school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const currentRecord = student.student_academic_records.find(record => record.status === 'ongoing');
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {currentRecord?.roll_number || 'N/A'}
                        </TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>
                          {currentRecord?.class_division ? 
                            `${currentRecord.class_division.class_level.name} - Section ${currentRecord.class_division.division}` : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/students/${student.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/students/${student.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!pagination.has_prev}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 py-2 text-sm">
                    Page {filters.page} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={!pagination.has_next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}