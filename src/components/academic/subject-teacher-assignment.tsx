// src/components/academic/subject-teacher-assignment.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, User, BookOpen, X, GraduationCap } from 'lucide-react';
import type { Subject } from '@/types/academic';

interface Teacher {
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

interface ClassDivision {
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

interface SubjectTeacher {
  id: string;
  name: string;
  subject: string | null;
  is_class_teacher: boolean;
}

interface SubjectTeacherAssignmentProps {
  division: ClassDivision;
  teachers: Teacher[];
  availableSubjects: Subject[];
  currentSubjectTeachers?: SubjectTeacher[];
  prefillData?: { teacherId: string; subject: string }; // For editing existing assignments
  onSave: (divisionId: string, teacherId: string, subject: string, isPrimary: boolean) => void;
  onCancel: () => void;
  onRemove?: (divisionId: string, teacherId: string, subject?: string | null) => void;
}

export function SubjectTeacherAssignment({
  division,
  teachers,
  availableSubjects,
  currentSubjectTeachers = [],
  prefillData,
  onSave,
  onCancel,
  onRemove
}: SubjectTeacherAssignmentProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(prefillData?.teacherId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(prefillData?.subject || '');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Don't render if no subjects are available
  if (!availableSubjects || availableSubjects.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Subjects Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Please assign subjects to this class division first.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedTeacherId) {
      setError('Please select a teacher');
      return;
    }

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(division.id, selectedTeacherId, selectedSubject, isPrimary);
      setSuccess(true);
      // Reset success after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch {
      setError('Failed to assign subject teacher. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedTeacherId('');
    setSelectedSubject('');
    setIsPrimary(false);
    onCancel();
  };

  // Group teachers by department for better organization
  const teachersByDepartment: Record<string, Teacher[]> = {};
  teachers.forEach(teacher => {
    const department = teacher.department || 'Other';
    if (!teachersByDepartment[department]) {
      teachersByDepartment[department] = [];
    }
    teachersByDepartment[department].push(teacher);
  });



  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Subject teacher assigned successfully!</AlertDescription>
        </Alert>
      )}
      
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {division.division} Section - Subject Teachers
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Subject Teachers - Compact View */}
      {currentSubjectTeachers && currentSubjectTeachers.length > 0 ? (
        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Current Subject Teachers
            </h4>
            <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full font-medium">
              {currentSubjectTeachers.length} assigned
            </span>
          </div>
          <div className="space-y-2">
            {currentSubjectTeachers.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">{st.name}</span>
                  {st.subject && (
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                      {st.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacherId(st.id);
                      setSelectedSubject(st.subject || '');
                    }}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-700 h-8 w-8 p-0"
                    title="Edit assignment"
                  >
                    ✏️
                  </Button>
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(division.id, st.id, st.subject)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                      title="Remove assignment"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <GraduationCap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No subject teachers assigned yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Use the form below to assign teachers to subjects</p>
          </div>
        </div>
      )}
      
      {/* Simple Assignment Form */}
      <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              Teacher
            </Label>
            <Select
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger className="h-10 text-base">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.teacher_id} value={teacher.teacher_id} className="text-base">
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              Subject
            </Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger className="h-10 text-base">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {(availableSubjects || []).map(subject => (
                  <SelectItem key={subject.id} value={subject.name} className="text-base">
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedTeacherId || !selectedSubject}
            className="h-10 bg-purple-600 hover:bg-purple-700 text-white text-base font-medium"
          >
            {isLoading ? 'Adding...' : 'Add Assignment'}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end pt-5 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-6 py-2 text-base font-medium"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
