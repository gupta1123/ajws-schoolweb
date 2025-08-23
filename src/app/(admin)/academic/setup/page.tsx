'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { academicServices } from '@/lib/api/academic';
import type { ClassLevel } from '@/types/academic';

// Interfaces
interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Division {
  id: string;
  name: string;
  classId: string;
  className: string;
  teacherId: string | null;
  teacherName: string | null;
  academicYear: string;
  studentCount: number;
  subjects: string[];
  subjectTeachers: Array<{ subject: string; teacher: string; assignmentId?: string }>;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}



interface ApiDivision {
  id: string;
  division: string;
  level: {
    name: string;
    sequence_number: number;
  };
  academic_year: {
    id: string;
    is_active: boolean;
    year_name: string;
  };
  class_teacher: {
    id: string;
    name: string;
    is_class_teacher: boolean;
  };
  subject_teachers: Array<{
    id: string;
    name: string;
    subject: string | null;
    is_class_teacher: boolean;
  }>;
  subjects: Array<{ id: string; name: string; code: string }>;
  student_count: number;
}

// Mock data for academic years
const mockAcademicYears: AcademicYear[] = [
  { id: 'ay1', year_name: '2023-2024', start_date: '2023-06-01', end_date: '2024-05-31', is_active: true },
  { id: 'ay2', year_name: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_active: false },
  { id: 'ay3', year_name: '2025-2026', start_date: '2025-06-01', end_date: '2026-05-31', is_active: false },
];

