// src/components/academic/academic-structure-manager.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
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
  AlertCircle
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
  const [addingSection, setAddingSection] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  
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
  };

  const handleAssignSubjectTeacher = async (divisionId: string, teacherId: string, subject: string, isPrimary: boolean) => {
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
    }
  };

  const handleRemoveSubjectTeacher = async (divisionId: string, teacherId: string) => {
    try {
      const success = await removeTeacherFromClass(divisionId, teacherId, 'subject_teacher');

      if (success) {
        // Refresh the summary data to reflect changes
        await refreshDivisionsSummary();
      }
    } catch (error) {
      console.error('Error removing subject teacher:', error);
      // You might want to show a toast notification here
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

  const handleStartSubjectTeacherAssignment = async (divisionId: string) => {
    setAssigningSubjectTeacher(divisionId);
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
  };
  
  const handleAddSection = async (levelId: string, name: string) => {
    // Check if section already exists for this level
    const existingSection = classDivisions.find(
      d => d.class_level_id === levelId && d.division.toUpperCase() === name.toUpperCase()
    );
    
    if (existingSection) {
      // Handle duplicate section error
      return;
    }
    
    // Get active academic year for the new division
    const activeYear = classDivisions[0]?.academic_year_id || 'default';
    
    const success = await createClassDivision({
      academic_year_id: activeYear,
      class_level_id: levelId,
      division: name.toUpperCase()
    });

    if (success) {
      setAddingSection(false);
      // Refresh the summary data to reflect changes
      await refreshDivisionsSummary();
    }
  };
  
  const handleCancelAddSection = () => {
    setAddingSection(false);
  };
  
  const handleDeleteClassDivision = async (id: string) => {
    const success = await deleteClassDivision(id);
    if (success) {
      // Refresh the summary data to reflect changes
      await refreshDivisionsSummary();
    }
  };
  


  return (
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
      
      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Configuration Issues Detected
            </CardTitle>
            <CardDescription>
              Please review the following issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {conflicts.map((conflict) => (
                <li key={conflict.id} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    conflict.severity === 'error' ? 'text-destructive' : 'text-yellow-500'
                  }`} />
                  <span>{conflict.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      



      {/* School Overview Card */}

      
      {/* Add Section Form */}
      {addingSection && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Section</CardTitle>
            <CardDescription>
              Create a new class section for a grade level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="level-select">Grade Level</Label>
                <select
                  id="level-select"
                  className="border rounded-md px-3 py-2 w-full"
                  onChange={(e) => {
                    const levelId = e.target.value;
                    if (levelId) {
                      const level = classLevels.find(l => l.id === levelId);
                      if (level) {
                        // Find next available section name
                        const existingSections = classDivisions
                          .filter(d => d.class_level_id === levelId)
                          .map(d => d.division);
                        
                        let nextSection = 'A';
                        while (existingSections.includes(nextSection)) {
                          nextSection = String.fromCharCode(nextSection.charCodeAt(0) + 1);
                        }
                        
                        handleAddSection(levelId, nextSection);
                      }
                    }
                  }}
                >
                  <option value="">Select a grade level</option>
                  {classLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelAddSection}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                  <TableHead className="text-base font-semibold py-4 px-6">Grade</TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">Section</TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">Students</TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">Class Teacher</TableHead>
                  <TableHead className="text-base font-semibold py-4 px-6">Subject Teachers</TableHead>
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
                  divisionsSummary.divisions.map((division, index) => {
                    // Group divisions by level for display
                    const showGradeName = index === 0 || 
                      divisionsSummary.divisions[index - 1]?.level.name !== division.level.name;

                    // Clean up subject teachers data - remove duplicates and null subjects
                    const cleanSubjectTeachers = division.subject_teachers 
                      ? division.subject_teachers
                          .filter((st) => st.name && st.name.trim() !== '')
                          .filter((st, idx, arr) => 
                            arr.findIndex((t) => t.name === st.name) === idx
                          )
                      : [];

                    return (
                      <TableRow key={division.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className={`py-4 px-6 ${showGradeName ? "font-semibold text-lg" : "text-muted-foreground"}`}>
                          {showGradeName ? division.level.name : ""}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-semibold text-lg">Section {division.division}</span>
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
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold text-lg">{division.class_teacher.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Class Teacher
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic flex items-center gap-2 text-lg">
                              <AlertCircle className="h-4 w-4" />
                              No teacher assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {cleanSubjectTeachers && cleanSubjectTeachers.length > 0 ? (
                            <div className="text-base space-y-2">
                              {cleanSubjectTeachers.map((st) => (
                                <div key={st.id} className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{st.name}</span>
                                  {st.subject && (
                                    <span className="text-sm text-muted-foreground">({st.subject})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-base text-muted-foreground">
                              <span className="italic">No subject teachers</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <div className="flex gap-3 justify-end">
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => handleStartTeacherAssignment(division.id)}
                              className="px-4 py-2 text-sm font-medium"
                            >
                              <User className="h-4 w-4 mr-2" />
                              {division.class_teacher ? 'Change' : 'Assign'}
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => handleStartSubjectTeacherAssignment(division.id)}
                              className="px-4 py-2 text-sm font-medium"
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Subject
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => handleDeleteClassDivision(division.id)}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      
      {/* Teacher Assignment Modal */}
      {assigningTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Teacher</CardTitle>
              <CardDescription>
                Assign a teacher to this class section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherAssignment
                division={classDivisions.find(d => d.id === assigningTeacher)!}
                teachers={teachers}
                onSave={handleAssignTeacher}
                onRemove={handleRemoveClassTeacher}
                onCancel={handleCancelTeacherAssignment}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Teacher Assignment Modal */}
      {assigningSubjectTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Assign Subject Teacher</CardTitle>
              <CardDescription>
                Assign a subject teacher to this class section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectTeacherAssignment
                division={classDivisions.find(d => d.id === assigningSubjectTeacher)!}
                teachers={teachers}
                availableSubjects={availableSubjects}
                currentSubjectTeachers={divisionsSummary?.divisions.find((d) => d.id === assigningSubjectTeacher)?.subject_teachers || []}
                onSave={handleAssignSubjectTeacher}
                onRemove={handleRemoveSubjectTeacher}
                onCancel={handleCancelSubjectTeacherAssignment}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}