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
  filename: string;
  url: string;
}

export interface Homework {
  id: string;
  class_division_id: string;
  teacher_id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  teacher: Teacher;
  class_division: ClassDivision;
  attachments: Attachment[];
}