export default function AcademicSystemSetupPage() {
  const { token } = useAuth();
  
  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(mockAcademicYears);
  const [isAcademicYearDialogOpen, setIsAcademicYearDialogOpen] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [isEditingAcademicYear, setIsEditingAcademicYear] = useState(false);

  // Divisions State
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [currentDivision, setCurrentDivision] = useState<Division | null>(null);
  const [isEditingDivision, setIsEditingDivision] = useState(false);

  // Class Levels State
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [loadingClassLevels, setLoadingClassLevels] = useState(false);
  const [isClassLevelDialogOpen, setIsClassLevelDialogOpen] = useState(false);
  const [currentClassLevel, setCurrentClassLevel] = useState<Omit<ClassLevel, 'id' | 'created_at'> | null>(null);
  const [editingClassLevelId, setEditingClassLevelId] = useState<string | null>(null);
  const [isEditingClassLevel, setIsEditingClassLevel] = useState(false);

  // Subjects State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [isEditingSubject, setIsEditingSubject] = useState(false);

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Class-Subject Assignment State
  const [isClassSubjectDialogOpen, setIsClassSubjectDialogOpen] = useState(false);
  const [selectedClassDivision, setSelectedClassDivision] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubjectTeacher, setSelectedSubjectTeacher] = useState('');

  // Subject Teacher Assignment State
  const [isSubjectTeacherDialogOpen, setIsSubjectTeacherDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [editingSubject, setEditingSubject] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Fetch class divisions summary
  useEffect(() => {
    const fetchClassDivisions = async () => {
      if (!token) return;
      
      try {
        setLoadingDivisions(true);
        const response = await academicServices.getClassDivisionsSummary(token);
        
        if (response.status === 'success') {
          // Transform the API response to match our expected format
          const transformedDivisions: Division[] = response.data.divisions.map((division: ApiDivision) => ({
            id: division.id,
            name: division.division,
            classId: division.level.sequence_number.toString(),
            className: division.level.name,
            teacherId: division.class_teacher?.id || null,
            teacherName: division.class_teacher?.name || null,
            academicYear: division.academic_year.year_name,
            studentCount: division.student_count,
            subjects: [...new Set(division.subjects.map(s => s.name))], // Remove duplicates
            subjectTeachers: division.subject_teachers.map(st => ({ 
              subject: st.subject || '', 
              teacher: st.name,
              assignmentId: st.id
            }))
          }));
          setDivisions(transformedDivisions);
        }
      } catch (error) {
        console.error('Error fetching class divisions:', error);
      } finally {
        setLoadingDivisions(false);
      }
    };

    if (token) {
      fetchClassDivisions();
    }
  }, [token]);

  // Fetch class levels
  useEffect(() => {
    const fetchClassLevels = async () => {
      if (!token) return;
      
      try {
        setLoadingClassLevels(true);
        const response = await academicServices.getClassLevels(token);
        
        if (response.status === 'success') {
          setClassLevels(response.data.class_levels);
        }
      } catch (error) {
        console.error('Error fetching class levels:', error);
      } finally {
        setLoadingClassLevels(false);
      }
    };

    if (token) {
      fetchClassLevels();
    }
  }, [token]);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!token) return;
      
      try {
        setLoadingTeachers(true);
        const response = await academicServices.getTeachers(token);
        
        if (response.status === 'success') {
          // Transform the API response to match our expected format
          const transformedTeachers: Teacher[] = response.data.teachers.map((teacher) => ({
            id: teacher.teacher_id,
            name: teacher.full_name,
            email: teacher.email || '',
            phone: teacher.phone_number
          }));
          setTeachers(transformedTeachers);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (token) {
      fetchTeachers();
    }
  }, [token]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!token) return;
      
      try {
        setLoadingSubjects(true);
        const response = await academicServices.getSubjects(token);
        
        if (response.status === 'success') {
          setSubjects(response.data.subjects);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    if (token) {
      fetchSubjects();
    }
  }, [token]);

  // Academic Year Functions
  const handleAddAcademicYear = () => {
    setIsEditingAcademicYear(false);
    setCurrentAcademicYear({ id: '', year_name: '', start_date: '', end_date: '', is_active: false });
    setIsAcademicYearDialogOpen(true);
  };

  const handleEditAcademicYear = (year: AcademicYear) => {
    setIsEditingAcademicYear(true);
    setCurrentAcademicYear({ 
      ...year,
      year_name: year.year_name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_active: year.is_active
    });
    setIsAcademicYearDialogOpen(true);
  };

  const handleDeleteAcademicYear = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await academicServices.deleteAcademicYear(id, token);
      
      if (response.status === 'success') {
        setAcademicYears(academicYears.filter(year => year.id !== id));
      }
    } catch (error) {
      console.error('Error deleting academic year:', error);
    }
  };

  const handleSaveAcademicYear = async () => {
    if (!token) return;
    
    try {
      if (isEditingAcademicYear && currentAcademicYear) {
        const response = await academicServices.updateAcademicYear(
          currentAcademicYear.id,
          {
            year_name: currentAcademicYear.year_name,
            start_date: currentAcademicYear.start_date,
            end_date: currentAcademicYear.end_date,
            is_active: currentAcademicYear.is_active
          },
          token
        );
        
        if (response.status === 'success') {
          setAcademicYears(academicYears.map(year => 
            year.id === currentAcademicYear.id ? response.data.academic_year : year
          ));
        }
      } else if (currentAcademicYear) {
        const response = await academicServices.createAcademicYear(
          {
            year_name: currentAcademicYear.year_name,
            start_date: currentAcademicYear.start_date,
            end_date: currentAcademicYear.end_date,
            is_active: currentAcademicYear.is_active
          },
          token
        );
        
        if (response.status === 'success') {
          setAcademicYears([
            ...academicYears,
            response.data.academic_year
          ]);
        }
      }
    } catch (error) {
      console.error('Error saving academic year:', error);
    }
    
    setIsAcademicYearDialogOpen(false);
  };

  // Division Functions
  const handleAddDivision = () => {
    setIsEditingDivision(false);
    setCurrentDivision({ 
      id: '', 
      name: '', 
      classId: '', 
      className: '', 
      teacherId: '', 
      teacherName: '', 
      academicYear: '', 
      studentCount: 0, 
      subjects: [], 
      subjectTeachers: [] 
    });
    setIsDivisionDialogOpen(true);
  };

  const handleEditDivision = (division: Division) => {
    setIsEditingDivision(true);
    setCurrentDivision({ ...division });
    setIsDivisionDialogOpen(true);
  };

  const handleDeleteDivision = (id: string) => {
    setDivisions(divisions.filter(division => division.id !== id));
  };

  const handleSaveDivision = async () => {
    if (!token || !currentDivision) return;
    
    try {
      if (isEditingDivision && currentDivision.id) {
        // Update the existing division
        const response = await academicServices.updateClassDivision(
          currentDivision.id,
          {
            division: currentDivision.name,
            teacher_id: currentDivision.teacherId || undefined
          },
          token
        );
        
        if (response.status === 'success') {
          // Refresh the divisions data
          const refreshResponse = await academicServices.getClassDivisionsSummary(token);
          if (refreshResponse.status === 'success') {
            const transformedDivisions: Division[] = refreshResponse.data.divisions.map((division: ApiDivision) => ({
              id: division.id,
              name: division.division,
              classId: division.level.sequence_number.toString(),
              className: division.level.name,
              teacherId: division.class_teacher?.id || null,
              teacherName: division.class_teacher?.name || null,
              academicYear: division.academic_year.year_name,
              studentCount: division.student_count,
              subjects: [...new Set(division.subjects.map(s => s.name))], // Remove duplicates
              subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name }))
            }));
            setDivisions(transformedDivisions);
          }
        }
      } else {
        // Get the active academic year
        const activeYearResponse = await academicServices.getActiveAcademicYear(token);
        if (activeYearResponse.status !== 'success') {
          console.error('Error fetching active academic year');
          return;
        }
        
        const activeYearId = activeYearResponse.data.academic_year.id;
        
        // Find the class level by name to get its ID
        const classLevel = classLevels.find(level => level.name === currentDivision!.className);
        if (!classLevel) {
          console.error('Class level not found');
          return;
        }
        
        // Create the division using the API
        const response = await academicServices.createClassDivision(
          {
            academic_year_id: activeYearId,
            class_level_id: classLevel.id,
            division: currentDivision!.name,
            teacher_id: currentDivision!.teacherId || undefined
          },
          token
        );
        
        if (response.status === 'success') {
          // Refresh the divisions data
          const refreshResponse = await academicServices.getClassDivisionsSummary(token);
          if (refreshResponse.status === 'success') {
            const transformedDivisions: Division[] = refreshResponse.data.divisions.map((division: ApiDivision) => ({
              id: division.id,
              name: division.division,
              classId: division.level.sequence_number.toString(),
              className: division.level.name,
              teacherId: division.class_teacher?.id || null,
              teacherName: division.class_teacher?.name || null,
              academicYear: division.academic_year.year_name,
              studentCount: division.student_count,
              subjects: [...new Set(division.subjects.map(s => s.name))], // Remove duplicates
              subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name }))
            }));
            setDivisions(transformedDivisions);
          }
        }
      }
    } catch (error) {
      console.error('Error saving division:', error);
    }
    
    setIsDivisionDialogOpen(false);
  };

  // Subject Functions
  const handleAddSubject = () => {
    setIsEditingSubject(false);
    setCurrentSubject({ id: '', code: '', name: '' });
    setIsSubjectDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setIsEditingSubject(true);
    setCurrentSubject({ ...subject });
    setIsSubjectDialogOpen(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await academicServices.deleteSubject(id, token);
      
      if (response.status === 'success') {
        setSubjects(subjects.filter(subject => subject.id !== id));
      }
    } catch (error) {
        console.error('Error deleting subject:', error);
      }
    };

  const handleSaveSubject = async () => {
    if (!token) return;
    
    try {
      if (isEditingSubject && currentSubject) {
        const response = await academicServices.updateSubject(
          currentSubject.id,
          {
            code: currentSubject.code,
            name: currentSubject.name
          },
          token
        );
        
        if (response.status === 'success') {
          setSubjects(subjects.map(subject => 
            subject.id === currentSubject.id ? response.data.subject : subject
          ));
        }
      } else if (currentSubject) {
        const response = await academicServices.createSubject(
          {
            code: currentSubject.code,
            name: currentSubject.name
          },
          token
        );
        
        if (response.status === 'success') {
          setSubjects([
            ...subjects,
            response.data.subject
          ]);
        }
      }
    } catch (error) {
      console.error('Error saving subject:', error);
    }
    
    setIsSubjectDialogOpen(false);
  };

  // Class Level Functions
  const handleAddClassLevel = () => {
    setIsEditingClassLevel(false);
    setEditingClassLevelId(null);
    setCurrentClassLevel({ name: '', sequence_number: 0 });
    setIsClassLevelDialogOpen(true);
  };

  const handleEditClassLevel = (classLevel: ClassLevel) => {
    setIsEditingClassLevel(true);
    setEditingClassLevelId(classLevel.id);
    setCurrentClassLevel({ 
      name: classLevel.name,
      sequence_number: classLevel.sequence_number
    });
    setIsClassLevelDialogOpen(true);
  };

  const handleDeleteClassLevel = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await academicServices.deleteClassLevel(id, token);
      
      if (response.status === 'success') {
        // Refresh the class levels data
        const refreshResponse = await academicServices.getClassLevels(token);
        if (refreshResponse.status === 'success') {
          setClassLevels(refreshResponse.data.class_levels);
        }
      }
    } catch (error) {
      console.error('Error deleting class level:', error);
    }
  };

  const handleSaveClassLevel = async () => {
    if (!token || !currentClassLevel) return;
    
    try {
      if (isEditingClassLevel && editingClassLevelId) {
        const response = await academicServices.updateClassLevel(
          editingClassLevelId,
          {
            name: currentClassLevel.name,
            sequence_number: currentClassLevel.sequence_number
          },
          token
        );
        
        if (response.status === 'success') {
          // Refresh the class levels data
          const refreshResponse = await academicServices.getClassLevels(token);
          if (refreshResponse.status === 'success') {
            setClassLevels(refreshResponse.data.class_levels);
          }
        }
      } else {
        const response = await academicServices.createClassLevel(
          {
            name: currentClassLevel.name,
            sequence_number: currentClassLevel.sequence_number
          },
          token
        );
        
        if (response.status === 'success') {
          // Refresh the class levels data
          const refreshResponse = await academicServices.getClassLevels(token);
          if (refreshResponse.status === 'success') {
            setClassLevels(refreshResponse.data.class_levels);
          }
        }
      }
    } catch (error) {
      console.error('Error saving class level:', error);
    }
    
    setIsClassLevelDialogOpen(false);
  };

  const handleClassLevelChange = (field: string, value: string | number) => {
    setCurrentClassLevel({ ...currentClassLevel!, [field]: value });
  };

  // Class-Subject Assignment Functions
  const handleAddClassSubject = () => {
    setIsClassSubjectDialogOpen(true);
  };

  const handleSaveClassSubject = async () => {
    if (!token || !selectedClassDivision || !selectedSubject) return;
    
    try {
      // Assign subject to class division using the direct division ID
      const response = await academicServices.assignSubjectsToClass(
        selectedClassDivision,
        [selectedSubject],
        'replace', // or 'append' based on requirement
        token
      );
      
      if (response.status === 'success') {
        // Refresh the divisions data to show updated assignments
        const refreshResponse = await academicServices.getClassDivisionsSummary(token);
        if (refreshResponse.status === 'success') {
          const transformedDivisions: Division[] = refreshResponse.data.divisions.map((division: ApiDivision) => ({
            id: division.id,
            name: division.division,
            classId: division.level.sequence_number.toString(),
            className: division.level.name,
            teacherId: division.class_teacher?.id || null,
            teacherName: division.class_teacher?.name || null,
            academicYear: division.academic_year.year_name,
            studentCount: division.student_count,
            subjects: [...new Set(division.subjects.map(s => s.name))], // Remove duplicates
            subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name }))
          }));
          setDivisions(transformedDivisions);
        }
      }
    } catch (error) {
      console.error('Error assigning subject to class:', error);
    }
    
    setIsClassSubjectDialogOpen(false);
    setSelectedClassDivision('');
    setSelectedSubject('');
    setSelectedSubjectTeacher('');
  };

  // Subject Teacher Assignment Functions
  const handleEditSubjectTeacher = (division: Division, subject: string) => {
    setSelectedDivision(division);
    setEditingSubject(subject);
    
    // Find the current teacher for this subject
    const subjectTeacher = division.subjectTeachers?.find((st) => st.subject === subject);
    setSelectedTeacher(subjectTeacher ? subjectTeacher.teacher : '');
    
    setIsSubjectTeacherDialogOpen(true);
  };

  const handleSaveSubjectTeacher = async () => {
    if (!token || !selectedDivision || !editingSubject) return;
    
    try {
      // First, we need to find the teacher ID from the teacher name
      const teacher = teachers.find(t => t.name === selectedTeacher);
      if (!teacher && selectedTeacher) {
        console.error('Teacher not found');
        return;
      }
      
      // Check if there's already an assignment for this subject in this division
      const existingAssignment = selectedDivision.subjectTeachers?.find(st => 
        st.subject === editingSubject
      );
      
      let response;
      
      if (existingAssignment && existingAssignment.assignmentId) {
        // Update existing assignment (PUT request)
        response = await academicServices.updateTeacherAssignment(
          existingAssignment.assignmentId,
          {
            assignment_type: 'subject_teacher',

            is_primary: false,
          },
          token
        );
      } else {
        // Create new assignment (POST request)
        response = await academicServices.assignTeacherToClass(
          selectedDivision.id,
          {
            class_division_id: selectedDivision.id,
            teacher_id: teacher ? teacher.id : '',
            assignment_type: 'subject_teacher',
            subject: editingSubject,
            is_primary: false
          },
          token
        );
      }
      
      if (response.status === 'success') {
        // Refresh the divisions data to show updated assignments
        const refreshResponse = await academicServices.getClassDivisionsSummary(token);
        if (refreshResponse.status === 'success') {
          const transformedDivisions: Division[] = refreshResponse.data.divisions.map((division: ApiDivision) => ({
            id: division.id,
            name: division.division,
            classId: division.level.sequence_number.toString(),
            className: division.level.name,
            teacherId: division.class_teacher?.id || null,
            teacherName: division.class_teacher?.name || null,
            academicYear: division.academic_year.year_name,
            studentCount: division.student_count,
            subjects: [...new Set(division.subjects.map(s => s.name))], // Remove duplicates
            subjectTeachers: division.subject_teachers.map(st => ({ 
              subject: st.subject || '', 
              teacher: st.name,
              assignmentId: st.id
            }))
          }));
          setDivisions(transformedDivisions);
        }
      }
    } catch (error) {
      console.error('Error assigning subject teacher:', error);
    }
    
    setIsSubjectTeacherDialogOpen(false);
    setSelectedDivision(null);
    setEditingSubject('');
    setSelectedTeacher('');
  };

      // Helper functions
    const handleAcademicYearChange = (field: string, value: string | boolean) => {
      setCurrentAcademicYear({ ...currentAcademicYear!, [field]: value });
    };
  
    const handleDivisionChange = (field: string, value: string) => {
      if (field === 'className') {
        // When class name changes, also update classId to match
        setCurrentDivision({ 
          ...currentDivision!, 
          className: value,
          classId: value // Keep both in sync for now
        });
      } else {
        setCurrentDivision({ ...currentDivision!, [field]: value });
      }
    };
  
    const handleSubjectChange = (field: string, value: string) => {
      setCurrentSubject({ ...currentSubject!, [field]: value });
    };

  // Get unique class levels from divisions
  const getClassLevels = () => {
    return classLevels.map(level => ({
      id: level.id,
      name: level.name
    }));
  };

  // Get divisions for a specific class
  const getDivisionsForClass = (classId: string) => {
    return divisions.filter(d => d.classId === classId);
  };



  return (
    <div className="p-4 md:p-8">
      <Tabs defaultValue="years" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="divisions">Classes & Divisions</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        {/* Academic Years Tab */}
        <TabsContent value="years">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Academic Years</CardTitle>
              <Button onClick={handleAddAcademicYear}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.map((year) => (
                    <TableRow key={year.id}>
                      <TableCell className="font-medium">{year.year_name}</TableCell>
                      <TableCell>{year.start_date}</TableCell>
                      <TableCell>{year.end_date}</TableCell>
                      <TableCell>
                        <Badge variant={year.is_active ? "default" : "secondary"}>
                          {year.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditAcademicYear(year)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAcademicYear(year.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes & Divisions Tab */}
        <TabsContent value="divisions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Class Levels */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Class Levels</CardTitle>
                <Button onClick={handleAddClassLevel}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </CardHeader>
              <CardContent>
                {loadingClassLevels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading class levels...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Sequence</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classLevels.map((classLevel) => (
                        <TableRow key={classLevel.id}>
                          <TableCell className="font-medium">{classLevel.name}</TableCell>
                          <TableCell>{classLevel.sequence_number}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClassLevel(classLevel)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClassLevel(classLevel.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - Divisions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Divisions</CardTitle>
                <Button onClick={handleAddDivision}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Division
                </Button>
              </CardHeader>
              <CardContent>
                {loadingDivisions || loadingTeachers || loadingClassLevels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading class divisions...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Class Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {divisions.map((division) => (
                          <TableRow key={division.id}>
                            <TableCell className="font-medium">{division.className || 'N/A'}</TableCell>
                            <TableCell>{division.name}</TableCell>
                            <TableCell>
                              {division.teacherName ? (
                                <Badge variant="default">{division.teacherName}</Badge>
                              ) : (
                                <Badge variant="secondary">Not assigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>{division.studentCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditDivision(division)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteDivision(division.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Subjects List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subjects</CardTitle>
                <Button onClick={handleAddSubject}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSubjects || loadingTeachers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading subjects...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditSubject(subject)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteSubject(subject.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - Division-Subject Assignments Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Division-Subject Assignments</CardTitle>
                  <CardDescription>Subjects assigned to each division</CardDescription>
                </div>
                <Button onClick={handleAddClassSubject}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Assign Subject
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                                        {divisions.flatMap((division) => 
                      division.subjects.map((subject: string, index: number) => {
                        // Find the teacher for this subject
                        const subjectTeacher = division.subjectTeachers?.find((st) => 
                          st.subject === subject
                        );
                        
                        return (
                          <TableRow key={`${division.id}-${subject}-${index}`}>
                            <TableCell>{division.className || 'N/A'}</TableCell>
                            <TableCell>{division.name}</TableCell>
                            <TableCell>{subject}</TableCell>
                            <TableCell>
                              {subjectTeacher ? (
                                <Badge 
                                  variant="default" 
                                  className="cursor-pointer hover:opacity-80"
                                  onClick={() => handleEditSubjectTeacher(division, subject)}
                                >
                                  {subjectTeacher.teacher}
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="secondary" 
                                  className="cursor-pointer hover:opacity-80"
                                  onClick={() => handleEditSubjectTeacher(division, subject)}
                                >
                                  Assign Teacher
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Academic Year Dialog */}
      <Dialog open={isAcademicYearDialogOpen} onOpenChange={setIsAcademicYearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingAcademicYear ? 'Edit Academic Year' : 'Add Academic Year'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yearName">Year Name</Label>
              <Input 
                id="yearName" 
                value={currentAcademicYear?.year_name || ''} 
                onChange={(e) => handleAcademicYearChange('year_name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={currentAcademicYear?.start_date || ''} 
                onChange={(e) => handleAcademicYearChange('start_date', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={currentAcademicYear?.end_date || ''} 
                onChange={(e) => handleAcademicYearChange('end_date', e.target.value)} 
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={currentAcademicYear?.is_active || false}
                onChange={(e) => handleAcademicYearChange('is_active', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Set as Active Year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAcademicYearDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAcademicYear}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Division Dialog */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingDivision ? 'Edit Division' : 'Add Division'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class</Label>
              <Select 
                value={currentDivision?.className || ''} 
                onValueChange={(value) => handleDivisionChange('className', value)}
                disabled={isEditingDivision}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classLevels.map((classLevel) => (
                    <SelectItem key={classLevel.id} value={classLevel.name}>
                      {classLevel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="divisionName">Division Name</Label>
              <Input 
                id="divisionName" 
                value={currentDivision?.name || ''} 
                onChange={(e) => handleDivisionChange('name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Assign Class Teacher</Label>
              <Select 
                value={currentDivision?.teacherId || ''} 
                onValueChange={(value) => handleDivisionChange('teacherId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDivisionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDivision} disabled={loadingClassLevels || !currentDivision?.className || !currentDivision?.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input 
                id="subjectCode" 
                value={currentSubject?.code || ''} 
                onChange={(e) => handleSubjectChange('code', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input 
                id="subjectName" 
                value={currentSubject?.name || ''} 
                onChange={(e) => handleSubjectChange('name', e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSubject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Level Dialog */}
      <Dialog open={isClassLevelDialogOpen} onOpenChange={setIsClassLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingClassLevel ? 'Edit Class' : 'Add Class'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classLevelName">Class Name</Label>
              <Input 
                id="classLevelName" 
                value={currentClassLevel?.name || ''} 
                onChange={(e) => handleClassLevelChange('name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sequenceNumber">Sequence Number</Label>
              <Input 
                id="sequenceNumber" 
                type="number"
                value={currentClassLevel?.sequence_number || ''} 
                onChange={(e) => handleClassLevelChange('sequence_number', parseInt(e.target.value) || 0)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsClassLevelDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveClassLevel}
              disabled={!currentClassLevel?.name || currentClassLevel?.sequence_number === undefined}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Subject Assignment Dialog */}
      <Dialog open={isClassSubjectDialogOpen} onOpenChange={setIsClassSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subject to Class Division</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classDivision">Class Division</Label>
              <Select 
                value={selectedClassDivision} 
                onValueChange={setSelectedClassDivision}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class division" />
                </SelectTrigger>
                <SelectContent>
                  {getClassLevels().map((classLevel) => (
                    getDivisionsForClass(classLevel.id).map((division) => (
                      <SelectItem 
                        key={division.id} 
                        value={division.id}
                      >
                        {classLevel.name} - {division.name}
                      </SelectItem>
                    ))
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    // Filter out subjects that are already assigned to this division
                    .filter(subject => {
                      // Find the selected division
                      const selectedDivision = divisions.find(d => d.id === selectedClassDivision);
                      // Check if this subject is already assigned to the division
                      return !selectedDivision?.subjects?.some((assignedSubject: string) => 
                        assignedSubject === subject.name
                      );
                    })
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectTeacher">Subject Teacher (Optional)</Label>
              <Select 
                value={selectedSubjectTeacher || "none"} 
                onValueChange={(value) => setSelectedSubjectTeacher(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No teacher assigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsClassSubjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClassSubject}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Teacher Assignment Dialog */}
      <Dialog open={isSubjectTeacherDialogOpen} onOpenChange={setIsSubjectTeacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to Subject</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Class Division</Label>
              <div className="text-sm font-medium">
                {selectedDivision?.className} - {selectedDivision?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="text-sm font-medium">
                {editingSubject}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select 
                value={selectedTeacher || "none"} 
                onValueChange={(value) => setSelectedTeacher(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No teacher assigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.name}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubjectTeacherDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSubjectTeacher}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}