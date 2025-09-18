'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

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
  subjects: Array<{ id: string; name: string; code: string }>;
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
  const { toast } = useToast();
  const { t } = useI18n();
  
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

  // Subject Assignment Loading State
  const [isAssigningSubject, setIsAssigningSubject] = useState(false);

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
            subjects: division.subjects, // Keep full subject objects
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

  // const handleDeleteDivision = (id: string) => {
  //   setDivisions(divisions.filter(division => division.id !== id));
  // };

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
              subjects: division.subjects, // Keep full subject objects
              subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name, assignmentId: st.id }))
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
              subjects: division.subjects, // Keep full subject objects
              subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name, assignmentId: st.id }))
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
    
    setIsAssigningSubject(true);
    
    try {
      // Step 1: Assign subject to class division
      const subjectResponse = await academicServices.assignSubjectsToClass(
        selectedClassDivision,
        [selectedSubject],
        'append', // Use append to add the subject without removing existing ones
        token
      );
      
      if (subjectResponse.status === 'success') {
        // Step 2: If a teacher is selected, assign teacher to the subject
        if (selectedSubjectTeacher) {
          try {
            // Find the teacher object from the selected teacher ID
            const teacher = teachers.find(t => t.id === selectedSubjectTeacher);
            if (teacher) {
              // Find the subject name from the subjects array
              const subject = subjects.find(s => s.id === selectedSubject);
              if (subject) {
                const teacherResponse = await academicServices.assignTeacherToClass(
                  selectedClassDivision,
                  {
                    class_division_id: selectedClassDivision,
                    teacher_id: teacher.id,
                    assignment_type: 'subject_teacher',
                    subject: subject.name,
                    is_primary: false
                  },
                  token
                );
                
                if (teacherResponse.status === 'success') {
                  toast({
                    title: "Success!",
                    description: `Subject "${subject.name}" assigned to class division with teacher "${teacher.name}"`,
                    variant: "default",
                  });
                } else {
                  console.error('Error assigning teacher to subject:', teacherResponse);
                  toast({
                    title: "Warning",
                    description: `Subject assigned but failed to assign teacher. Please try assigning teacher separately.`,
                    variant: "warning",
                  });
                }
              }
            }
          } catch (teacherError) {
            console.error('Error assigning teacher to subject:', teacherError);
            toast({
              title: "Warning",
              description: `Subject assigned but failed to assign teacher. Please try assigning teacher separately.`,
              variant: "warning",
            });
          }
        } else {
          // No teacher selected, just show success for subject assignment
          const subject = subjects.find(s => s.id === selectedSubject);
          if (subject) {
            toast({
              title: "Success!",
              description: `Subject "${subject.name}" assigned to class division successfully`,
              variant: "default",
            });
          }
        }
        
        // Step 3: Refresh the divisions data to show updated assignments
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
            subjects: division.subjects, // Keep full subject objects
            subjectTeachers: division.subject_teachers.map(st => ({ subject: st.subject || '', teacher: st.name, assignmentId: st.id }))
          }));
          setDivisions(transformedDivisions);
        }
      } else {
        console.error('Error assigning subject to class:', subjectResponse);
        toast({
          title: "Error",
          description: "Failed to assign subject to class division. Please try again.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error('Error in subject assignment process:', error);
    } finally {
      setIsAssigningSubject(false);
      setIsClassSubjectDialogOpen(false);
      setSelectedClassDivision('');
      setSelectedSubject('');
      setSelectedSubjectTeacher('');
    }
  };

  // Subject Teacher Assignment Functions
  const handleEditSubjectTeacher = (division: Division, subject: { id: string; name: string; code: string }) => {
    setSelectedDivision(division);
    setEditingSubject(subject.name);
    
    // Find the current teacher for this subject
    const subjectTeacher = division.subjectTeachers?.find((st) => st.subject === subject.name);
    // Find the teacher ID from the teacher name
    const currentTeacher = teachers.find(t => t.name === subjectTeacher?.teacher);
    setSelectedTeacher(currentTeacher ? currentTeacher.id : '');
    
    setIsSubjectTeacherDialogOpen(true);
  };

  const handleSaveSubjectTeacher = async () => {
    if (!token || !selectedDivision || !editingSubject) return;

    try {
      // Validate input data
      if (!selectedDivision?.id) {
        throw new Error('No class division selected');
      }
      if (!selectedTeacher) {
        throw new Error('No teacher selected');
      }
      if (!editingSubject) {
        throw new Error('No subject specified');
      }

      // Validate teacher ID format
      if (typeof selectedTeacher !== 'string' || selectedTeacher.trim() === '') {
        throw new Error('Invalid teacher ID format');
      }

      console.log('Starting teacher assignment process:', {
        selectedDivision: selectedDivision.id,
        selectedTeacher,
        editingSubject,
        teacherType: typeof selectedTeacher,
        teacherLength: selectedTeacher.length
      });

      // Find the selected teacher object to validate it exists
      const teacherObject = teachers.find(t => t.id === selectedTeacher);
      if (!teacherObject) {
        console.error('Selected teacher not found in teachers list:', {
          selectedTeacher,
          availableTeachers: teachers.map(t => ({ id: t.id, name: t.name }))
        });
        throw new Error('Selected teacher not found in the system');
      }

      console.log('Found teacher object:', teacherObject);

      // Check if there's already an assignment for this subject in this division
      const existingAssignment = selectedDivision.subjectTeachers?.find(st =>
        st.subject === editingSubject
      );

      let response;

      if (existingAssignment && existingAssignment.assignmentId) {
        // For updates, we need to fetch the current user's assignment data to get the correct assignment ID
        try {
          // Fetch assignment data for the selected teacher
          const teacherDataResponse = await academicServices.getTeacherClasses(selectedTeacher, token);

          console.log('Selected teacher data response:', teacherDataResponse); // Debug log

          if (teacherDataResponse.status === 'success') {
            // Find the assignment for this specific class and subject combination
            const selectedTeacherAssignment = teacherDataResponse.data.assignments?.find(
              assignment =>
                assignment.class_info.class_division_id === selectedDivision.id &&
                assignment.subject === editingSubject &&
                assignment.assignment_type === 'subject_teacher'
            );

            console.log('Looking for assignment with:', {
              classDivisionId: selectedDivision.id,
              subject: editingSubject,
              assignmentType: 'subject_teacher'
            }); // Debug log

            console.log('Found selected teacher assignment:', selectedTeacherAssignment); // Debug log

            if (selectedTeacherAssignment) {
              console.log('Updating existing assignment:', {
                assignmentId: selectedTeacherAssignment.assignment_id,
                classDivisionId: selectedDivision.id,
                subject: editingSubject,
                isPrimary: selectedTeacherAssignment.is_primary
              }); // Debug log
              // Update existing assignment using the selected teacher's assignment ID
              response = await academicServices.updateClassDivisionTeacherAssignment(
                selectedDivision.id, // classDivisionId
                selectedTeacherAssignment.assignment_id, // Use the selected teacher's assignment ID
                {
                  assignment_type: 'subject_teacher',
                  is_primary: selectedTeacherAssignment.is_primary, // Use the existing is_primary value
                  subject: editingSubject,
                  assignment_id: selectedTeacherAssignment.assignment_id // Include assignment_id in payload
                },
                token
              );
            } else {
              console.log('No existing assignment found for selected teacher in this class/subject'); // Debug log
              console.log('Available assignments for selected teacher:', teacherDataResponse.data.assignments); // Debug log
              console.log('Creating new assignment for:', {
                teacherId: selectedTeacher,
                classDivisionId: selectedDivision.id,
                subject: editingSubject
              }); // Debug log

              // If the selected teacher doesn't have an assignment for this subject/class,
              // we need to create a new assignment instead of updating
              const assignmentPayload = {
                class_division_id: selectedDivision.id,
                teacher_id: selectedTeacher,
                assignment_type: 'subject_teacher' as const,
                subject: editingSubject,
                is_primary: false,
                assignment_id: undefined // No assignment_id for new assignments
              };

              console.log('Creating new assignment with payload:', assignmentPayload); // Debug log

              response = await academicServices.assignTeacherToClass(
                selectedDivision.id,
                assignmentPayload,
                token
              );
            }
          } else {
            const errorMessage = (teacherDataResponse as { status: 'error'; message: string; statusCode: number }).message || 'Unknown error occurred while fetching selected teacher data';
            console.error('Selected teacher data fetch failed:', teacherDataResponse); // Debug log
            throw new Error(`Failed to fetch selected teacher assignment data: ${errorMessage}`);
          }
        } catch (apiError) {
          console.error('API Error:', apiError); // Debug log

          // If the API call fails completely, fall back to creating a new assignment
          console.log('API failed, falling back to creating new assignment'); // Debug log

          const fallbackPayload = {
            class_division_id: selectedDivision.id,
            teacher_id: selectedTeacher,
            assignment_type: 'subject_teacher' as const,
            subject: editingSubject,
            is_primary: false,
            assignment_id: undefined // No assignment_id for fallback new assignment
          };

          console.log('Fallback assignment payload:', fallbackPayload); // Debug log

          response = await academicServices.assignTeacherToClass(
            selectedDivision.id,
            fallbackPayload,
            token
          );
        }
      } else {
        // Create new assignment (POST request)
        const originalPayload = {
          class_division_id: selectedDivision.id,
          teacher_id: selectedTeacher || '',
          assignment_type: 'subject_teacher' as const,
          subject: editingSubject,
          is_primary: false,
          assignment_id: undefined // No assignment_id for new assignments
        };

        console.log('Original create assignment payload:', originalPayload); // Debug log

        response = await academicServices.assignTeacherToClass(
          selectedDivision.id,
          originalPayload,
          token
        );
      }

      if (response.status === 'success') {
        toast({
          title: "Success!",
          description: `Teacher assignment updated successfully for ${editingSubject}`,
          variant: "default",
        });

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
            subjects: division.subjects, // Keep full subject objects
            subjectTeachers: division.subject_teachers.map(st => ({
              subject: st.subject || '',
              teacher: st.name,
              assignmentId: st.id
            }))
          }));
          setDivisions(transformedDivisions);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update teacher assignment",
          variant: "error",
        });
      }
          } catch (error) {
        console.error('Error assigning subject teacher:', error);

        // Try to extract more specific error information
        let errorMessage = "An error occurred while updating the teacher assignment";
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String(error.message);
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "error",
        });
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



  // Grade filter state
  const [gradeFilter, setGradeFilter] = useState('all');

  // Division filter state for subjects tab
  const [subjectGradeFilter, setSubjectGradeFilter] = useState('all');
  const [subjectDivisionFilter, setSubjectDivisionFilter] = useState('all');

  // Filtered divisions based on grade filter
  const filteredDivisions = gradeFilter === 'all' 
    ? divisions 
    : divisions.filter(division => division.className === gradeFilter);

  // Get unique grades for the filter dropdown (only those with subject assignments)
  const uniqueGradesWithAssignments = Array.from(new Set(
    divisions
      .filter(d => d.subjects && d.subjects.length > 0) // Only divisions with subjects
      .map(d => d.className)
  )).filter(Boolean).sort();

  // Get unique divisions for the subject filter dropdown (only those with subject assignments)
  const uniqueDivisionsWithAssignments = Array.from(new Set(
    divisions
      .filter(d => d.subjects && d.subjects.length > 0) // Only divisions with subjects
      .map(d => d.name)
  )).filter(Boolean).sort();

  // Get all unique grades for the Classes & Divisions tab (not filtered by subjects)
  const allUniqueGrades = Array.from(new Set(divisions.map(d => d.className))).filter(Boolean).sort();

  // Get divisions available for the selected grade in subject filters (only those with subject assignments)
  const getDivisionsForGrade = useCallback((grade: string) => {
    if (grade === 'all') return uniqueDivisionsWithAssignments;
    return Array.from(new Set(
      divisions
        .filter(d => d.className === grade && d.subjects && d.subjects.length > 0)
        .map(d => d.name)
    )).filter(Boolean).sort();
  }, [divisions, uniqueDivisionsWithAssignments]);

  // Reset division filter when grade filter changes
  useEffect(() => {
    if (subjectGradeFilter !== 'all') {
      const availableDivisions = getDivisionsForGrade(subjectGradeFilter);
      if (!availableDivisions.includes(subjectDivisionFilter)) {
        setSubjectDivisionFilter('all');
      }
    }
  }, [subjectGradeFilter, subjectDivisionFilter, divisions, getDivisionsForGrade]);

  // Filtered divisions for subjects tab based on both grade and division filters
  const filteredDivisionsForSubjects = divisions.filter(division => {
    const gradeMatch = subjectGradeFilter === 'all' || division.className === subjectGradeFilter;
    const divisionMatch = subjectDivisionFilter === 'all' || division.name === subjectDivisionFilter;
    return gradeMatch && divisionMatch;
  });



  return (
    <div className="p-4 md:p-8">
      <Tabs defaultValue="years" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="years">{t('academicSetup.tabs.years', 'Academic Years')}</TabsTrigger>
          <TabsTrigger value="divisions">{t('academicSetup.tabs.divisions', 'Classes & Divisions')}</TabsTrigger>
          <TabsTrigger value="subjects">{t('academicSetup.tabs.subjects', 'Subjects')}</TabsTrigger>
        </TabsList>

        {/* Academic Years Tab */}
        <TabsContent value="years">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('academicSetup.years.title', 'Academic Years')}</CardTitle>
              <Button onClick={handleAddAcademicYear}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('academicSetup.years.add', 'Add Academic Year')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('academicSetup.cols.name', 'Name')}</TableHead>
                    <TableHead>{t('academicSetup.cols.startDate', 'Start Date')}</TableHead>
                    <TableHead>{t('academicSetup.cols.endDate', 'End Date')}</TableHead>
                    <TableHead>{t('academicSetup.cols.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
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
                          {year.is_active ? t('academicSetup.status.active', 'Active') : t('academicSetup.status.inactive', 'Inactive')}
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
                <CardTitle>{t('academicSetup.classLevels.title', 'Class Levels')}</CardTitle>
                <Button onClick={handleAddClassLevel}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('academicSetup.classLevels.add', 'Add Class')}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingClassLevels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>{t('academicSetup.loading.classLevels', 'Loading class levels...')}</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('academicSetup.cols.name', 'Name')}</TableHead>
                        <TableHead>{t('academicSetup.cols.sequence', 'Sequence')}</TableHead>
                        <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
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
                <CardTitle>{t('academicSetup.divisions.title', 'Divisions')}</CardTitle>
                <Button onClick={handleAddDivision}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('academicSetup.divisions.add', 'Add Division')}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Grade Filter */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Label htmlFor="gradeFilter" className="text-sm font-medium mb-2 block">{t('academicSetup.filters.grade', 'Filter by Grade:')}</Label>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={t('academicSetup.allGrades', 'All Grades')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('academicSetup.allGrades', 'All Grades')}</SelectItem>
                        {allUniqueGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('pagination.showing', 'Showing')} {filteredDivisions.length} {t('pagination.of', 'of')} {divisions.length} {t('academicSetup.divisions.labelLower', 'divisions')}
                  </div>
                </div>
                {loadingDivisions || loadingTeachers || loadingClassLevels ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>{t('academicSetup.loading.classDivisions', 'Loading class divisions...')}</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('academicSetup.cols.grade', 'Grade')}</TableHead>
                        <TableHead>{t('academicSetup.cols.division', 'Division')}</TableHead>
                        <TableHead>{t('academicSetup.cols.classTeacher', 'Class Teacher')}</TableHead>
                        <TableHead>{t('academicSetup.cols.students', 'Students')}</TableHead>
                        <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDivisions.length > 0 ? (
                        filteredDivisions.map((division) => (
                          <TableRow key={division.id}>
                            <TableCell className="font-medium">{division.className || 'N/A'}</TableCell>
                            <TableCell>{division.name}</TableCell>
                            <TableCell>
                              {division.teacherName ? (
                                <Badge variant="default">{division.teacherName}</Badge>
                              ) : (
                                <Badge variant="secondary">{t('academicSetup.notAssigned', 'Not assigned')}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{division.studentCount || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleEditDivision(division)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="text-gray-500">
                              {gradeFilter === 'all' 
                                ? t('academicSetup.empty.noDivisions', 'No divisions found') 
                                : `${t('academicSetup.empty.noDivisionsFor', 'No divisions found for')} ${gradeFilter}`
                              }
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
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
                <CardTitle>{t('academicSetup.subjects.title', 'Subjects')}</CardTitle>
                <Button onClick={handleAddSubject}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('academicSetup.subjects.add', 'Add Subject')}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSubjects || loadingTeachers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>{t('academicSetup.loading.subjects', 'Loading subjects...')}</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('academicSetup.cols.code', 'Code')}</TableHead>
                        <TableHead>{t('academicSetup.cols.name', 'Name')}</TableHead>
                        <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
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
                  <CardTitle>{t('academicSetup.subjectTab.divisionSubjectAssignments', 'Division-Subject Assignments')}</CardTitle>
                  <CardDescription>{t('academicSetup.subjectTab.subjectsAssignedToDivision', 'Subjects assigned to each division')}</CardDescription>
                </div>
                <Button onClick={handleAddClassSubject}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('academicSetup.subjectTab.assignSubjectButton', 'Assign Subject')}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Grade and Division Filters */}
                <div className="mb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label htmlFor="subjectGradeFilter" className="text-sm font-medium mb-2 block">{t('academicSetup.subjectTab.filterByGrade', 'Filter by Grade:')}</Label>
                      <Select value={subjectGradeFilter} onValueChange={setSubjectGradeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('academicSetup.subjectTab.allGrades', 'All Grades')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('academicSetup.subjectTab.allGrades', 'All Grades')}</SelectItem>
                          {uniqueGradesWithAssignments.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="subjectDivisionFilter" className="text-sm font-medium mb-2 block">{t('academicSetup.subjectTab.filterByDivision', 'Filter by Division:')}</Label>
                      <Select 
                        value={subjectDivisionFilter} 
                        onValueChange={setSubjectDivisionFilter}
                        disabled={subjectGradeFilter !== 'all' && getDivisionsForGrade(subjectGradeFilter).length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('academicSetup.subjectTab.allDivisions', 'All Divisions')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('academicSetup.subjectTab.allDivisions', 'All Divisions')}</SelectItem>
                          {getDivisionsForGrade(subjectGradeFilter).map((division) => (
                            <SelectItem key={division} value={division}>
                              {division}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {t('academicSetup.assignments.showing', 'Showing assignments for')} {filteredDivisionsForSubjects.length} {t('academicSetup.divisions.labelLower', 'divisions')}
                    </div>
                    {(subjectGradeFilter !== 'all' || subjectDivisionFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSubjectGradeFilter('all');
                          setSubjectDivisionFilter('all');
                        }}
                        className="text-xs"
                      >
                        {t('academicSetup.filters.clear', 'Clear Filters')}
                      </Button>
                    )}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('academicSetup.cols.grade', 'Grade')}</TableHead>
                      <TableHead>{t('academicSetup.cols.division', 'Division')}</TableHead>
                      <TableHead>{t('academicSetup.cols.subject', 'Subject')}</TableHead>
                      <TableHead>{t('academicSetup.cols.teacher', 'Teacher')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDivisionsForSubjects.length > 0 ? (
                      filteredDivisionsForSubjects.flatMap((division) => 
                        division.subjects.map((subject: { id: string; name: string; code: string }, index: number) => {
                          // Find the teacher for this subject
                          const subjectTeacher = division.subjectTeachers?.find((st) => 
                            st.subject === subject.name
                          );
                          
                          return (
                            <TableRow key={`${division.id}-${subject.id}-${index}`}>
                              <TableCell>{division.className || t('students.na', 'N/A')}</TableCell>
                              <TableCell>{division.name}</TableCell>
                              <TableCell>{subject.name}</TableCell>
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
                                    {t('academicSetup.assignments.assignTeacher', 'Assign Teacher')}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="text-gray-500">
                            {subjectGradeFilter === 'all' && subjectDivisionFilter === 'all'
                              ? t('academicSetup.assignments.empty', 'No subject assignments found')
                              : t('academicSetup.assignments.emptyFiltered', 'No subject assignments found for the selected filters')
                            }
                          </div>
                        </TableCell>
                      </TableRow>
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
            <DialogTitle>{isEditingAcademicYear ? t('academicSetup.years.edit', 'Edit Academic Year') : t('academicSetup.years.add', 'Add Academic Year')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yearName">{t('academicSetup.years.yearName', 'Year Name')}</Label>
              <Input 
                id="yearName" 
                value={currentAcademicYear?.year_name || ''} 
                onChange={(e) => handleAcademicYearChange('year_name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('academicSetup.cols.startDate', 'Start Date')}</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={currentAcademicYear?.start_date || ''} 
                onChange={(e) => handleAcademicYearChange('start_date', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('academicSetup.cols.endDate', 'End Date')}</Label>
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
              <Label htmlFor="isActive">{t('academicSetup.years.setActive', 'Set as Active Year')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAcademicYearDialogOpen(false)}>{t('actions.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveAcademicYear}>{t('actions.save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Division Dialog */}
      <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingDivision ? t('academicSetup.divisions.edit', 'Edit Division') : t('academicSetup.divisions.add', 'Add Division')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">{t('academicSetup.cols.class', 'Class')}</Label>
              <Select 
                value={currentDivision?.className || ''} 
                onValueChange={(value) => handleDivisionChange('className', value)}
                disabled={isEditingDivision}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectClass', 'Select a class')} />
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
              <Label htmlFor="divisionName">{t('academicSetup.divisions.divisionName', 'Division Name')}</Label>
              <Input 
                id="divisionName" 
                value={currentDivision?.name || ''} 
                onChange={(e) => handleDivisionChange('name', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">{t('academicSetup.divisions.assignClassTeacher', 'Assign Class Teacher')}</Label>
              <Select 
                value={currentDivision?.teacherId || ''} 
                onValueChange={(value) => handleDivisionChange('teacherId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectTeacher', 'Select a teacher')} />
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
            <Button variant="ghost" onClick={() => setIsDivisionDialogOpen(false)}>{t('actions.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveDivision} disabled={loadingClassLevels || !currentDivision?.className || !currentDivision?.name}>{t('actions.save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingSubject ? t('academicSetup.subjects.edit', 'Edit Subject') : t('academicSetup.subjects.add', 'Add Subject')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectCode">{t('academicSetup.subjects.code', 'Subject Code')}</Label>
              <Input 
                id="subjectCode" 
                value={currentSubject?.code || ''} 
                onChange={(e) => handleSubjectChange('code', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName">{t('academicSetup.subjects.name', 'Subject Name')}</Label>
              <Input 
                id="subjectName" 
                value={currentSubject?.name || ''} 
                onChange={(e) => handleSubjectChange('name', e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSubjectDialogOpen(false)}>{t('actions.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveSubject}>{t('actions.save', 'Save')}</Button>
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
            <DialogTitle>{t('academicSetup.assignments.assignSubjectDialog', 'Assign Subject to Class Division')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classDivision">{t('academicSetup.cols.classDivision', 'Class Division')}</Label>
              <Select 
                value={selectedClassDivision} 
                onValueChange={setSelectedClassDivision}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectClassDivision', 'Select a class division')} />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem 
                      key={division.id} 
                      value={division.id}
                    >
                      {division.className} - {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t('academicSetup.cols.subject', 'Subject')}</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectSubject', 'Select a subject')} />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    // Filter out subjects that are already assigned to this division
                    .filter(subject => {
                      // Find the selected division
                      const selectedDivision = divisions.find(d => d.id === selectedClassDivision);
                      // Check if this subject is already assigned to the division
                      return !selectedDivision?.subjects?.some((assignedSubject: { id: string; name: string; code: string }) => 
                        assignedSubject.name === subject.name || assignedSubject.id === subject.id
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
              <Label htmlFor="subjectTeacher">{t('academicSetup.assignments.subjectTeacherOptional', 'Subject Teacher (Optional)')}</Label>
              <Select 
                value={selectedSubjectTeacher || "none"} 
                onValueChange={(value) => setSelectedSubjectTeacher(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectTeacher', 'Select a teacher')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('academicSetup.noTeacherAssigned', 'No teacher assigned')}</SelectItem>
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
            <Button variant="ghost" onClick={() => setIsClassSubjectDialogOpen(false)} disabled={isAssigningSubject}>{t('actions.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveClassSubject} disabled={isAssigningSubject}>
              {isAssigningSubject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('actions.assigning', 'Assigning...')}
                </>
              ) : (
                t('actions.assign', 'Assign')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Teacher Assignment Dialog */}
      <Dialog open={isSubjectTeacherDialogOpen} onOpenChange={setIsSubjectTeacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academicSetup.assignments.assignTeacherDialog', 'Assign Teacher to Subject')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>{t('academicSetup.cols.classDivision', 'Class Division')}</Label>
              <div className="text-sm font-medium">
                {selectedDivision?.className} - {selectedDivision?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('academicSetup.cols.subject', 'Subject')}</Label>
              <div className="text-sm font-medium">
                {editingSubject}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">{t('academicSetup.cols.teacher', 'Teacher')}</Label>
              <Select
                value={selectedTeacher || "none"}
                onValueChange={(value) => setSelectedTeacher(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('academicSetup.placeholders.selectTeacher', 'Select a teacher')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('academicSetup.noTeacherAssigned', 'No teacher assigned')}</SelectItem>
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
            <Button variant="ghost" onClick={() => setIsSubjectTeacherDialogOpen(false)}>{t('actions.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveSubjectTeacher}>{t('actions.save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
