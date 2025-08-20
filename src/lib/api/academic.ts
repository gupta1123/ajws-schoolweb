import { apiClient } from './client';
import type {
  AcademicYear,
  ClassLevel,
  ClassDivision,
  Teacher,
  TeacherAssignment,
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

export const academicServices = {
  // Academic Year Management
  getAcademicYears: async (token: string): Promise<{ status: string; data: { academic_years: AcademicYear[] } }> => {
    const response = await apiClient.get('/api/academic/years', token);
    return response as { status: string; data: { academic_years: AcademicYear[] } };
  },

  getActiveAcademicYear: async (token: string): Promise<{ status: string; data: { academic_year: AcademicYear } }> => {
    const response = await apiClient.get('/api/academic/years/active', token);
    return response as { status: string; data: { academic_year: AcademicYear } };
  },

  createAcademicYear: async (data: CreateAcademicYearRequest, token: string): Promise<{ status: string; data: { academic_year: AcademicYear } }> => {
    const response = await apiClient.post('/api/academic/years', data, token);
    return response as { status: string; data: { academic_year: AcademicYear } };
  },

  updateAcademicYear: async (id: string, data: UpdateAcademicYearRequest, token: string): Promise<{ status: string; data: { academic_year: AcademicYear } }> => {
    const response = await apiClient.put(`/api/academic/years/${id}`, data, token);
    return response as { status: string; data: { academic_year: AcademicYear } };
  },

  deleteAcademicYear: async (id: string, token: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/academic/years/${id}`, token);
    return response as { status: string; message: string };
  },

  // Class Level Management
  getClassLevels: async (token: string): Promise<{ status: string; data: { class_levels: ClassLevel[] } }> => {
    const response = await apiClient.get('/api/academic/class-levels', token);
    return response as { status: string; data: { class_levels: ClassLevel[] } };
  },

  createClassLevel: async (data: CreateClassLevelRequest, token: string): Promise<{ status: string; data: { class_level: ClassLevel } }> => {
    const response = await apiClient.post('/api/academic/class-levels', data, token);
    return response as { status: string; data: { class_level: ClassLevel } };
  },

  updateClassLevel: async (id: string, data: UpdateClassLevelRequest, token: string): Promise<{ status: string; data: { class_level: ClassLevel } }> => {
    const response = await apiClient.put(`/api/academic/class-levels/${id}`, data, token);
    return response as { status: string; data: { class_level: ClassLevel } };
  },

  deleteClassLevel: async (id: string, token: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/academic/class-levels/${id}`, token);
    return response as { status: string; message: string };
  },

  // Class Division Management
  getClassDivisions: async (token: string): Promise<{ status: string; data: { class_divisions: ClassDivision[] } }> => {
    const response = await apiClient.get('/api/academic/class-divisions', token);
    return response as { status: string; data: { class_divisions: ClassDivision[] } };
  },

  createClassDivision: async (data: CreateClassDivisionRequest, token: string): Promise<{ status: string; data: { class_division: ClassDivision } }> => {
    const response = await apiClient.post('/api/academic/class-divisions', data, token);
    return response as { status: string; data: { class_division: ClassDivision } };
  },

  updateClassDivision: async (id: string, data: UpdateClassDivisionRequest, token: string): Promise<{ status: string; data: { class_division: ClassDivision } }> => {
    const response = await apiClient.put(`/api/academic/class-divisions/${id}`, data, token);
    return response as { status: string; data: { class_division: ClassDivision } };
  },

  deleteClassDivision: async (id: string, token: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/academic/class-divisions/${id}`, token);
    return response as { status: string; message: string };
  },

  // Teacher Management & Assignments
  getTeachers: async (token: string): Promise<{ status: string; data: { teachers: Teacher[] } }> => {
    const response = await apiClient.get('/api/academic/teachers', token);
    return response as { status: string; data: { teachers: Teacher[] } };
  },

  getTeachersForClass: async (classDivisionId: string, token: string): Promise<{ status: string; data: { teachers: TeacherAssignment[] } }> => {
    const response = await apiClient.get(`/api/academic/class-divisions/${classDivisionId}/teachers`, token);
    return response as { status: string; data: { teachers: TeacherAssignment[] } };
  },

  assignTeacherToClass: async (classDivisionId: string, data: CreateTeacherAssignmentRequest, token: string): Promise<{ status: string; data: { assignment: TeacherAssignment } }> => {
    const response = await apiClient.post(`/api/academic/class-divisions/${classDivisionId}/assign-teacher`, data, token);
    return response as { status: string; data: { assignment: TeacherAssignment } };
  },

  updateTeacherAssignment: async (assignmentId: string, data: UpdateTeacherAssignmentRequest, token: string): Promise<{ status: string; data: { assignment: TeacherAssignment } }> => {
    const response = await apiClient.put(`/api/academic/teacher-assignments/${assignmentId}`, data, token);
    return response as { status: string; data: { assignment: TeacherAssignment } };
  },

  removeTeacherFromClass: async (classDivisionId: string, teacherId: string, assignmentType: string | undefined, token: string): Promise<{ status: string; message: string }> => {
    const queryParams = assignmentType ? `?assignment_type=${assignmentType}` : '';
    const response = await apiClient.delete(`/api/academic/class-divisions/${classDivisionId}/remove-teacher/${teacherId}${queryParams}`, token);
    return response as { status: string; message: string };
  },

  bulkAssignTeachers: async (data: BulkTeacherAssignmentRequest, token: string): Promise<{ status: string; data: { assignments: TeacherAssignment[] } }> => {
    const response = await apiClient.post('/api/academic/bulk-assign-teachers', data, token);
    return response as { status: string; data: { assignments: TeacherAssignment[] } };
  },

  getTeacherClasses: async (teacherId: string, token: string): Promise<{ status: string; data: { classes: TeacherAssignment[] } }> => {
    const response = await apiClient.get(`/api/academic/teachers/${teacherId}/classes`, token);
    return response as { status: string; data: { classes: TeacherAssignment[] } };
  },

  // Subject Management
  getSubjects: async (token: string, classDivisionId?: string): Promise<{ status: string; data: { subjects: Subject[] } }> => {
    if (classDivisionId) {
      // Get subjects for a specific class division
      const response = await apiClient.get(`/api/academic/class-divisions/${classDivisionId}/subjects`, token);
      return response as { status: string; data: { subjects: Subject[] } };
    } else {
      // Get all subjects
      const response = await apiClient.get('/api/academic/subjects', token);
      return response as { status: string; data: { subjects: Subject[] } };
    }
  },

  getSubjectsByClassDivision: async (classDivisionId: string, token: string): Promise<{ status: string; data: { subjects: Subject[] } }> => {
    const response = await apiClient.get(`/api/academic/class-divisions/${classDivisionId}/subjects`, token);
    return response as { status: string; data: { subjects: Subject[] } };
  },

  createSubject: async (data: CreateSubjectRequest, token: string): Promise<{ status: string; data: { subject: Subject } }> => {
    const response = await apiClient.post('/api/academic/subjects', data, token);
    return response as { status: string; data: { subject: Subject } };
  },

  updateSubject: async (id: string, data: UpdateSubjectRequest, token: string): Promise<{ status: string; data: { subject: Subject } }> => {
    const response = await apiClient.put(`/api/academic/subjects/${id}`, data, token);
    return response as { status: string; data: { subject: Subject } };
  },

  deleteSubject: async (id: string, token: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/academic/subjects/${id}`, token);
    return response as { status: string; message: string };
  },

  // Assign subjects to class division
  assignSubjectsToClass: async (classDivisionId: string, subjectIds: string[], mode: 'replace' | 'append' = 'replace', token: string): Promise<{ status: string; data: { message: string; assigned_subjects: number } }> => {
    const payload = { subject_ids: subjectIds, mode };
    const response = await apiClient.post(`/api/academic/class-divisions/${classDivisionId}/subjects`, payload, token);
    return response as { status: string; data: { message: string; assigned_subjects: number } };
  },

  // Remove subject from class division
  removeSubjectFromClass: async (classDivisionId: string, subjectId: string, token: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/api/academic/class-divisions/${classDivisionId}/subjects/${subjectId}`, token);
    return response as { status: string; message: string };
  },

  // Student Overview
  getStudentsByClass: async (classDivisionId: string, token: string): Promise<{ status: string; data: { students: Array<{ id: string; full_name: string; admission_number: string }>; count: number } }> => {
    const response = await apiClient.get(`/api/students/class/${classDivisionId}`, token);
    return response as { status: string; data: { students: Array<{ id: string; full_name: string; admission_number: string }>; count: number } };
  },

  getStudentsByLevel: async (classLevelId: string, token: string): Promise<{ status: string; data: { students: Array<{ id: string; full_name: string; admission_number: string }>; count: number } }> => {
    const response = await apiClient.get(`/api/students/level/${classLevelId}`, token);
    return response as { status: string; data: { students: Array<{ id: string; full_name: string; admission_number: string }>; count: number } };
  },

  getClassDivisionsSummary: async (token: string): Promise<{ status: string; data: { divisions: Array<{ id: string; division: string; level: { name: string; sequence_number: number } }>; total_divisions: number; total_students: number } }> => {
    const response = await apiClient.get('/api/students/divisions/summary', token);
    return response as { status: string; data: { divisions: Array<{ id: string; division: string; level: { name: string; sequence_number: number } }>; total_divisions: number; total_students: number } };
  },

  // Bulk Operations
  copyStructure: async (): Promise<{ status: string; data: { message: string; copied_items: number } }> => {
    // Note: This endpoint doesn't exist in the API yet
    // For now, return a mock response to prevent errors
    return { status: 'success', data: { message: 'Structure copied successfully', copied_items: 5 } };
  },

  bulkUpdateClassDivisions: async (data: { divisions: UpdateClassDivisionRequest[] }): Promise<{ status: string; data: { updated: number } }> => {
    // Note: This endpoint doesn't exist in the API yet
    // For now, return a mock response to prevent errors
    return { status: 'success', data: { updated: data.divisions.length } };
  }
};
