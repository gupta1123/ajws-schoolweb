// src/components/academic/academic-structure-manager.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  User,
  AlertTriangle,
  GraduationCap,
  Loader2,
  Users,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useAcademicStructure } from '@/hooks/use-academic-structure';
import { useAuth } from '@/lib/auth/context';
import { academicServices } from '@/lib/api/academic';
import { TeacherAssignment } from './teacher-assignment';
import { SubjectTeacherAssignment } from './subject-teacher-assignment';
import { detectAcademicStructureConflicts, Conflict } from './conflict-detection';
import type { Subject } from '@/types/academic';

export function AcademicStructureManager() {
  const { token } = useAuth();

  // Use real data from the hook with optimized fetching
  const {
    classLevels,
    classDivisions,
    teachers,
    error,
    clearError,
    createClassDivision,
    deleteClassDivision,
    assignTeacherToClass,
    removeTeacherFromClass,
    fetchSubjectsByClassDivision,
    fetchDivisionsWithSummary
  } = useAcademicStructure();

  // Enhanced state for divisions summary
  const [divisionsSummary, setDivisionsSummary] = useState<{
    divisions: Array<{
      id: string;
      division: string;
      level: { name: string; sequence_number: number };
      academic_year: { id: string; is_active: boolean; year_name: string };
      class_teacher: { id: string; name: string; is_class_teacher: boolean };
      subject_teachers: Array<{
        id: string;
        name: string;
        subject: string | null;
        is_class_teacher: boolean;
      }>;
      subjects: Array<{ id: string; name: string; code: string }>;
      student_count: number;
    }>;
    total_divisions: number;
    total_students: number;
    academic_year: { id: string | null; name: string };
    summary: {
      total_subject_teachers: number;
      total_subjects: number;
      divisions_with_class_teachers: number;
      divisions_with_subject_teachers: number;
    };
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // UI states
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null); // division id
  const [assigningSubjectTeacher, setAssigningSubjectTeacher] = useState<string | null>(null); // division id
  const [editingSubjectAssignment, setEditingSubjectAssignment] = useState<{ teacherId: string; subject: string } | null>(null); // for prefill
  const [addingSection, setAddingSection] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Add section flow states
  const [selectedLevelForSection, setSelectedLevelForSection] = useState<string | null>(null);
  const [suggestedSectionName, setSuggestedSectionName] = useState<string>('');
  const [customSectionName, setCustomSectionName] = useState<string>('');

  // Confirmation states
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null); // division id to delete
  const [confirmingRemoveTeacher, setConfirmingRemoveTeacher] = useState<{ divisionId: string; teacherId: string; assignmentType: string } | null>(null);

  // Loading states for actions
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set()); // track loading by action key

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  // Helper functions for loading states
  const setActionLoading = (actionKey: string, loading: boolean) => {
    setLoadingActions(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(actionKey);
      } else {
        newSet.delete(actionKey);
      }
      return newSet;
    });
  };

  const isActionLoading = (actionKey: string) => loadingActions.has(actionKey);
  
  // Conflict detection - wrapped in useCallback to fix useEffect dependency
  const detectConflicts = useCallback(() => {
    const newConflicts = detectAcademicStructureConflicts(
      [], // Simplified - no academic years in daily view
      classLevels,
      classDivisions
    );
    setConflicts(newConflicts);
    return newConflicts;
  }, [classLevels, classDivisions]);
  
  // Function to refresh divisions summary (optimized)
  const refreshDivisionsSummary = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingSummary(true);
      const response = await academicServices.getClassDivisionsSummary(token);

      if (response.status === 'success' && response.data) {
        setDivisionsSummary(response.data);

        // Also refresh the main data using the optimized function
        await fetchDivisionsWithSummary();
      }
    } catch (err) {
      console.error('Error fetching divisions summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, [token, fetchDivisionsWithSummary]);

  // Fetch divisions summary data
  useEffect(() => {
    refreshDivisionsSummary();
  }, [refreshDivisionsSummary]);

  // Run conflict detection when data changes
  useEffect(() => {
    detectConflicts();
  }, [detectConflicts]);
  
  // Event handlers
  const handleAssignTeacher = async (divisionId: string, teacherId: string) => {
    const actionKey = `assign-teacher-${divisionId}`;
    setActionLoading(actionKey, true);

    try {
    const success = await assignTeacherToClass(divisionId, {
      class_division_id: divisionId,
      teacher_id: teacherId,
      assignment_type: 'class_teacher',
      is_primary: true
    });

    if (success) {
      setAssigningTeacher(null);
      // Refresh the summary data to reflect changes
      await refreshDivisionsSummary();
      }
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const handleAssignSubjectTeacher = async (divisionId: string, teacherId: string, subject: string, isPrimary: boolean) => {
    const actionKey = `assign-subject-teacher-${divisionId}`;
    setActionLoading(actionKey, true);

    try {
      const success = await assignTeacherToClass(divisionId, {
        class_division_id: divisionId,
        teacher_id: teacherId,
        assignment_type: 'subject_teacher',
        subject: subject,
        is_primary: isPrimary
      });

      if (success) {
        setAssigningSubjectTeacher(null);
        // Refresh the summary data to reflect changes
        await refreshDivisionsSummary();
      }
    } catch (error) {
      console.error('Error assigning subject teacher:', error);
      // You might want to show a toast notification here
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const handleRemoveSubjectTeacher = async (divisionId: string, teacherId: string) => {
    const actionKey = `remove-subject-teacher-${divisionId}-${teacherId}`;
    setActionLoading(actionKey, true);

    try {
      const success = await removeTeacherFromClass(divisionId, teacherId, 'subject_teacher');

      if (success) {
        // Refresh the summary data to reflect changes
        await refreshDivisionsSummary();
      }
    } catch (error) {
      console.error('Error removing subject teacher:', error);
      // You might want to show a toast notification here
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const handleRemoveClassTeacher = async (divisionId: string) => {
    try {
      const success = await removeTeacherFromClass(divisionId, '', 'class_teacher');

      if (success) {
        // Refresh the summary data to reflect changes
        await refreshDivisionsSummary();
      }
    } catch (error) {
      console.error('Error removing class teacher:', error);
      // You might want to show a toast notification here
    }
  };
  
  const handleStartTeacherAssignment = (divisionId: string) => {
    setAssigningTeacher(divisionId);
  };

  const handleStartSubjectTeacherAssignment = async (divisionId: string, prefillData?: { teacherId: string; subject: string }) => {
    setAssigningSubjectTeacher(divisionId);
    setEditingSubjectAssignment(prefillData || null);
    try {
      // First refresh the divisions summary to get the latest data
      await refreshDivisionsSummary();
      
      // Then fetch available subjects for this division
      const subjects = await fetchSubjectsByClassDivision(divisionId);
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setAvailableSubjects([]);
    }
  };
  
  const handleCancelTeacherAssignment = () => {
    setAssigningTeacher(null);
  };

  const handleCancelSubjectTeacherAssignment = () => {
    setAssigningSubjectTeacher(null);
    setEditingSubjectAssignment(null);
  };
  
  const handleLevelSelectForSection = (levelId: string) => {
    const level = classLevels.find(l => l.id === levelId);
    if (!level) return;

    // Find existing sections for this level
    const existingSections = classDivisions
      .filter(d => d.class_level_id === levelId)
      .map(d => d.division);

    // Generate next available section name
    let nextSection = 'A';
    while (existingSections.includes(nextSection)) {
      nextSection = String.fromCharCode(nextSection.charCodeAt(0) + 1);
    }

    setSelectedLevelForSection(levelId);
    setSuggestedSectionName(nextSection);
    setCustomSectionName(nextSection);
  };

  const handleConfirmAddSection = async () => {
    if (!selectedLevelForSection || !customSectionName.trim()) return;

    const sectionName = customSectionName.trim().toUpperCase();

    // Check if section already exists for this level
    const existingSection = classDivisions.find(
      d => d.class_level_id === selectedLevelForSection && d.division.toUpperCase() === sectionName
    );
    
    if (existingSection) {
      // Handle duplicate section error - you might want to show a toast here
      return;
    }
    
    // Get active academic year for the new division
    const activeYear = classDivisions[0]?.academic_year_id || 'default';
    
    const success = await createClassDivision({
      academic_year_id: activeYear,
      class_level_id: selectedLevelForSection,
      division: sectionName
    });

    if (success) {
      // Reset form and close dialog
      setAddingSection(false);
      setSelectedLevelForSection(null);
      setSuggestedSectionName('');
      setCustomSectionName('');
      // Refresh the summary data to reflect changes
      await refreshDivisionsSummary();
    }
  };
  
  const handleCancelAddSection = () => {
    setAddingSection(false);
    setSelectedLevelForSection(null);
    setSuggestedSectionName('');
    setCustomSectionName('');
  };
  
  const handleDeleteClassDivision = async (id: string) => {
    const actionKey = `delete-division-${id}`;
    setActionLoading(actionKey, true);

    try {
    const success = await deleteClassDivision(id);
    if (success) {
      // Refresh the summary data to reflect changes
      await refreshDivisionsSummary();
      }
    } finally {
      setActionLoading(actionKey, false);
      setConfirmingDelete(null);
    }
  };



  const handleConfirmedRemoveTeacher = async () => {
    if (!confirmingRemoveTeacher) return;

    const { divisionId, teacherId, assignmentType } = confirmingRemoveTeacher;
    const actionKey = `remove-${assignmentType}-${divisionId}-${teacherId}`;
    setActionLoading(actionKey, true);

    try {
      const success = await removeTeacherFromClass(divisionId, teacherId, assignmentType);

      if (success) {
        // Refresh the summary data to reflect changes
        await refreshDivisionsSummary();
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
    } finally {
      setActionLoading(actionKey, false);
      setConfirmingRemoveTeacher(null);
    }
  };
  


  // Helper functions for UI
  interface DivisionData {
    id: string;
    division: string;
    level: { name: string; sequence_number: number };
    student_count: number;
    class_teacher: { id: string; name: string } | null;
    subject_teachers: Array<{ id: string; name: string; subject: string | null }>;
    subjects: Array<{ id: string; name: string; code: string }>;
  }

  const countAssignedSubjects = (division: DivisionData) => {
    const set = new Set(division.subject_teachers?.map((st) => st.subject).filter(Boolean) || []);
    return set.size;
  };

  const getAvailableLevels = () => {
    if (!divisionsSummary?.divisions) return [];
    const names = Array.from(new Set(divisionsSummary.divisions.map((d: DivisionData) => d.level.name)));
    return names.sort();
  };

  const filteredDivisions = useMemo(() => {
    if (!divisionsSummary?.divisions) return [];

    const query = searchQuery.toLowerCase().trim();
    return divisionsSummary.divisions.filter((division: DivisionData) => {
      if (levelFilter && division.level.name !== levelFilter) return false;
      if (!query) return true;

      const searchText = [
        division.level.name,
        division.division,
        division.class_teacher?.name || "",
        ...(division.subject_teachers?.map((st) => st.name) || []),
        ...(division.subject_teachers?.map((st) => st.subject || "") || []),
      ].join(" ").toLowerCase();

      return searchText.includes(query);
    });
  }, [divisionsSummary, searchQuery, levelFilter]);

  const summaryMetrics = useMemo(() => {
    if (!divisionsSummary?.divisions) return { totalDivisions: 0, totalStudents: 0, avgStudents: 0, totalSubjectsAssigned: 0, totalSubjectsAvailable: 0 };

    const totalDivisions = divisionsSummary.divisions.length;
    const totalStudents = divisionsSummary.divisions.reduce((acc: number, d: DivisionData) => acc + (d.student_count || 0), 0);
    const totalSubjectsAssigned = divisionsSummary.divisions.reduce((acc: number, d: DivisionData) => acc + countAssignedSubjects(d), 0);
    const totalSubjectsAvailable = divisionsSummary.divisions.reduce((acc: number, d: DivisionData) => acc + (d.subjects?.length || 0), 0);
    const avgStudents = totalDivisions ? Math.round(totalStudents / totalDivisions) : 0;

    return { totalDivisions, totalStudents, avgStudents, totalSubjectsAssigned, totalSubjectsAvailable };
  }, [divisionsSummary]);

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              ×
            </Button>
          </div>
        </div>
      )}

        {/* Summary Header */}
        <Card className="border-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-blue-600/10 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Current Academic Structure</CardTitle>
            <CardDescription>Manage sections and teacher assignments for the active year</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border p-3">
              <GraduationCap className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">Divisions</div>
                <div className="text-lg font-semibold">{summaryMetrics.totalDivisions}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border p-3">
              <Users className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">Students</div>
                <div className="text-lg font-semibold">{summaryMetrics.totalStudents}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border p-3">
              <User className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">Avg per Division</div>
                <div className="text-lg font-semibold">{summaryMetrics.avgStudents}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border p-3">
              <BookOpen className="h-5 w-5" />
              <div>
                <div className="text-sm text-muted-foreground">Subject Coverage</div>
                <div className="text-lg font-semibold">{summaryMetrics.totalSubjectsAssigned}/{summaryMetrics.totalSubjectsAvailable}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      
      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Configuration Issues Detected
            </CardTitle>
              <CardDescription>Review and resolve the following</CardDescription>
          </CardHeader>
          <CardContent>
              <ul className="space-y-2 text-sm">
              {conflicts.map((conflict) => (
                  <li key={conflict.id} className={`flex items-start gap-2 ${
                    conflict.severity === 'error' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{conflict.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      



      {/* School Overview Card */}

      
      {/* Add Section Dialog */}
      <Dialog open={addingSection} onOpenChange={(open) => !open && handleCancelAddSection()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new class section for a grade level
            </DialogDescription>
          </DialogHeader>

          {!selectedLevelForSection ? (
            // Step 1: Select grade level
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="level-select">Select Grade Level</Label>
                <Select onValueChange={handleLevelSelectForSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {classLevels.map(level => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            // Step 2: Confirm section name
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-name">Section Name</Label>
                <div className="space-y-2">
                  <Input
                    id="section-name"
                    value={customSectionName}
                    onChange={(e) => setCustomSectionName(e.target.value.toUpperCase())}
                    placeholder="Enter section name"
                    maxLength={1}
                    className="text-center text-lg font-bold"
                  />
                  <p className="text-sm text-muted-foreground">
                    Suggested: <span className="font-medium">{suggestedSectionName}</span>
                    {customSectionName !== suggestedSectionName && (
                      <span className="text-amber-600 ml-2">(Modified)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    Creating section <strong>{customSectionName}</strong> for{' '}
                    <strong>{classLevels.find(l => l.id === selectedLevelForSection)?.name}</strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLevelForSection(null);
                    setSuggestedSectionName('');
                    setCustomSectionName('');
                  }}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelAddSection}>
                  Cancel
                </Button>
                  <Button
                    onClick={handleConfirmAddSection}
                    disabled={!customSectionName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Section
                  </Button>
                </div>
              </div>
            </div>
      )}
        </DialogContent>
      </Dialog>
      
      {/* Main Academic Structure View */}
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Current Academic Structure</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Manage class sections and teacher assignments for the current academic year
              </CardDescription>
            </div>
            <Button onClick={() => setAddingSection(true)} className="px-6 py-3 text-base font-medium">
              <Plus className="h-5 w-5 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                  <TableHead className="text-base font-semibold py-4 px-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Grade Level
                    </div>
                  </TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Class Section
                    </div>
                  </TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Students
                    </div>
                  </TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Teacher Assignment
                    </div>
                  </TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      Subject Details
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-base font-semibold py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSummary ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-lg">Loading academic structure...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !divisionsSummary || divisionsSummary.divisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <span className="text-lg text-muted-foreground">No divisions found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  divisionsSummary.divisions.flatMap((division) => {
                    // Clean up subject teachers data - remove duplicates and null subjects
                    const cleanSubjectTeachers = division.subject_teachers 
                      ? division.subject_teachers
                          .filter((st) => st.name && st.name.trim() !== '')
                          .filter((st, idx, arr) => 
                            arr.findIndex((t) => t.name === st.name && t.subject === st.subject) === idx
                          )
                      : [];

                    // Create rows for this division
                    const rows = [];

                    // First row: Class teacher and basic info
                    rows.push(
                      <TableRow
                        key={`${division.id}-main`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-l-4 border-l-blue-500"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{division.level.name}</span>
                            <span className="text-sm text-muted-foreground">Grade</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">Section {division.division}</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Main Row
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold text-lg">{division.student_count}</span>
                            {division.student_count === 0 && (
                              <span className="text-sm text-orange-500 font-medium">(Empty)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {division.class_teacher ? (
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <div>
                                <div className="font-semibold text-lg flex items-center gap-2">
                                  {division.class_teacher.name}
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Class Teacher
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic">
                              <AlertCircle className="h-4 w-4" />
                              <span>No class teacher assigned</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-base">
                            <span className="text-muted-foreground italic">See rows below for subject teachers</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartTeacherAssignment(division.id)}
                              disabled={isActionLoading(`assign-teacher-${division.id}`)}
                              className="px-3 py-2 text-sm font-medium"
                            >
                              <User className="h-4 w-4 mr-2" />
                              {isActionLoading(`assign-teacher-${division.id}`) ? 'Assigning...' : 'Manage Class Teacher'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartSubjectTeacherAssignment(division.id)}
                              className="px-3 py-2 text-sm font-medium"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Manage Subject Teachers
                            </Button>
                            <AlertDialog open={confirmingDelete === division.id} onOpenChange={(open) => !open && setConfirmingDelete(null)}>
                              <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                                  size="sm"
                                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Class Section</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete Section {division.division}? This action cannot be undone and will remove all teacher assignments for this section.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClassDivision(division.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete Section
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );

                    // Subject teacher rows
                    if (cleanSubjectTeachers.length > 0) {
                      cleanSubjectTeachers.forEach((subjectTeacher, subjectIndex) => {
                        rows.push(
                          <TableRow
                            key={`${division.id}-subject-${subjectIndex}`}
                            className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-l-4 border-l-purple-400"
                          >
                            <TableCell className="py-3 px-6">
                              {/* Empty cell for grade column */}
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Section {division.division}</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Subject Row
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              {/* Empty cell for student count */}
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <div className="text-sm text-muted-foreground">
                                Subject assignment
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <div>
                                  <div className="font-semibold text-base">{subjectTeacher.name}</div>
                                  {subjectTeacher.subject && (
                                    <div className="text-sm text-muted-foreground">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {subjectTeacher.subject}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-3 px-6">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Pre-populate the form with current assignment
                                    handleStartSubjectTeacherAssignment(division.id, {
                                      teacherId: subjectTeacher.id,
                                      subject: subjectTeacher.subject || ''
                                    });
                                  }}
                                  className="px-2 py-1 text-xs"
                                  title="Edit this subject assignment"
                                >
                                  ✏️ Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                                      title="Remove this subject teacher"
                                    >
                                      🗑️ Remove
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Subject Teacher</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {subjectTeacher.name} as the {subjectTeacher.subject} teacher for Section {division.division}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveSubjectTeacher(division.id, subjectTeacher.id)} className="bg-red-600 hover:bg-red-700">
                                        Remove Teacher
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    } else {
                      // Empty subject teachers row
                      rows.push(
                        <TableRow
                          key={`${division.id}-empty-subjects`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors border-l-4 border-l-gray-300"
                        >
                          <TableCell className="py-3 px-6">
                            {/* Empty cell for grade column */}
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Section {division.division}</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                No Subjects
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            {/* Empty cell for student count */}
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="text-sm text-muted-foreground">
                              No subject assignments
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="text-base text-muted-foreground italic">
                              No subject teachers assigned yet
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3 px-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartSubjectTeacherAssignment(division.id)}
                              className="px-3 py-2 text-sm font-medium"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Manage Subject Teachers
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return rows;
                  })
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      
      {/* Teacher Assignment Dialog */}
      <Dialog open={!!assigningTeacher} onOpenChange={(open) => !open && handleCancelTeacherAssignment()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Class Teacher</DialogTitle>
            <DialogDescription>
                Assign a teacher to this class section
            </DialogDescription>
          </DialogHeader>
          {assigningTeacher && classDivisions.find(d => d.id === assigningTeacher) ? (
              <TeacherAssignment
                division={classDivisions.find(d => d.id === assigningTeacher)!}
                teachers={teachers}
                onSave={handleAssignTeacher}
                onRemove={handleRemoveClassTeacher}
                onCancel={handleCancelTeacherAssignment}
              />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading...</span>
              </div>
        </div>
      )}
        </DialogContent>
      </Dialog>

      {/* Subject Teacher Assignment Dialog */}
      <Dialog open={!!assigningSubjectTeacher} onOpenChange={(open) => !open && handleCancelSubjectTeacherAssignment()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Subject Teachers</DialogTitle>
            <DialogDescription>
              Assign or manage subject teachers for this class section
            </DialogDescription>
          </DialogHeader>
          {assigningSubjectTeacher && classDivisions.find(d => d.id === assigningSubjectTeacher) ? (
            availableSubjects.length > 0 ? (
              <SubjectTeacherAssignment
                division={classDivisions.find(d => d.id === assigningSubjectTeacher)!}
                teachers={teachers}
                availableSubjects={availableSubjects}
                currentSubjectTeachers={divisionsSummary?.divisions.find((d) => d.id === assigningSubjectTeacher)?.subject_teachers || []}
                prefillData={editingSubjectAssignment || undefined}
                onSave={handleAssignSubjectTeacher}
                onRemove={handleRemoveSubjectTeacher}
                onCancel={handleCancelSubjectTeacherAssignment}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading subjects...</span>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading...</span>
              </div>
        </div>
      )}
        </DialogContent>
      </Dialog>

      {/* Class Teacher Removal Confirmation */}
      <AlertDialog open={!!confirmingRemoveTeacher} onOpenChange={(open) => !open && setConfirmingRemoveTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmingRemoveTeacher?.assignmentType === 'class_teacher' ? 'Unassign Class Teacher' : 'Remove Subject Teacher'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingRemoveTeacher?.assignmentType === 'class_teacher'
                ? 'Are you sure you want to unassign this class teacher?'
                : 'Are you sure you want to remove this subject teacher assignment?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedRemoveTeacher} className="bg-red-600 hover:bg-red-700">
              {confirmingRemoveTeacher?.assignmentType === 'class_teacher' ? 'Unassign Teacher' : 'Remove Teacher'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}