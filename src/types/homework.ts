// src/types/homework.ts

export interface Teacher {
  id: string;
  full_name: string;
}

export interface Level {
  name: string;
  sequence_number: number;
}

export interface ClassDivision {
  id: string;
  level: Level;
  division: string;
}

export interface Attachment {
  id: string;
  homework_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  download_url?: string;
  download_endpoint?: string;
  uploader?: {
    id: string;
    role: string;
    full_name: string;
  };
}

export type HomeworkTargetType = 'class' | 'students';

export interface HomeworkStudentTarget {
  id: string;
  student_id: string;
  student?: {
    id: string;
    full_name: string;
    admission_number: string;
  };
}

export interface Homework {
  id: string;
  class_division_id: string;
  teacher_id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string | null;
  target_type?: HomeworkTargetType;
  target_student_ids?: string[];
  student_targets?: HomeworkStudentTarget[];
  created_at: string;
  teacher: Teacher;
  class_division: ClassDivision;
  attachments: Attachment[];
}
