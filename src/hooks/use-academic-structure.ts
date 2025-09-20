import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { academicServices } from '@/lib/api';
import type { 
  AcademicYear, 
  ClassLevel, 
  ClassDivision, 
  Teacher, 
  Subject, 
  CreateAcademicYearRequest, 
  UpdateAcademicYearRequest, 
  CreateClassLevelRequest, 
  UpdateClassLevelRequest, 
  CreateClassDivisionRequest, 
  UpdateClassDivisionRequest, 
  CreateTeacherAssignmentRequest, 
  UpdateTeacherAssignmentRequest, 
  CreateSubjectRequest, 
  UpdateSubjectRequest, 
  BulkTeacherAssignmentRequest
} from '@/types/academic';

interface UseAcademicStructureReturn {
  // Data states
  academicYears: AcademicYear[];
  classLevels: ClassLevel[];
  classDivisions: ClassDivision[];
  teachers: Teacher[]; // Note: This needs a dedicated API endpoint for all teachers
  subjects: Subject[];
  
  // Loading states
  loading: boolean;
  loadingAcademicYears: boolean;
  loadingClassLevels: boolean;
  loadingClassDivisions: boolean;
  loadingTeachers: boolean;
  loadingSubjects: boolean;
  
  // Error states
  error: string | null;
  errorAcademicYears: string | null;
  errorClassLevels: string | null;
  errorClassDivisions: string | null;
  errorTeachers: string | null;
  errorSubjects: string | null;
  
  // Actions
  clearError: () => void;
  clearErrorAcademicYears: () => void;
  clearErrorClassLevels: () => void;
  clearErrorClassDivisions: () => void;
  clearErrorTeachers: () => void;
  clearErrorSubjects: () => void;
  
  // Fetch functions
  fetchAcademicYears: () => Promise<void>;
  fetchClassLevels: () => Promise<void>;
  fetchClassDivisions: (academicYearId?: string) => Promise<void>;
  fetchTeachers: () => Promise<void>;
  fetchSubjects: (classDivisionId?: string) => Promise<void>;
  fetchSubjectsByClassDivision: (classDivisionId: string) => Promise<Subject[]>;
  getClassDivisionTeachers: (classDivisionId: string) => Promise<{ class_division: { id: string; division: string; class_name: string; academic_year: string; sequence_number: number }; teacher: { teacher_id: string; user_id: string; staff_id: string; full_name: string; phone_number: string; email: string | null; department: string; designation: string }; is_assigned: boolean } | null>;
  
  // CRUD operations
  createAcademicYear: (data: CreateAcademicYearRequest) => Promise<boolean>;
  updateAcademicYear: (id: string, data: UpdateAcademicYearRequest) => Promise<boolean>;
  deleteAcademicYear: (id: string) => Promise<boolean>;
  
  createClassLevel: (data: CreateClassLevelRequest) => Promise<boolean>;
  updateClassLevel: (id: string, data: UpdateClassLevelRequest) => Promise<boolean>;
  deleteClassLevel: (id: string) => Promise<boolean>;
  
  createClassDivision: (data: CreateClassDivisionRequest) => Promise<boolean>;
  updateClassDivision: (id: string, data: UpdateClassDivisionRequest) => Promise<boolean>;
  deleteClassDivision: (id: string) => Promise<boolean>;
  
  assignTeacherToClass: (classDivisionId: string, data: CreateTeacherAssignmentRequest) => Promise<boolean>;
  updateTeacherAssignment: (assignmentId: string, data: UpdateTeacherAssignmentRequest) => Promise<boolean>;
  removeTeacherFromClass: (classDivisionId: string, teacherId: string, assignmentType?: string) => Promise<boolean>;
  reassignSubjectTeacher: (classDivisionId: string, assignmentId: string, newTeacherId: string) => Promise<boolean>;
  bulkAssignTeachers: (data: BulkTeacherAssignmentRequest) => Promise<boolean>;
  
  createSubject: (data: CreateSubjectRequest) => Promise<boolean>;
  updateSubject: (id: string, data: UpdateSubjectRequest) => Promise<boolean>;
  deleteSubject: (id: string) => Promise<boolean>;
  assignSubjectsToClass: (classDivisionId: string, subjectIds: string[], mode?: 'replace' | 'append') => Promise<boolean>;
  removeSubjectFromClass: (classDivisionId: string, subjectId: string) => Promise<boolean>;
  
  copyStructure: () => Promise<boolean>;
  
  // Utility functions
  refreshAll: () => Promise<void>;
  refreshIndividual: () => Promise<void>;
  fetchDivisionsWithSummary: () => Promise<void>;
}

