// src/app/(admin)/students/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { studentServices, Student } from '@/lib/api/students';
import { classDivisionsServices, ClassDivision as ApiClassDivision } from '@/lib/api/class-divisions';
import { useI18n } from '@/lib/i18n/context';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, IconChip, InlineError, Pill } from '@/components/ui/page-kit';
import { surface, type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

const initialsOf = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function StudentsPage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canAccess = user?.role === 'admin' || user?.role === 'principal';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    class_division_id: searchParams.get('class_division_id') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 20
  });
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [classDivisionsList, setClassDivisionsList] = useState<ApiClassDivision[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);
  const studentTotalCount = pagination?.total ?? (students.length > 0 ? students.length : null);
  const isStudentTotalLoading = loading && studentTotalCount === null;

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

  // Sync filters with URL params when they change (e.g., when navigating back)
  useEffect(() => {
    const urlClassId = searchParams.get('class_division_id') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    
    if (urlClassId !== filters.class_division_id || urlSearch !== filters.search || urlPage !== filters.page) {
      setFilters({
        search: urlSearch,
        class_division_id: urlClassId,
        page: urlPage,
        limit: 20
      });
      
      // Set academic year ID if class_division_id is in URL
      if (urlClassId && classDivisionsList.length > 0) {
        const selectedDivision = classDivisionsList.find(d => d.id === urlClassId);
        if (selectedDivision?.academic_year_id) {
          setSelectedAcademicYearId(selectedDivision.academic_year_id);
        }
      } else if (!urlClassId) {
        setSelectedAcademicYearId(undefined);
      }
    }
  }, [searchParams, classDivisionsList]);

  // Fetch class divisions list for filter
  useEffect(() => {
    const loadClassDivisions = async () => {
      if (!token) return;
      try {
        const response = await classDivisionsServices.getClassDivisions(token);
        if (response.status === 'success') {
          setClassDivisionsList(response.data.class_divisions);
          // Set academic year ID if class_division_id is in URL
          const urlClassId = searchParams.get('class_division_id') || '';
          if (urlClassId) {
            const selectedDivision = response.data.class_divisions.find(d => d.id === urlClassId);
            if (selectedDivision?.academic_year_id) {
              setSelectedAcademicYearId(selectedDivision.academic_year_id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load class divisions', err);
      }
    };
    loadClassDivisions();
  }, [token, searchParams]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const newFilters = { ...filters, search: e.target.value, page: 1 };
    setFilters(newFilters);
    
    // Update URL params for search
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/students?${params.toString()}`, { scroll: false });
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    // Trigger immediate skeleton state on class/division change
    if (filterType === 'class_division_id') {
      setLoading(true);
      const ayId = value ? classDivisionsList.find(d => d.id === value)?.academic_year_id : undefined;
      setSelectedAcademicYearId(ayId);
    }
    
    const newFilters = { ...filters, [filterType]: value, page: 1 };
    setFilters(newFilters);
    
    // Update URL params to persist filter state
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(filterType, value);
    } else {
      params.delete(filterType);
    }
    // Reset page to 1 when filter changes
    params.set('page', '1');
    router.push(`/students?${params.toString()}`, { scroll: false });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    
    // Update URL params for pagination
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/students?${params.toString()}`, { scroll: false });
  };

  // Only allow admins and principals to access this page
  if (!canAccess) {
    return (
      <EmptyState
        title={t('access.deniedTitle', 'Access Denied')}
        help={t('access.adminsOnly', 'Only admins and principals can access this page.')}
      />
    );
  }

  const classLabelOf = (record?: Student['student_academic_records'][number]) => {
    const division = record?.class_division;
    if (!division) return null;
    return division.class_level?.name
      ? `${division.class_level.name} - ${t('timetable.section')} ${division.division}`
      : `${t('timetable.section')} ${division.division}`;
  };

  const hasFilters = !!(filters.search || filters.class_division_id);
  const detailQuery = filters.class_division_id ? `?class_division_id=${filters.class_division_id}` : '';
  const rowGrid = 'grid items-center gap-x-3 px-4 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,12rem)_auto] grid-cols-[minmax(0,1fr)_auto]';

  const clearFilters = () => {
    setFilters((f) => ({ ...f, search: '', class_division_id: '', page: 1 }));
    setSelectedAcademicYearId(undefined);
    router.push('/students', { scroll: false });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('students.searchPlaceholder', 'Search students...')}
              className="pl-8"
              value={filters.search}
              onChange={handleSearchChange}
              aria-label={t('students.searchPlaceholder', 'Search students...')}
            />
          </div>
          <select
            className="h-9 max-w-[14rem] rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            value={filters.class_division_id}
            onChange={(e) => handleFilterChange('class_division_id', e.target.value)}
            aria-label={t('students.allClasses', 'All Classes/Divisions')}
          >
            <option value="">{t('students.allClasses', 'All Classes/Divisions')}</option>
            {classDivisionsList.map((div) => (
              <option key={div.id} value={div.id}>
                {div.class_level?.name} - {t('timetable.section')} {div.division}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <X className="size-3.5" />
              {t('students.clearFilters', 'Clear filters')}
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {isStudentTotalLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              studentTotalCount !== null && (
                <span className={cn(type.caption, 'tabular-nums')}>
                  {studentTotalCount.toLocaleString()} {t('students.countLabel', 'students')}
                </span>
              )
            )}
            <Button asChild size="sm">
              <Link href="/students/create">
                <Plus />
                {t('students.addStudent')}
              </Link>
            </Button>
          </div>
        </div>

        {error && <InlineError title={error} />}

        {/* Student list */}
        <section className={cn(surface.panel, 'overflow-hidden')}>
          <div
            className={cn(
              rowGrid,
              'hidden border-b bg-muted/40 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid'
            )}
          >
            <span>{t('students.cols.rollNo')}</span>
            <span>{t('students.cols.name')}</span>
            <span>{t('students.cols.class')}</span>
            <span className="text-right">{t('students.cols.actions')}</span>
          </div>

          {loading ? (
            <ul className="divide-y">
              {Array.from({ length: 8 }).map((_, idx) => (
                <li key={idx} className={cn(rowGrid, 'py-3')}>
                  <Skeleton className="hidden h-4 w-8 sm:block" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-5 w-28 rounded-full sm:block" />
                  <Skeleton className="h-8 w-16" />
                </li>
              ))}
            </ul>
          ) : students.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={hasFilters ? t('students.emptyFiltered') : t('students.empty')}
              help={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="font-medium text-primary hover:underline">
                    {t('students.clearFilters', 'Clear filters')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y">
              {students.map((student) => {
                const record = student.student_academic_records.find((r) => r.status === 'ongoing');
                const classLabel = classLabelOf(record);
                return (
                  <li key={student.id} className={cn(rowGrid, 'py-2.5', surface.rowHover)}>
                    <span className="hidden text-sm font-medium tabular-nums text-muted-foreground sm:block">
                      {record?.roll_number || t('students.na', 'N/A')}
                    </span>

                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip className="size-8 rounded-full text-xs font-semibold">
                        {initialsOf(student.full_name)}
                      </IconChip>
                      <div className="min-w-0">
                        <Link
                          href={`/students/${student.id}${detailQuery}`}
                          className={cn(type.rowTitle, 'block truncate hover:text-primary hover:underline')}
                        >
                          {student.full_name}
                        </Link>
                        <p className={cn(type.caption, 'truncate')}>
                          {student.admission_number}
                          <span className="sm:hidden">
                            {record?.roll_number ? ` · ${t('students.cols.rollNo')} ${record.roll_number}` : ''}
                            {classLabel ? ` · ${classLabel}` : ''}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="hidden min-w-0 sm:block">
                      {classLabel ? (
                        <Pill tone="primary" className="max-w-full truncate">
                          {classLabel}
                        </Pill>
                      ) : (
                        <span className={type.caption}>{t('students.na', 'N/A')}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/students/${student.id}${detailQuery}`}>{t('actions.view', 'View')}</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
              <p className={cn(type.caption, 'tabular-nums')}>
                {t('pagination.showing', 'Showing')} {(filters.page - 1) * filters.limit + 1} {t('pagination.to', 'to')}{' '}
                {Math.min(filters.page * filters.limit, pagination.total)} {t('pagination.of', 'of')} {pagination.total}{' '}
                {t('pagination.results', 'results')}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1}>
                  {t('pagination.previous', 'Previous')}
                </Button>
                <span className={cn(type.caption, 'tabular-nums')}>
                  {filters.page} / {pagination.total_pages}
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
        </section>
      </div>
    </ProtectedRoute>
  );
}
