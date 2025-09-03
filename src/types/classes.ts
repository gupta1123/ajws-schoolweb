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
  class_level: ClassLevel;
  teacher: Teacher | null;
  student_count: number;
}

export interface AcademicYear {
  id: string;
  year_name: string;
}

export interface ClassDivisionReference {
  id: string;
  division: string;
  class_level: ClassLevel;
  teacher: Teacher | null;
  academic_year: AcademicYear;
}

export interface StudentAcademicRecord {
  id: string;
  status: string;
  roll_number: string;
  class_division_id: string;
  class_division?: ClassDivisionReference;
}

export interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  date_of_birth: string;
  status: string;
  student_academic_records: StudentAcademicRecord[];
}