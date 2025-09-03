// src/components/academic/teacher-assignment.tsx

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
import { AlertCircle, CheckCircle, BookOpen, X } from 'lucide-react';

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

interface TeacherAssignmentProps {
  division: ClassDivision;
  teachers: Teacher[];
  onSave: (divisionId: string, teacherId: string) => void;
  onCancel: () => void;
  onRemove?: (divisionId: string) => void;
}

export function TeacherAssignment({
  division,
  teachers,
  onSave,
  onCancel,
  onRemove
}: TeacherAssignmentProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(division.teacher_id || undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSave = async () => {
    if (selectedTeacherId === undefined) {
      setError('Please select a teacher');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If "unassign" was selected, pass empty string to remove assignment
      const teacherIdToSave = selectedTeacherId === 'unassign' ? '' : selectedTeacherId;
      await onSave(division.id, teacherIdToSave);
      setSuccess(true);
      // Reset success after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch {
      setError('Failed to assign teacher. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedTeacherId(division.teacher_id || undefined);
    onCancel();
  };

  // Get currently assigned teacher name
  const assignedTeacher = division.teacher_id 
    ? teachers.find(t => t.teacher_id === division.teacher_id)
    : null;

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
          <AlertDescription>Teacher assigned successfully!</AlertDescription>
        </Alert>
      )}
      
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {division.division} Section - Class Teacher
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

      {/* Current Teacher */}
      {assignedTeacher && (
        <div className="mx-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-green-800 dark:text-green-300">
                Current: {assignedTeacher.full_name}
              </span>
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(division.id)}
                className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                title="Remove teacher"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Simple Assignment Form */}
      <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              Select Teacher
            </Label>
            <Select
              value={selectedTeacherId || undefined}
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger className="h-10 text-base">
                <SelectValue placeholder="Choose teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassign" className="text-orange-600">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>Unassign</span>
                  </div>
                </SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.teacher_id} value={teacher.teacher_id} className="text-base">
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium"
          >
            {isLoading ? 'Saving...' : 'Save Assignment'}
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