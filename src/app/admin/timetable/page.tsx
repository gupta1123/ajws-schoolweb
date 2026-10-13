// src/app/admin/timetable/page.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { timetableApi, TimetableConfig, TimetableEntry, ClassDivisionTeachersResponse } from '@/lib/api/timetable';
import { classDivisionsServices, ClassDivision } from '@/lib/api/class-divisions';
import { academicServices } from '@/lib/api/academic';
import { apiClient } from '@/lib/api/client';
import { AcademicYear } from '@/types/academic';
import { TimetableGrid, periodStartTime, subjectSoft, subjectText } from '@/components/timetable/timetable-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableSubjectDropdown } from '@/components/ui/searchable-subject-dropdown';
import { SearchableClassDropdown } from '@/components/ui/searchable-class-dropdown';
import { SearchableTeacherDropdown } from '@/components/ui/searchable-teacher-dropdown';
import { Calendar, ChevronDown, Plus, Edit, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

// Error response interfaces
interface TimetableErrorResponse {
  status: 'error';
  message: string;
  error_code?: string;
  details?: string;
  suggestion?: string;
  constraint_violated?: string;
  conflict_data?: {
    existing_subject?: string;
    class_division_id?: string;
    period_number?: number;
    day_of_week?: number;
  };
}

// Only allow admins and principals to access this page
function AccessDenied() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
        <p className="text-gray-600">{t('access.adminsOnlySection', 'Only admins and principals can access this section.')}</p>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<TimetableConfig | null>(null);
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classDivisionTeachers, setClassDivisionTeachers] = useState<ClassDivisionTeachersResponse['data']['teachers']>([]);
  const [classDivisionSubjects, setClassDivisionSubjects] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetableData, setTimetableData] = useState<Record<string, TimetableEntry[]>>({});

  // UI states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TimetableConfig | null>(null);
  const [entryError, setEntryError] = useState<{
    type: string;
    title: string;
    message: string;
    suggestion?: string;
    constraint?: string | {
      existing_subject?: string;
      class_division_id?: string;
      period_number?: number;
      day_of_week?: number;
    };
  } | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);
  const modalCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close modal when teacher conflict error occurs
  useEffect(() => {
    if (entryError && (entryError.type === 'teacher_conflict' || entryError.type === 'class_conflict') && showEntryDialog) {
      // Clear any existing timeout
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }

      // Show error alert
      setShowErrorAlert(true);

      // Auto-close modal after 5 seconds (increased for better UX)
      modalCloseTimeoutRef.current = setTimeout(() => {
        console.log(`Auto-closing modal due to ${entryError.type}`);
        setShowEntryDialog(false);
        setShowErrorAlert(false);
        setEntryError(null);
      }, 5000);
    }

    // Cleanup timeout on unmount
    return () => {
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }
    };
  }, [entryError, showEntryDialog]);


  // Form states
  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    academic_year_id: '',
    total_periods: 8,
    days_per_week: 5
  });

  const [entryForm, setEntryForm] = useState({
    config_id: '',
    class_division_id: '',
    period_number: 1,
    day_of_week: 1,
    subject: '',
    teacher_id: ''
  });

  // Define all hooks before any conditional logic
  const loadConfigs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await timetableApi.getConfigs(token, undefined);
      if (response.status === 'success') {
        setConfigs(response.data.configs);
        // Auto-select the first active config
        const activeConfig = response.data.configs.find(c => c.is_active);
        if (activeConfig) {
          setSelectedConfig(activeConfig);
          setEntryForm(prev => ({ ...prev, config_id: activeConfig.id }));
        }
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  }, [token]);

  const loadClassDivisions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await classDivisionsServices.getClassDivisions(token);
      if (response.status === 'success') {
        setClassDivisions(response.data.class_divisions);
      }
    } catch (error) {
      console.error('Error loading class divisions:', error);
    }
  }, [token]);

  const loadAcademicYears = useCallback(async () => {
    if (!token) return;
    try {
      // First try to get the active academic year
      const activeResponse = await academicServices.getActiveAcademicYear(token);
      if (activeResponse.status === 'success') {
        const activeYear = activeResponse.data.academic_year;
        setConfigForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
        setAcademicYears([activeYear]);
      } else {
        // If no active year, get all academic years
        const allResponse = await academicServices.getAcademicYears(token);
        if (allResponse.status === 'success') {
          setAcademicYears(allResponse.data.academic_years);
          // Set the first active year as default, or first year if none active
          const activeYear = allResponse.data.academic_years.find(y => y.is_active) ||
                           allResponse.data.academic_years[0];
          if (activeYear) {
            setConfigForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  }, [token]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfigs(),
        loadClassDivisions(),
        loadAcademicYears()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadConfigs, loadClassDivisions, loadAcademicYears]);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token, loadInitialData]);

  const loadTimetableData = async (classDivisionId: string) => {
    if (!token || !selectedConfig) return;
    try {
      setLoading(true);

      // Load timetable data, teachers, and subjects in parallel
      const [timetableResponse, teachersResponse, subjectsResponse] = await Promise.all([
        timetableApi.getEntries(classDivisionId, token, selectedConfig.academic_year_id),
        timetableApi.getClassDivisionTeachers(classDivisionId, token),
        // Load subjects using the academic API
        apiClient.get(`/api/academic/class-divisions/${classDivisionId}/subjects`, token)
      ]);

      if (timetableResponse.status === 'success') {
        setTimetableData(timetableResponse.data.timetable);
      }

      if (teachersResponse.status === 'success') {
        setClassDivisionTeachers(teachersResponse.data.teachers);
      }

      // Handle subjects response
      if (subjectsResponse && typeof subjectsResponse === 'object' && 'status' in subjectsResponse && subjectsResponse.status === 'success') {
        setClassDivisionSubjects((subjectsResponse as { data: { subjects?: Array<{id: string, name: string, code: string}> } }).data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading timetable data:', error);
      toast({
        title: t('timetable.toasts.error'),
        description: t('timetable.toasts.failedToLoad'),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!token) return;

    // Validate required fields
    if (!configForm.name.trim()) {
      toast({
        title: t('timetable.toasts.error'),
        description: t('timetable.validation.configNameRequired'),
        variant: "error",
      });
      return;
    }

    if (!configForm.academic_year_id) {
      toast({
        title: t('timetable.toasts.error'),
        description: t('timetable.validation.selectAcademicYear'),
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await timetableApi.createConfig(configForm, token);

      if (response && typeof response === 'object' && 'status' in response) {
        if (response.status === 'success') {
          toast({
            title: t('timetable.toasts.success'),
            description: t('timetable.toasts.configCreated'),
          });
          setShowConfigDialog(false);
          setConfigForm({
            name: '',
            description: '',
            academic_year_id: configForm.academic_year_id, // Keep the current academic year
            total_periods: 8,
            days_per_week: 5
          });
          await loadConfigs();
        } else if (response.status === 'error' && 'message' in response) {
          // Handle case where configuration already exists
          if (response.message.includes('already exists')) {
            toast({
              title: t('timetable.toasts.configExists'),
              description: response.message,
            });
            setShowConfigDialog(false);
            await loadConfigs(); // Refresh to show existing config
          } else {
            toast({
              title: t('timetable.toasts.error'),
              description: response.message,
              variant: "error",
            });
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      console.error('Error creating configuration:', error);

      // Handle network errors or other exceptions
      const errorMessage = error instanceof Error ? error.message : 'Failed to create configuration';
      if (errorMessage.includes('already exists')) {
        toast({
          title: t('timetable.toasts.configExists'),
          description: errorMessage,
        });
        setShowConfigDialog(false);
        await loadConfigs(); // Refresh to show existing config
      } else {
        toast({
          title: t('timetable.toasts.error'),
          description: errorMessage,
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!token || !editingConfig) return;

    // Validate required fields
    if (!configForm.name.trim()) {
      toast({
        title: "Error",
        description: "Configuration name is required",
        variant: "error",
      });
      return;
    }

    if (!configForm.academic_year_id) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await timetableApi.updateConfig(editingConfig.id, {
        name: configForm.name,
        description: configForm.description,
        total_periods: configForm.total_periods,
        days_per_week: configForm.days_per_week
      }, token);

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Configuration updated successfully",
        });
        setShowConfigDialog(false);
        setEditingConfig(null);
        await loadConfigs();
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await timetableApi.createEntry(entryForm, token);

      // Debug: Log the response to understand its structure
      console.log('Timetable create entry response:', response);

      // Check if response indicates teacher conflict (might be in response.data instead of throwing error)
      if (response.status === 'error' &&
          (response.error_code === 'TEACHER_CONFLICT_DB' ||
           response.message?.includes('Teacher schedule conflict'))) {

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'teacher_conflict',
          title: t('timetable.teacherConflict', 'Teacher Schedule Conflict'),
          message: typeof response.details === 'string' ? response.details : 'This teacher is already assigned to another class during the same period and day.',
          suggestion: typeof response.suggestion === 'string' ? response.suggestion : 'Please choose a different teacher, period, or day for this assignment.',
          constraint: response.constraint_violated
        });

        // Show toast notification
        const errorDetails = typeof response.details === 'string' ? response.details : "This teacher is already assigned to another class during the same period and day";
        const errorSuggestion = typeof response.suggestion === 'string' ? response.suggestion : "Please choose a different teacher, period, or day for this assignment.";

        toast({
          title: t('timetable.teacherConflict', 'Teacher Schedule Conflict'),
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

        return; // Exit early, don't process as success
      }

      // Check if response indicates class conflict
      if (response.status === 'error' &&
          ((response as TimetableErrorResponse).error_code === 'CLASS_CONFLICT' ||
           response.message?.includes('Class schedule conflict'))) {

        // Extract error details from the response
        const errorResponse = response as TimetableErrorResponse;
        const errorDetails = typeof errorResponse.details === 'string' 
          ? errorResponse.details 
          : typeof response.message === 'string' 
            ? response.message 
            : 'This class already has a subject assigned for this period and day.';
        const errorSuggestion = typeof errorResponse.suggestion === 'string' 
          ? errorResponse.suggestion 
          : 'Please choose a different period or day, or update the existing entry.';

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'class_conflict',
          title: t('timetable.classConflict', 'Class Schedule Conflict'),
          message: errorDetails,
          suggestion: errorSuggestion,
          constraint: errorResponse.conflict_data
        });

        // Show toast notification
        toast({
          title: t('timetable.classConflict', 'Class Schedule Conflict'),
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

        return; // Exit early, don't process as success
      }

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Timetable entry created successfully",
        });
        setShowEntryDialog(false);
        setEntryForm(prev => ({
          ...prev,
          period_number: 1,
          day_of_week: 1,
          subject: '',
          teacher_id: ''
        }));
        if (selectedClass) {
          await loadTimetableData(selectedClass);
        }
      }
    } catch (error: unknown) {
      console.error('Error creating timetable entry:', error);

      // Check if it's a teacher conflict error in the caught error
      const errorObj = error as TimetableErrorResponse;
      if (errorObj?.error_code === 'TEACHER_CONFLICT_DB' ||
          (error instanceof Error && error.message?.includes('Teacher schedule conflict'))) {

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'teacher_conflict',
          title: t('timetable.teacherConflict', 'Teacher Schedule Conflict'),
          message: typeof errorObj?.details === 'string' ? errorObj.details : 'This teacher is already assigned to another class during the same period and day.',
          suggestion: typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : 'Please choose a different teacher, period, or day for this assignment.',
          constraint: errorObj?.constraint_violated
        });

        // Show toast notification
        const errorDetails = typeof errorObj?.details === 'string' ? errorObj.details : "This teacher is already assigned to another class during the same period and day";
        const errorSuggestion = typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : "Please choose a different teacher, period, or day for this assignment.";

        toast({
          title: t('timetable.teacherConflict', 'Teacher Schedule Conflict'),
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

      } else if (errorObj?.error_code === 'CLASS_CONFLICT' ||
                 (error instanceof Error && error.message?.includes('Class schedule conflict'))) {

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'class_conflict',
          title: t('timetable.classConflict', 'Class Schedule Conflict'),
          message: typeof errorObj?.details === 'string' ? errorObj.details : 'This class already has a subject assigned for this period and day.',
          suggestion: typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : 'Please choose a different period or day, or update the existing entry.',
          constraint: errorObj?.conflict_data
        });

        // Show toast notification
        const errorDetails = typeof errorObj?.details === 'string' ? errorObj.details : "This class already has a subject assigned for this period and day";
        const errorSuggestion = typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : "Please choose a different period or day, or update the existing entry.";

        toast({
          title: t('timetable.classConflict', 'Class Schedule Conflict'),
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create entry",
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditConfig = (config: TimetableConfig) => {
    setEditingConfig(config);
    setConfigForm({
      name: config.name,
      description: config.description || '',
      academic_year_id: config.academic_year_id,
      total_periods: config.total_periods,
      days_per_week: config.days_per_week
    });
    setShowConfigDialog(true);
  };

  // Only allow admins and principals
  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return <AccessDenied />;
  }

  // Classes of the selected configuration's academic year (fall back to all)
  const yearDivisions = selectedConfig
    ? classDivisions.filter((c) => c.academic_year_id === selectedConfig.academic_year_id)
    : classDivisions;
  const visibleDivisions = yearDivisions.length > 0 ? yearDivisions : classDivisions;

  const gradeGroups = (() => {
    const map = new Map<string, { grade: string; seq: number; items: ClassDivision[] }>();
    visibleDivisions.forEach((d) => {
      const grade = d.class_level?.name || 'Unknown';
      const g = map.get(grade) ?? { grade, seq: d.class_level?.sequence_number ?? 999, items: [] };
      g.items.push(d);
      map.set(grade, g);
    });
    return [...map.values()]
      .sort((a, b) => a.seq - b.seq)
      .map((g) => ({ ...g, items: g.items.sort((a, b) => a.division.localeCompare(b.division)) }));
  })();

  const selectedDivision = classDivisions.find((c) => c.id === selectedClass);
  const allEntries = Object.values(timetableData).flat();
  const subjectCount = new Set(allEntries.map((e) => e.subject)).size;
  const teacherCount = new Set(allEntries.map((e) => e.teacher_id)).size;

  const selectClass = (id: string) => {
    setSelectedClass(id);
    if (id) loadTimetableData(id);
  };

  const openAddEntry = (day?: number, period?: number) => {
    setEntryError(null);
    setShowErrorAlert(false);
    if (modalCloseTimeoutRef.current) clearTimeout(modalCloseTimeoutRef.current);
    setEntryForm((prev) => ({
      ...prev,
      config_id: selectedConfig?.id || '',
      class_division_id: selectedClass,
      ...(day ? { day_of_week: day } : null),
      ...(period ? { period_number: period } : null),
    }));
    setShowEntryDialog(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await timetableApi.deleteEntry(pendingDelete, token || '');
      toast({
        title: t('timetable.toasts.success'),
        description: t('timetable.delete.success'),
      });
      if (selectedClass) await loadTimetableData(selectedClass);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: t('timetable.toasts.error'),
        description: t('timetable.delete.failed'),
        variant: 'error',
      });
    } finally {
      setPendingDelete(null);
    }
  };

  const dayOptions = [
    ['1', 'Monday'],
    ['2', 'Tuesday'],
    ['3', 'Wednesday'],
    ['4', 'Thursday'],
    ['5', 'Friday'],
    ['6', 'Saturday'],
    ['7', 'Sunday'],
  ].slice(0, selectedConfig?.days_per_week || 7);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Toolbar: config summary on the left, actions on the right */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedConfig ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tone-primary-soft text-tone-primary">
              <Calendar className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{selectedConfig.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {selectedConfig.academic_year?.year_name ? `${selectedConfig.academic_year.year_name} · ` : ''}
                {selectedConfig.days_per_week} {t('timetable.daysPerWeek')} · {selectedConfig.total_periods} {t('timetable.periodsPerDay')}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => openEditConfig(selectedConfig)} className="shrink-0">
              <Edit />
              {t('timetable.editConfig')}
            </Button>
          </div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">{t('timetable.alerts.selectConfig')}</p>
        )}

        <div className="flex items-center gap-2">
          {selectedConfig && (
            <SearchableClassDropdown
              classes={visibleDivisions}
              value={selectedClass}
              onValueChange={selectClass}
              placeholder={t('timetable.selectClass', 'Select Class')}
              showAcademicYear={false}
              className="w-48"
            />
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => (selectedClass ? loadTimetableData(selectedClass) : loadInitialData())}
            disabled={loading}
            aria-label={t('actions.refresh')}
            title={t('actions.refresh')}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => openAddEntry()} disabled={!selectedClass || !selectedConfig}>
            <Plus />
            {t('timetable.addEntry')}
          </Button>
        </div>
      </div>

      {/* No configuration yet: offer the available ones */}
      {!selectedConfig && configs.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <button
              key={config.id}
              type="button"
              onClick={() => setSelectedConfig(config)}
              className="rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-sm font-medium">{config.name}</p>
              <p className="text-xs text-muted-foreground">{config.academic_year?.year_name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Class not chosen yet: grade cards with section buttons */}
      {selectedConfig && !selectedClass && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('timetable.selectClassHint', 'Select a class to view and manage its timetable.')}</p>
          {gradeGroups.length === 0 ? (
            <p className="rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground">{t('calendar.form.noClasses', 'No classes found.')}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {gradeGroups.map(({ grade, items }) => (
                <li key={grade} className="rounded-xl border p-3">
                  <p className="text-sm font-medium">{grade}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {items.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectClass(d.id)}
                        title={`${grade} ${d.division}`}
                        className="inline-flex h-8 min-w-10 items-center justify-center rounded-md bg-muted/60 px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {d.division}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Selected class: summary line + weekly grid */}
      {selectedConfig && selectedClass && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold">
              {selectedDivision?.class_level.name} · {t('timetable.section')} {selectedDivision?.division}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {allEntries.length} {t('timetable.totalEntries')} · {subjectCount} {t('timetable.subjects', 'Subjects')} · {teacherCount} {t('common.staff')}
            </p>
          </div>

          {(classDivisionSubjects.length > 0 || classDivisionTeachers.length > 0) && (
            <div>
              <button
                type="button"
                onClick={() => setShowRoster((v) => !v)}
                aria-expanded={showRoster}
                className="inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown className={cn('size-3.5 transition-transform', showRoster && 'rotate-180')} />
                {t('timetable.availableSubjectsTitle', 'Subjects')} ({classDivisionSubjects.length}) · {t('timetable.availableTeachersTitle', 'Teachers')} (
                {new Set(classDivisionTeachers.filter((x) => x.is_active).map((x) => x.teacher_id)).size})
              </button>
              {showRoster && (
                <div className="mt-2 space-y-2 rounded-xl bg-muted/30 p-3 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {classDivisionSubjects.map((s) => (
                      <span key={s.id} className={cn('rounded-full px-2 py-0.5 font-medium', subjectSoft(s.name), subjectText(s.name))}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Map(classDivisionTeachers.filter((x) => x.is_active).map((x) => [x.teacher_id, x])).values()
                    ).map((x) => (
                      <span key={x.teacher_id} className="rounded-full bg-background px-2 py-0.5 font-medium ring-1 ring-border">
                        {x.teacher_info.full_name}
                        {x.assignment_type === 'class_teacher' && <span className="ml-1 font-normal text-muted-foreground">· Class Teacher</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && allEntries.length === 0 ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <TimetableGrid
              timetableData={timetableData}
              config={selectedConfig}
              onAddEntry={openAddEntry}
              onEditEntry={(entry) => {
                setEntryForm({
                  config_id: entry.config_id,
                  class_division_id: entry.class_division_id,
                  period_number: entry.period_number,
                  day_of_week: entry.day_of_week,
                  subject: entry.subject,
                  teacher_id: entry.teacher_id,
                });
                setShowEntryDialog(true);
              }}
              onDeleteEntry={(entryId) => setPendingDelete(entryId)}
            />
          )}
        </section>
      )}

      {/* Entry dialog */}
      <Dialog
        open={showEntryDialog}
        onOpenChange={(open) => {
          setShowEntryDialog(open);
          if (!open) {
            setEntryError(null);
            setShowErrorAlert(false);
            if (modalCloseTimeoutRef.current) clearTimeout(modalCloseTimeoutRef.current);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add Timetable Entry</DialogTitle>
            <DialogDescription>
              {selectedDivision ? `${selectedDivision.class_level.name} ${selectedDivision.division}` : ''}
            </DialogDescription>
          </DialogHeader>

          {entryError && showErrorAlert && (
            <Alert className="border-tone-danger/30 bg-tone-danger-soft">
              <AlertTriangle className="h-4 w-4 text-tone-danger" />
              <AlertDescription className="space-y-1 text-foreground">
                <div className="font-semibold">{entryError.title}</div>
                <div className="text-sm">{String(entryError.message)}</div>
                {entryError.suggestion && <div className="text-sm text-muted-foreground">{String(entryError.suggestion)}</div>}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select value={entryForm.day_of_week.toString()} onValueChange={(v) => setEntryForm((prev) => ({ ...prev, day_of_week: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select value={entryForm.period_number.toString()} onValueChange={(v) => setEntryForm((prev) => ({ ...prev, period_number: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedConfig?.total_periods || 8 }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        P{p} · {periodStartTime(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <SearchableSubjectDropdown
                subjects={classDivisionSubjects}
                value={entryForm.subject}
                onValueChange={(value) => setEntryForm((prev) => ({ ...prev, subject: value }))}
                placeholder={t('timetable.selectSubject')}
                showCode={true}
                emptyMessage="No subjects assigned to this class"
              />
              {classDivisionSubjects.length === 0 && <p className="text-xs text-muted-foreground">{t('timetable.noSubjectsAssigned')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>{t('timetable.teacher')}</Label>
              <SearchableTeacherDropdown
                teachers={classDivisionTeachers
                  .filter((teacher) => teacher.is_active)
                  .map((teacher) => ({
                    teacher_id: teacher.teacher_id,
                    full_name: teacher.teacher_info.full_name,
                    phone_number: teacher.teacher_info.phone_number,
                    email: teacher.teacher_info.email,
                    department: teacher.teacher_info.department || '',
                    designation: '',
                    is_active: teacher.is_active,
                  }))}
                value={entryForm.teacher_id}
                onValueChange={(value) => setEntryForm((prev) => ({ ...prev, teacher_id: value }))}
                placeholder={t('timetable.selectTeacher')}
                showPhone={false}
                showDepartment={true}
                emptyMessage={t('timetable.noTeachersAssigned')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowEntryDialog(false)}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={handleCreateEntry} disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" /> : <Save />}
                {t('timetable.createEntry')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('timetable.delete.title', 'Remove this entry?')}</DialogTitle>
            <DialogDescription>{t('timetable.delete.confirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('actions.delete', 'Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? t('timetable.configs.editTitle', 'Edit Configuration') : t('timetable.configs.createTitle', 'Create New Configuration')}
            </DialogTitle>
            <DialogDescription>{t('timetable.configs.description', 'Set up the basic structure for your school timetable')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="config-name">{t('timetable.configs.nameLabel', 'Configuration Name')}</Label>
              <Input
                id="config-name"
                value={configForm.name}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('timetable.configs.namePlaceholder', 'e.g., Primary School Schedule 2025-26')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="config-description">{t('timetable.configs.descLabel', 'Description (Optional)')}</Label>
              <Textarea
                id="config-description"
                value={configForm.description}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('timetable.configs.descPlaceholder', 'Brief description of this timetable configuration')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="academic-year">{t('timetable.academicYearLabel', 'Academic Year:')}</Label>
              <Select value={configForm.academic_year_id} onValueChange={(value) => setConfigForm((prev) => ({ ...prev, academic_year_id: value }))}>
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder={t('timetable.selectAcademicYear', 'Select Academic Year')} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year_name} {year.is_active && `(${t('academicSetup.status.active', 'Active')})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="periods">{t('timetable.kpi.periodsPerDay', 'Periods/Day')}</Label>
                <Input
                  id="periods"
                  type="number"
                  min="1"
                  max="20"
                  value={configForm.total_periods}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, total_periods: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="days">{t('timetable.kpi.daysPerWeek', 'Days/Week')}</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="7"
                  value={configForm.days_per_week}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, days_per_week: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowConfigDialog(false)}>
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={editingConfig ? handleUpdateConfig : handleCreateConfig}
                disabled={loading || !configForm.name.trim() || !configForm.academic_year_id}
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Save />}
                {editingConfig ? t('actions.update', 'Update') : t('actions.create', 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
