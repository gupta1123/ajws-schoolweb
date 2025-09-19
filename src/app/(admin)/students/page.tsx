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
import { useState, useEffect, useCallback, useRef } from 'react';
import { studentServices, Student } from '@/lib/api/students';
import { classDivisionsServices, ClassDivision as ApiClassDivision } from '@/lib/api/class-divisions';
import { useI18n } from '@/lib/i18n/context';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsPage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    class_division_id: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [classDivisionsList, setClassDivisionsList] = useState<ApiClassDivision[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);

  // Debounced search to reduce API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(handle);
  }, [filters.search]);

  // Track and cancel in-flight requests to avoid stale overwrites
  const latestRequestIdRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);

  // Fetch students from backend with filters
  const fetchStudents = useCallback(async () => {
    if (!token) return;

    // Cancel any in-flight request
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;
    const requestId = ++latestRequestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const response = await studentServices.getAllStudents(token, {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch || undefined,
        class_division_id: filters.class_division_id || undefined,
        // API expects `academic_year` param; client maps academic_year_id -> academic_year
        academic_year_id: selectedAcademicYearId,
        signal: controller.signal,
      });

      // Ignore if a newer request has started since this one
      if (requestId !== latestRequestIdRef.current) return;

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
        setStudents(response.data.students);
        if ('pagination' in response.data && response.data.pagination) {
          setPagination(response.data.pagination as { page: number; limit: number; total: number; total_pages: number });
        }
      }
    } catch (err: unknown) {
      // Ignore abort errors
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
      console.error('Error fetching students:', err);
    } finally {
      // Only clear loading for the latest request
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [token, filters.page, filters.limit, debouncedSearch, filters.class_division_id, selectedAcademicYearId]);

  // Fetch students when token, filters, or class divisions change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Cleanup on unmount: abort any in-flight request
  useEffect(() => {
    return () => {
      try { activeAbortRef.current?.abort(); } catch {}
    };
  }, []);

  // Fetch class divisions list for filter
  useEffect(() => {
    const loadClassDivisions = async () => {
      if (!token) return;
      try {
        const response = await classDivisionsServices.getClassDivisions(token);
        if (response.status === 'success') {
          setClassDivisionsList(response.data.class_divisions);
        }
      } catch (err) {
        console.warn('Failed to load class divisions', err);
      }
    };
    loadClassDivisions();
  }, [token]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    // Trigger immediate skeleton state on class/division change
    if (filterType === 'class_division_id') {
      setLoading(true);
      const ayId = value ? classDivisionsList.find(d => d.id === value)?.academic_year_id : undefined;
      setSelectedAcademicYearId(ayId);
    }
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
              value={filters.class_division_id}
              onChange={(e) => handleFilterChange('class_division_id', e.target.value)}
            >
              <option value="">{t('students.allClasses', 'All Classes/Divisions')}</option>
              {classDivisionsList.map(div => (
                <option key={div.id} value={div.id}>
                  {div.class_level?.name} - {t('timetable.section')} {div.division}
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
                  {loading ? (
                    // Skeleton loading state while refetching due to filter change
                    Array.from({ length: Math.min(8, filters.limit) }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`}>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {filters.search || filters.class_division_id 
                          ? t('students.emptyFiltered')
                          : t('students.empty')
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => {
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
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  {t('pagination.showing', 'Showing')} {((filters.page - 1) * filters.limit) + 1} {t('pagination.to', 'to')} {Math.min(filters.page * filters.limit, pagination.total)} {t('pagination.of', 'of')} {pagination.total} {t('pagination.results', 'results')}
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
                    {t('pagination.page', 'Page')} {filters.page} {t('pagination.of', 'of')} {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= (pagination?.total_pages || 1)}
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
