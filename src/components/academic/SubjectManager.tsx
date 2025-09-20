
// src/components/academic/SubjectManager.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2, Search, Loader2, BookOpen, Users, GraduationCap, User } from 'lucide-react';
import { useAcademicStructure } from '@/hooks/use-academic-structure';
import type { Subject, ClassDivision } from '@/types/academic';
import { SubjectTeacherAssignment } from './subject-teacher-assignment';

export function SubjectManager() {
  // Use real data from the hook
  const {
    subjects,
    classDivisions,
    teachers,
    loading,
    createSubject,
    updateSubject,
    deleteSubject,
    assignSubjectsToClass,
    removeSubjectFromClass,
    fetchSubjectsByClassDivision,
    assignTeacherToClass,
    reassignSubjectTeacher
  } = useAcademicStructure();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Partial<Subject> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassDivision, setSelectedClassDivision] = useState<ClassDivision | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('replace');
  const [activeTab, setActiveTab] = useState<'subjects' | 'teachers'>('subjects');

  // Store subjects for each class division
  const [classSubjectsMap, setClassSubjectsMap] = useState<Record<string, Subject[]>>({});
  const [loadingClassSubjects, setLoadingClassSubjects] = useState<Record<string, boolean>>({});

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => 
      searchTerm === '' || 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.code && subject.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [subjects, searchTerm]);

  // Fetch subjects for a specific class division
  const fetchClassSubjects = useCallback(async (classDivisionId: string) => {
    if (!classDivisionId) return;
    
    setLoadingClassSubjects(prev => ({ ...prev, [classDivisionId]: true }));
    try {
      const classSubjects = await fetchSubjectsByClassDivision(classDivisionId);
      setClassSubjectsMap(prev => ({ 
        ...prev, 
        [classDivisionId]: classSubjects
      }));
    } catch (err) {
      console.error('Failed to fetch class subjects:', err);
    } finally {
      setLoadingClassSubjects(prev => ({ ...prev, [classDivisionId]: false }));
    }
  }, [fetchSubjectsByClassDivision]);

  // Fetch subjects for all class divisions on component mount
  useEffect(() => {
    classDivisions.forEach(division => {
      fetchClassSubjects(division.id);
    });
  }, [classDivisions, fetchClassSubjects]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentSubject({ code: '', name: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setIsEditing(true);
    setCurrentSubject({ ...subject });
    setIsDialogOpen(true);
  };

  const handleDelete = async (subjectId: string) => {
    const success = await deleteSubject(subjectId);
    if (success) {
      // Data will be refreshed by the hook
    }
  };

  const handleSave = async () => {
    if (!currentSubject || !currentSubject.code || !currentSubject.name) return;
    
    if (isEditing && currentSubject.id) {
      const success = await updateSubject(currentSubject.id, {
        code: currentSubject.code,
        name: currentSubject.name
      });
      if (success) {
        setIsDialogOpen(false);
      }
    } else {
      const success = await createSubject({
        code: currentSubject.code,
        name: currentSubject.name
      });
      if (success) {
        setIsDialogOpen(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSubject(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleOpenAssignmentDialog = (classDivision: ClassDivision) => {
    setSelectedClassDivision(classDivision);
    setSelectedSubjectIds([]);
    setAssignmentMode('replace');
    setActiveTab('subjects'); // Reset to subjects tab
    setIsAssignmentDialogOpen(true);
  };

  const handleAssignSubjects = async () => {
    if (!selectedClassDivision || selectedSubjectIds.length === 0) return;
    
    const success = await assignSubjectsToClass(selectedClassDivision.id, selectedSubjectIds, assignmentMode);
    if (success) {
      // Refresh the subjects for this class division
      await fetchClassSubjects(selectedClassDivision.id);
      setIsAssignmentDialogOpen(false);
      setSelectedClassDivision(null);
      setSelectedSubjectIds([]);
    }
  };

  const handleRemoveSubjectFromClass = async (classDivisionId: string, subjectId: string) => {
    const success = await removeSubjectFromClass(classDivisionId, subjectId);
    if (success) {
      // Refresh the subjects for this class division
      await fetchClassSubjects(classDivisionId);
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
        // You might want to refresh teacher assignments here
        console.log('Subject teacher assigned successfully');
      }
    } catch (error) {
      console.error('Error assigning subject teacher:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Subjects Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Global Subjects
          </CardTitle>
          <CardDescription>
            Manage academic subjects available throughout the school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading subjects...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <span className="text-muted-foreground">No subjects found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.code}</TableCell>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          subject.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(subject)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(subject.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Class Division Subject Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subject Assignment to Classes
          </CardTitle>
          <CardDescription>
            Assign subjects to specific class divisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Division</TableHead>
                  <TableHead>Assigned Subjects</TableHead>
                  <TableHead>Subject Teachers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classDivisions.map((classDivision) => {
                  const classSubjects = classSubjectsMap[classDivision.id] || [];
                  const isLoading = loadingClassSubjects[classDivision.id];
                  
                  return (
                    <TableRow key={classDivision.id}>
                      <TableCell className="font-medium">
                        {classDivision.class_level?.name} {classDivision.division}
                      </TableCell>
                      <TableCell>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading subjects...</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {classSubjects.length > 0 ? (
                              classSubjects.map(subject => (
                                <span
                                  key={subject.id}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                                >
                                  {subject.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No subjects assigned</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {classDivision.teacher ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{classDivision.teacher.full_name}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <span className="italic">No teacher assigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenAssignmentDialog(classDivision)}
                        >
                          Manage Subjects
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input 
                id="code" 
                name="code" 
                value={currentSubject?.code || ''} 
                onChange={handleInputChange}
                placeholder="e.g., MATH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={currentSubject?.name || ''} 
                onChange={handleInputChange}
                placeholder="e.g., Mathematics"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage {selectedClassDivision?.class_level?.name} {selectedClassDivision?.division}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'subjects' | 'teachers')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Assignment
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Subject Teachers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="subjects" className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment Mode</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="replace-mode"
                    checked={assignmentMode === 'replace'}
                    onCheckedChange={() => setAssignmentMode('replace')}
                  />
                  <Label htmlFor="replace-mode">Replace (deactivate unassigned subjects)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="append-mode"
                    checked={assignmentMode === 'append'}
                    onCheckedChange={() => setAssignmentMode('append')}
                  />
                  <Label htmlFor="append-mode">Append (keep existing assignments)</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Select Subjects</Label>
                {loadingClassSubjects[selectedClassDivision?.id || ''] ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading subjects...</p>
                  </div>
                ) : selectedClassDivision ? (
                  <div className="space-y-3">
                                         {/* Show currently assigned subjects */}
                     {classSubjectsMap[selectedClassDivision.id] && classSubjectsMap[selectedClassDivision.id].length > 0 && (
                       <div>
                         <Label className="text-sm font-medium text-blue-600">Currently Assigned Subjects</Label>
                         <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                           {classSubjectsMap[selectedClassDivision.id].map((subject) => (
                             <div key={subject.id} className="flex items-center justify-between py-1">
                               <div className="flex items-center space-x-2">
                                 <Checkbox
                                   id={`subject-${subject.id}`}
                                   checked={selectedSubjectIds.includes(subject.id)}
                                   onCheckedChange={(checked) => {
                                     if (checked) {
                                       setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
                                     } else {
                                       setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject.id));
                                     }
                                   }}
                                 />
                                 <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                                   {subject.code} - {subject.name}
                                 </Label>
                               </div>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-4 w-4 p-0 text-red-600 hover:text-red-800"
                                 onClick={() => handleRemoveSubjectFromClass(selectedClassDivision.id, subject.id)}
                               >
                                 ×
                               </Button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                    
                    {/* Show all available subjects for append mode */}
                    {assignmentMode === 'append' && (
                      <div>
                        <Label className="text-sm font-medium text-green-600">Available Subjects to Add</Label>
                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                          {subjects
                            .filter(subject => !classSubjectsMap[selectedClassDivision.id]?.some(assigned => assigned.id === subject.id))
                            .map((subject) => (
                              <div key={subject.id} className="flex items-center space-x-2 py-1">
                                <Checkbox
                                  id={`subject-${subject.id}`}
                                  checked={selectedSubjectIds.includes(subject.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
                                    } else {
                                      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                                  {subject.code} - {subject.name}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {(!classSubjectsMap[selectedClassDivision.id] || classSubjectsMap[selectedClassDivision.id].length === 0) && assignmentMode === 'replace' && (
                      <div className="text-center py-4 text-gray-500">
                        <p>No subjects currently assigned to this class division.</p>
                        <p className="text-sm mt-1">Select subjects from the global list below.</p>
                      </div>
                    )}
                    
                    {/* Show all subjects for replace mode when none are assigned */}
                    {(!classSubjectsMap[selectedClassDivision.id] || classSubjectsMap[selectedClassDivision.id].length === 0) && assignmentMode === 'replace' && (
                      <div>
                        <Label className="text-sm font-medium text-orange-600">All Available Subjects</Label>
                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                          {subjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`subject-${subject.id}`}
                                checked={selectedSubjectIds.includes(subject.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
                                  } else {
                                    setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                                {subject.code} - {subject.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Please select a class division first.</p>
                  </div>
                )}
              </div>


              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignSubjects}
                  disabled={selectedSubjectIds.length === 0}
                >
                  Assign Subjects
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="teachers" className="space-y-4">
              {selectedClassDivision && selectedClassDivision.id ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Assign subject teachers to {selectedClassDivision.class_level?.name} {selectedClassDivision.division}
                  </div>
                  
                  {loadingClassSubjects[selectedClassDivision.id] ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading subjects...
                      </p>
                    </div>
                  ) : !teachers || teachers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No Teachers Available
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Please add teachers to the system first.
                      </p>
                    </div>
                  ) : classSubjectsMap[selectedClassDivision.id] && classSubjectsMap[selectedClassDivision.id].length > 0 ? (
                    <SubjectTeacherAssignment
                      division={selectedClassDivision}
                      teachers={teachers}
                      availableSubjects={classSubjectsMap[selectedClassDivision.id]}
                      onSave={handleAssignSubjectTeacher}
                      onCancel={() => setIsAssignmentDialogOpen(false)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No Subjects Available
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Please assign subjects to this class division first before assigning subject teachers.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('subjects')}
                      >
                        Go to Subject Assignment
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Please select a class division first.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
