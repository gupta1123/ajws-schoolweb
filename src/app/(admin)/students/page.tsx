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
import { useI18n } from '@/lib/i18n/context';

export default function StudentsPage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [students] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    class_level_id: '',
    page: 1,
    limit: 50
  });
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
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

  // Fetch all students data once
  const fetchStudents = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all students without pagination
      const response = await studentServices.getAllStudents(token, { limit: 1000 });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Failed to fetch students');
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        setAllStudents(response.data.students);
        setFilteredStudents(response.data.students);

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
  }, [token]);

  // Fetch students on component mount only
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Apply frontend filtering when filters change
  useEffect(() => {
    let filtered = allStudents;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchLower) ||
        student.admission_number.toLowerCase().includes(searchLower)
      );
    }

    // Apply class level filter
    if (filters.class_level_id) {
      filtered = filtered.filter(student => {
        const currentRecord = student.student_academic_records.find(record => record.status === 'ongoing');
        return currentRecord?.class_division?.class_level?.id === filters.class_level_id;
      });
    }

    setFilteredStudents(filtered);
    // Reset to first page when filters change
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [allStudents, filters.search, filters.class_level_id]);

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
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
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
            <span className="ml-2">{t('students.loading', 'Loading students...')}</span>
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
                placeholder={t('students.searchPlaceholder', 'Search students...')} 
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
              <option value="">{t('students.allClasses', 'All Classes')}</option>
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
              {t('students.addStudent')}
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
            <CardTitle>{t('students.listTitle')}</CardTitle>
            <CardDescription>
              {t('students.listSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('students.cols.rollNo')}</TableHead>
                    <TableHead>{t('students.cols.name')}</TableHead>
                    <TableHead>{t('students.cols.class')}</TableHead>
                    <TableHead className="text-right">{t('students.cols.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {filters.search || filters.class_level_id 
                          ? t('students.emptyFiltered')
                          : t('students.empty')
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents
                      .slice((filters.page - 1) * filters.limit, filters.page * filters.limit)
                      .map((student) => {
                      const currentRecord = student.student_academic_records.find(record => record.status === 'ongoing');
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {currentRecord?.roll_number || t('students.na', 'N/A')}
                          </TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>
                            {currentRecord?.class_division?.class_level?.name ? 
                              `${currentRecord.class_division.class_level.name} - ${t('timetable.section')} ${currentRecord.class_division.division}` : 
                              currentRecord?.class_division ? 
                                `${t('timetable.section')} ${currentRecord.class_division.division}` :
                                t('students.na', 'N/A')
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" asChild>
                              <Link href={`/students/${student.id}`}>
                                {t('actions.view', 'View')}
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/students/${student.id}/edit`}>
                                {t('actions.edit', 'Edit')}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredStudents.length / filters.limit) > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  {t('pagination.showing', 'Showing')} {((filters.page - 1) * filters.limit) + 1} {t('pagination.to', 'to')} {Math.min(filters.page * filters.limit, filteredStudents.length)} {t('pagination.of', 'of')} {filteredStudents.length} {t('pagination.results', 'results')}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1}
                  >
                    {t('pagination.previous', 'Previous')}
                  </Button>
                  <span className="flex items-center px-3 py-2 text-sm">
                    {t('pagination.page', 'Page')} {filters.page} {t('pagination.of', 'of')} {Math.ceil(filteredStudents.length / filters.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= Math.ceil(filteredStudents.length / filters.limit)}
                  >
                    {t('pagination.next', 'Next')}
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
