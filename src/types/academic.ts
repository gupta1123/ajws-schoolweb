// Academic Structure Types

export interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  sequence_number: number;
  created_at: string;
}

export interface ClassDivision {
  id: string;
  academic_year_id: string;
  class_level_id: string;
  division: string;
  teacher_id?: string;
  created_at: string;
  academic_year?: {
    year_name: string;
  };
  class_level?: {
    name: string;
    sequence_number: number;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

export interface Teacher {
  teacher_id: string;
  user_id: string;
  staff_id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  department: string;
  designation: string;
  is_active: boolean;
}

export interface TeacherAssignment {
  id: string;
  class_division_id: string;
  teacher_id: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  teacher?: Teacher;
  class_division?: ClassDivision;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  class_division_id?: string;
  class_division?: ClassDivision;
}

export interface AcademicStructure {
  academic_years: AcademicYear[];
  class_levels: ClassLevel[];
  class_divisions: ClassDivision[];
  teachers: Teacher[];
  teacher_assignments: TeacherAssignment[];
  subjects: Subject[];
}

export interface CreateAcademicYearRequest {
  year_name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface UpdateAcademicYearRequest {
  year_name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface CreateClassLevelRequest {
  name: string;
  sequence_number: number;
}

export interface UpdateClassLevelRequest {
  name?: string;
  sequence_number?: number;
}

export interface CreateClassDivisionRequest {
  academic_year_id: string;
  class_level_id: string;
  division: string;
  teacher_id?: string;
}

export interface UpdateClassDivisionRequest {
  division?: string;
  teacher_id?: string;
}

export interface CreateTeacherAssignmentRequest {
  class_division_id: string;
  teacher_id: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  subject?: string; // Required for subject_teacher assignments
  is_primary?: boolean;
  assignment_id?: string; // Optional assignment ID for updates or specific cases
}

export interface UpdateTeacherAssignmentRequest {
  assignment_type?: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary?: boolean;
  assignment_id?: string;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
}

export interface UpdateSubjectRequest {
  code?: string;
  name?: string;
}

export interface BulkTeacherAssignmentRequest {
  assignments: CreateTeacherAssignmentRequest[];
}

export interface AcademicStructureStatistics {
  total_grades: number;
  total_sections: number;
  total_teachers: number;
  total_students: number;
  unassigned_sections: number;
  active_academic_year: string;
}

export interface StructureConflict {
  id: string;
  type: 'teacher_overload' | 'missing_assignment' | 'invalid_sequence' | 'duplicate_division';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affected_entities: string[];
  suggested_fix?: string;
}

export interface CopyStructureRequest {
  from_year_id: string;
  to_year_id: string;
  include_teachers?: boolean;
  include_subjects?: boolean;
}

export interface AcademicStructureHealth {
  overall_health: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: StructureConflict[];
  recommendations: string[];
}
