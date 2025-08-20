// src/types/classwork.ts

export interface Classwork {
  id: string;
  class_division_id: string;
  teacher_id: string;
  subject: string;
  summary: string;
  topics_covered: string[];
  date: string;
  is_shared_with_parents: boolean;
  created_at: string;
  updated_at: string;
}