export const useAcademicStructure = (): UseAcademicStructureReturn => {
  const { token } = useAuth();
  
  // Data states
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Note: This needs a dedicated API endpoint for all teachers
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false); // General loading
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [loadingClassLevels, setLoadingClassLevels] = useState(false);
  const [loadingClassDivisions, setLoadingClassDivisions] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [errorAcademicYears, setErrorAcademicYears] = useState<string | null>(null);
  const [errorClassLevels, setErrorClassLevels] = useState<string | null>(null);
  const [errorClassDivisions, setErrorClassDivisions] = useState<string | null>(null);
  const [errorTeachers, setErrorTeachers] = useState<string | null>(null);
  const [errorSubjects, setErrorSubjects] = useState<string | null>(null);
  
  // Clear error functions
  const clearError = useCallback(() => setError(null), []);
  const clearErrorAcademicYears = useCallback(() => setErrorAcademicYears(null), []);
  const clearErrorClassLevels = useCallback(() => setErrorClassLevels(null), []);
  const clearErrorClassDivisions = useCallback(() => setErrorClassDivisions(null), []);
  const clearErrorTeachers = useCallback(() => setErrorTeachers(null), []);
  const clearErrorSubjects = useCallback(() => setErrorSubjects(null), []);
  
  // Fetch functions
  const fetchAcademicYears = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingAcademicYears(true);
      setErrorAcademicYears(null);

      const response = await academicServices.getAcademicYears(token);

      if (response.status === 'success') {
        setAcademicYears(response.data.academic_years);
      } else {
        setErrorAcademicYears('Failed to fetch academic years');
      }
    } catch (err) {
      console.error('Fetch academic years error:', err);
      setErrorAcademicYears(err instanceof Error ? err.message : 'Failed to fetch academic years');
    } finally {
      setLoadingAcademicYears(false);
    }
  }, [token]);
  
  const fetchClassLevels = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingClassLevels(true);
      setErrorClassLevels(null);
      
      const response = await academicServices.getClassLevels(token);
      
      if (response.status === 'success') {
        setClassLevels(response.data.class_levels);
      } else {
        setErrorClassLevels('Failed to fetch class levels');
      }
    } catch (err) {
      console.error('Fetch class levels error:', err);
      setErrorClassLevels(err instanceof Error ? err.message : 'Failed to fetch class levels');
    } finally {
      setLoadingClassLevels(false);
    }
  }, [token]);
  
  // Enhanced function to fetch divisions with summary data
  const fetchDivisionsWithSummary = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingClassDivisions(true);
      setErrorClassDivisions(null);

      // Use the rich summary API instead of basic divisions API
      const response = await academicServices.getClassDivisionsSummary(token);

      if (response.status === 'success') {
        // Transform summary data to match expected ClassDivision format
        const transformedDivisions: ClassDivision[] = response.data.divisions.map(division => ({
          id: division.id,
          academic_year_id: 'current', // We'll get this from context
          class_level_id: `level-${division.level.sequence_number}`, // Generate a unique ID based on sequence
          division: division.division,
          teacher_id: division.class_teacher?.id || undefined,
          created_at: new Date().toISOString(),
          academic_year: {
            year_name: division.academic_year?.year_name || 'Current Year'
          },
          class_level: {
            name: division.level.name,
            sequence_number: division.level.sequence_number
          },
          teacher: division.class_teacher ? {
            id: division.class_teacher.id,
            full_name: division.class_teacher.name
          } : undefined
        }));

        setClassDivisions(transformedDivisions);

        // Extract unique teachers from summary data
        const allTeachers = new Map<string, Teacher>();
        response.data.divisions.forEach(division => {
          // Add class teacher
          if (division.class_teacher) {
            allTeachers.set(division.class_teacher.id, {
              teacher_id: division.class_teacher.id, // Fix: Use teacher_id instead of id
              user_id: division.class_teacher.id,
              staff_id: division.class_teacher.id,
              full_name: division.class_teacher.name,
              phone_number: '',
              email: undefined,
              department: '',
              designation: division.class_teacher.is_class_teacher ? 'Class Teacher' : 'Subject Teacher',
              is_active: true
            });
          }

          // Add subject teachers
          if (division.subject_teachers) {
            division.subject_teachers.forEach(st => {
              if (st.id && st.name) {
                allTeachers.set(st.id, {
                  teacher_id: st.id, // Fix: Use teacher_id instead of id
                  user_id: st.id,
                  staff_id: st.id,
                  full_name: st.name,
                  phone_number: '',
                  email: undefined,
                  department: '',
                  designation: 'Subject Teacher',
                  is_active: true
                });
              }
            });
          }
        });

        setTeachers(Array.from(allTeachers.values()));

        // Extract unique subjects from summary data
        const allSubjects = new Map<string, Subject>();
        response.data.divisions.forEach(division => {
          if (division.subjects) {
            division.subjects.forEach(subject => {
              allSubjects.set(subject.id, {
                id: subject.id,
                name: subject.name,
                code: subject.code,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            });
          }
        });

        setSubjects(Array.from(allSubjects.values()));
      } else {
        setErrorClassDivisions('Failed to fetch divisions summary');
      }
    } catch (err) {
      console.error('Fetch divisions with summary error:', err);
      setErrorClassDivisions(err instanceof Error ? err.message : 'Failed to fetch divisions summary');
    } finally {
      setLoadingClassDivisions(false);
    }
  }, [token]);

  // Keep the original function for backward compatibility
  const fetchClassDivisions = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingClassDivisions(true);
      setErrorClassDivisions(null);

      const response = await academicServices.getClassDivisions(token);

      if (response.status === 'success') {
        setClassDivisions(response.data.class_divisions);
      } else {
        setErrorClassDivisions('Failed to fetch class divisions');
      }
    } catch (err) {
      console.error('Fetch class divisions error:', err);
      setErrorClassDivisions(err instanceof Error ? err.message : 'Failed to fetch class divisions');
    } finally {
      setLoadingClassDivisions(false);
    }
  }, [token]);
  
  const fetchTeachers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoadingTeachers(true);
      setErrorTeachers(null);
      
      const response = await academicServices.getTeachers(token);
      
      if (response.status === 'success') {
        setTeachers(response.data.teachers);
      } else {
        setErrorTeachers('Failed to fetch teachers');
      }
    } catch (err) {
      console.error('Fetch teachers error:', err);
      setErrorTeachers(err instanceof Error ? err.message : 'Failed to fetch teachers');
    } finally {
      setLoadingTeachers(false);
    }
  }, [token]);
  
  const fetchSubjects = useCallback(async (classDivisionId?: string) => {
    if (!token) return;
    
    try {
      setLoadingSubjects(true);
      setErrorSubjects(null);
      
      if (classDivisionId) {
        // Get subjects for a specific class division
        const response = await academicServices.getSubjectsByClassDivision(classDivisionId, token);
        
        if (response.status === 'success') {
          setSubjects(response.data.subjects);
        } else {
          setErrorSubjects('Failed to fetch subjects for class division');
        }
      } else {
        // Get all global subjects
        const response = await academicServices.getSubjects(token);
        
        if (response.status === 'success') {
          setSubjects(response.data.subjects);
        } else {
          setErrorSubjects('Failed to fetch global subjects');
        }
      }
    } catch (err) {
      console.error('Fetch subjects error:', err);
      setErrorSubjects(err instanceof Error ? err.message : 'Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
    }
  }, [token]);

  const fetchSubjectsByClassDivision = useCallback(async (classDivisionId: string) => {
    if (!token) return [];

    try {
      setLoadingSubjects(true);
      setErrorSubjects(null);

      const response = await academicServices.getSubjectsByClassDivision(classDivisionId, token);

      if (response.status === 'success') {
        return response.data.subjects;
      } else {
        setErrorSubjects('Failed to fetch subjects by class division');
        return [];
      }
    } catch (err) {
      console.error('Fetch subjects by class division error:', err);
      setErrorSubjects(err instanceof Error ? err.message : 'Failed to fetch subjects by class division');
      return [];
    } finally {
      setLoadingSubjects(false);
    }
  }, [token]);

  const getClassDivisionTeachers = useCallback(async (classDivisionId: string) => {
    if (!token) return null;

    try {
      setLoadingTeachers(true);
      setErrorTeachers(null);

      const response = await academicServices.getClassDivisionTeachers(classDivisionId, token);

      if (response.status === 'success') {
        return response.data;
      } else {
        setErrorTeachers('Failed to fetch class division teachers');
        return null;
      }
    } catch (err) {
      console.error('Fetch class division teachers error:', err);
      setErrorTeachers(err instanceof Error ? err.message : 'Failed to fetch class division teachers');
      return null;
    } finally {
      setLoadingTeachers(false);
    }
  }, [token]);
  
  // CRUD operations
  const createAcademicYear = useCallback(async (data: CreateAcademicYearRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.createAcademicYear(data, token);
      
      if (response.status === 'success') {
        await fetchAcademicYears(); // Refresh the list
        return true;
      } else {
        setError('Failed to create academic year');
        return false;
      }
    } catch (err) {
      console.error('Create academic year error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create academic year');
      return false;
    }
  }, [token, fetchAcademicYears]);
  
  const updateAcademicYear = useCallback(async (id: string, data: UpdateAcademicYearRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.updateAcademicYear(id, data, token);
      
      if (response.status === 'success') {
        await fetchAcademicYears(); // Refresh the list
        return true;
      } else {
        setError('Failed to update academic year');
        return false;
      }
    } catch (err) {
      console.error('Update academic year error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update academic year');
      return false;
    }
  }, [token, fetchAcademicYears]);
  
  const deleteAcademicYear = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.deleteAcademicYear(id, token);
      
      if (response.status === 'success') {
        await fetchAcademicYears(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete academic year');
        return false;
      }
    } catch (err) {
      console.error('Delete academic year error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete academic year');
      return false;
    }
  }, [token, fetchAcademicYears]);
  
  const createClassLevel = useCallback(async (data: CreateClassLevelRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.createClassLevel(data, token);
      
      if (response.status === 'success') {
        await fetchClassLevels(); // Refresh the list
        return true;
      } else {
        setError('Failed to create class level');
        return false;
      }
    } catch (err) {
      console.error('Create class level error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class level');
      return false;
    }
  }, [token, fetchClassLevels]);
  
  const updateClassLevel = useCallback(async (id: string, data: UpdateClassLevelRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.updateClassLevel(id, data, token);
      
      if (response.status === 'success') {
        await fetchClassLevels(); // Refresh the list
        return true;
      } else {
        setError('Failed to update class level');
        return false;
      }
    } catch (err) {
      console.error('Update class level error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update class level');
      return false;
    }
  }, [token, fetchClassLevels]);
  
  const deleteClassLevel = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.deleteClassLevel(id, token);
      
      if (response.status === 'success') {
        await fetchClassLevels(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete class level');
        return false;
      }
    } catch (err) {
      console.error('Delete class level error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete class level');
      return false;
    }
  }, [token, fetchClassLevels]);
  
  const createClassDivision = useCallback(async (data: CreateClassDivisionRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.createClassDivision(data, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to create class division');
        return false;
      }
    } catch (err) {
      console.error('Create class division error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class division');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const updateClassDivision = useCallback(async (id: string, data: UpdateClassDivisionRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.updateClassDivision(id, data, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to update class division');
        return false;
      }
    } catch (err) {
      console.error('Update class division error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update class division');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const deleteClassDivision = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.deleteClassDivision(id, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete class division');
        return false;
      }
    } catch (err) {
      console.error('Delete class division error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete class division');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const assignTeacherToClass = useCallback(async (classDivisionId: string, data: CreateTeacherAssignmentRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.assignTeacherToClass(classDivisionId, data, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to assign teacher to class');
        return false;
      }
    } catch (err) {
      console.error('Assign teacher to class error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign teacher to class');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const updateTeacherAssignment = useCallback(async (assignmentId: string, data: UpdateTeacherAssignmentRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.updateTeacherAssignment(assignmentId, data, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to update teacher assignment');
        return false;
      }
    } catch (err) {
      console.error('Update teacher assignment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update teacher assignment');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const removeTeacherFromClass = useCallback(async (classDivisionId: string, teacherId: string, assignmentType?: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.removeTeacherFromClass(classDivisionId, teacherId, assignmentType, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to remove teacher from class');
        return false;
      }
    } catch (err) {
      console.error('Remove teacher from class error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove teacher from class');
      return false;
    }
  }, [token, fetchClassDivisions]);

  const reassignSubjectTeacher = useCallback(async (classDivisionId: string, assignmentId: string, newTeacherId: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.reassignSubjectTeacher(classDivisionId, assignmentId, newTeacherId, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to reassign subject teacher');
        return false;
      }
    } catch (err) {
      console.error('Reassign subject teacher error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reassign subject teacher');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const bulkAssignTeachers = useCallback(async (data: BulkTeacherAssignmentRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.bulkAssignTeachers(data, token);
      
      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to bulk assign teachers');
        return false;
      }
    } catch (err) {
      console.error('Bulk assign teachers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk assign teachers');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  const createSubject = useCallback(async (data: CreateSubjectRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.createSubject(data, token);
      
      if (response.status === 'success') {
        await fetchSubjects(); // Refresh the list
        return true;
      } else {
        setError('Failed to create subject');
        return false;
      }
    } catch (err) {
      console.error('Create subject error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      return false;
    }
  }, [token, fetchSubjects]);
  
  const updateSubject = useCallback(async (id: string, data: UpdateSubjectRequest): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.updateSubject(id, data, token);
      
      if (response.status === 'success') {
        await fetchSubjects(); // Refresh the list
        return true;
      } else {
        setError('Failed to update subject');
        return false;
      }
    } catch (err) {
      console.error('Update subject error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      return false;
    }
  }, [token, fetchSubjects]);
  
  const deleteSubject = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.deleteSubject(id, token);
      
      if (response.status === 'success') {
        await fetchSubjects(); // Refresh the list
        return true;
      } else {
        setError('Failed to delete subject');
        return false;
      }
    } catch (err) {
      console.error('Delete subject error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      return false;
    }
  }, [token, fetchSubjects]);

  const assignSubjectsToClass = useCallback(async (classDivisionId: string, subjectIds: string[], mode?: 'replace' | 'append'): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await academicServices.assignSubjectsToClass(classDivisionId, subjectIds, mode, token);

      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to assign subjects to class');
        return false;
      }
    } catch (err) {
      console.error('Assign subjects to class error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign subjects to class');
      return false;
    }
  }, [token, fetchClassDivisions]);

  const removeSubjectFromClass = useCallback(async (classDivisionId: string, subjectId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await academicServices.removeSubjectFromClass(classDivisionId, subjectId, token);

      if (response.status === 'success') {
        await fetchClassDivisions(); // Refresh the list
        return true;
      } else {
        setError('Failed to remove subject from class');
        return false;
      }
    } catch (err) {
      console.error('Remove subject from class error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove subject from class');
      return false;
    }
  }, [token, fetchClassDivisions]);
  
  // Utility functions
  const refreshAll = useCallback(async () => {
    setLoading(true);
    // Optimized: Use summary API to get divisions, teachers, and subjects in one call
    // But also fetch all teachers separately to get the complete list
    await Promise.all([
      fetchAcademicYears(),
      fetchClassLevels(),
      fetchDivisionsWithSummary(),
      fetchTeachers()  // Fetch all teachers separately
    ]);
    setLoading(false);
  }, [fetchAcademicYears, fetchClassLevels, fetchDivisionsWithSummary, fetchTeachers]);

  // Keep individual fetch functions for specific use cases
  const refreshIndividual = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAcademicYears(),
      fetchClassLevels(),
      fetchClassDivisions(),  // Original basic divisions
      fetchTeachers(),        // Original teachers
      fetchSubjects()         // Original subjects
    ]);
    setLoading(false);
  }, [fetchAcademicYears, fetchClassLevels, fetchClassDivisions, fetchTeachers, fetchSubjects]);
  
  const copyStructure = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await academicServices.copyStructure();
      
      if (response.status === 'success') {
        // Refresh all data after copying structure
        await refreshAll();
        return true;
      } else {
        setError('Failed to copy structure');
        return false;
      }
    } catch (err) {
      console.error('Copy structure error:', err);
      setError(err instanceof Error ? err.message : 'Failed to copy structure');
      return false;
    }
  }, [token, refreshAll]);
  
  // Initialize data when token is available
  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token, refreshAll]);
  
  return {
    // Data states
    academicYears,
    classLevels,
    classDivisions,
    teachers,
    subjects,
    
    // Loading states
    loading,
    loadingAcademicYears,
    loadingClassLevels,
    loadingClassDivisions,
    loadingTeachers,
    loadingSubjects,
    
    // Error states
    error,
    errorAcademicYears,
    errorClassLevels,
    errorClassDivisions,
    errorTeachers,
    errorSubjects,
    
    // Actions
    clearError,
    clearErrorAcademicYears,
    clearErrorClassLevels,
    clearErrorClassDivisions,
    clearErrorTeachers,
    clearErrorSubjects,
    
    // Fetch functions
    fetchAcademicYears,
    fetchClassLevels,
    fetchClassDivisions,
    fetchTeachers,
    fetchSubjects,
    fetchSubjectsByClassDivision,
    getClassDivisionTeachers,
    
    // CRUD operations
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    createClassLevel,
    updateClassLevel,
    deleteClassLevel,
    createClassDivision,
    updateClassDivision,
    deleteClassDivision,
    assignTeacherToClass,
    updateTeacherAssignment,
    removeTeacherFromClass,
    reassignSubjectTeacher,
    bulkAssignTeachers,
    createSubject,
    updateSubject,
    deleteSubject,
    assignSubjectsToClass,
    removeSubjectFromClass,
    copyStructure,
    
    // Utility functions
    refreshAll,
    refreshIndividual,
    fetchDivisionsWithSummary,
  };
};
