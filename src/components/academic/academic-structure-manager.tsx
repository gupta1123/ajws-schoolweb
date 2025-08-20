// src/components/academic/academic-structure-manager.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BookOpen,
  Loader2,
  AlertTriangle,
  Users,
  User
} from 'lucide-react';
import { detectAcademicStructureConflicts, Conflict } from '@/components/academic/conflict-detection';
import { TeacherAssignment } from '@/components/academic/teacher-assignment';
import { AddSectionForm } from '@/components/academic/add-section-form';
import { useAcademicStructure } from '@/hooks/use-academic-structure';

export function AcademicStructureManager() {
  // Use real data from the hook
  const {
    classLevels,
    classDivisions,
    teachers,
    loading,
    error,
    clearError,
    createClassDivision,
    deleteClassDivision,
    assignTeacherToClass
  } = useAcademicStructure();
  
  // UI states
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null); // division id
  const [addingSection, setAddingSection] = useState(false);
  
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
    }
  };
  
  const handleStartTeacherAssignment = (divisionId: string) => {
    setAssigningTeacher(divisionId);
  };
  
  const handleCancelTeacherAssignment = () => {
    setAssigningTeacher(null);
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
    }
  };
  
  const handleCancelAddSection = () => {
    setAddingSection(false);
  };
  
  const handleDeleteClassDivision = async (id: string) => {
    const success = await deleteClassDivision(id);
    if (success) {
      // Data will be refreshed by the hook
    }
  };
  
  // Get divisions grouped by level for display
  const getDivisionsByLevel = (levelId: string) => {
    return classDivisions
      .filter(division => division.class_level_id === levelId)
      .sort((a, b) => a.division.localeCompare(b.division));
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
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Grades</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : classLevels.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sections</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : classDivisions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : teachers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                    classDivisions.filter(d => !d.teacher_id).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
            <AddSectionForm
              classLevels={classLevels}
              onAddSection={handleAddSection}
              onCancel={handleCancelAddSection}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Main Academic Structure View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Academic Structure</CardTitle>
              <CardDescription>
                Manage class sections and teacher assignments for the current academic year
              </CardDescription>
            </div>
            <Button onClick={() => setAddingSection(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading academic structure...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : classLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <span className="text-muted-foreground">No class levels found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  classLevels.map(level => {
                    const divisions = getDivisionsByLevel(level.id);
                    return divisions.map((division, index) => {
                      const assignedTeacher = teachers.find(t => t.teacher_id === division.teacher_id);
                      
                      // Show grade name only for the first division of each level
                      const showGradeName = index === 0;
                      
                      return (
                        <TableRow key={division.id}>
                          <TableCell className={showGradeName ? "font-medium" : "text-muted-foreground"}>
                            {showGradeName ? level.name : ""}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">Section {division.division}</span>
                          </TableCell>
                          <TableCell>
                            {assignedTeacher ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{assignedTeacher.full_name}</div>
                                  {assignedTeacher.department && (
                                    <div className="text-xs text-muted-foreground">
                                      {assignedTeacher.department}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">No teacher assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleStartTeacherAssignment(division.id)}
                            >
                              <User className="h-4 w-4 mr-1" />
                              {assignedTeacher ? 'Change' : 'Assign'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClassDivision(division.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
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
                onCancel={handleCancelTeacherAssignment}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}