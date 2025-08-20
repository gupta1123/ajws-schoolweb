// src/types/classes.ts

export interface ClassLevel {
  id: string;
  name: string;
  sequence_number: number;
}

export interface Teacher {
  id: string;
  full_name: string;
}

export interface ClassDivision {
  id: string;
  division: string;
  level: ClassLevel;
  teacher: Teacher | null;
  student_count: number;
}

export interface StudentAcademicRecord {
  id: string;
  status: string;
  roll_number: string;
  class_division_id: string;
}

export interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  date_of_birth: string;
  status: string;
  student_academic_records: StudentAcademicRecord[];
}