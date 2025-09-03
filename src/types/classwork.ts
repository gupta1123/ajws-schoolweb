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
  teacher?: {
    id: string;
    full_name: string;
  };
  class_division?: {
    id: string;
    level: {
      name: string;
      sequence_number: number;
    };
    division: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    file_type?: string;
    file_size?: number;
  }>;
  topics?: Array<{
    id: string;
    topic_name: string;
    topic_description: string | null;
  }>;
}