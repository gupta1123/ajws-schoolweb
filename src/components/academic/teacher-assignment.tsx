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
import { AlertCircle, CheckCircle, User, BookOpen, X } from 'lucide-react';

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
}

export function TeacherAssignment({ 
  division, 
  teachers, 
  onSave, 
  onCancel 
}: TeacherAssignmentProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(division.teacher_id || undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSave = () => {
    if (selectedTeacherId === undefined) {
      setError('Please select a teacher');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // If "unassign" was selected, pass empty string to remove assignment
        const teacherIdToSave = selectedTeacherId === 'unassign' ? '' : selectedTeacherId;
        onSave(division.id, teacherIdToSave);
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
    }, 500);
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
      
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium">{division.division} Section</div>
            {assignedTeacher && (
              <div className="text-sm text-muted-foreground">
                Currently: {assignedTeacher.full_name}
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="teacher-select">Select Teacher</Label>
        <Select 
          value={selectedTeacherId || undefined} 
          onValueChange={setSelectedTeacherId}
        >
          <SelectTrigger id="teacher-select">
            <SelectValue placeholder="Choose a teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassign" className="text-muted-foreground">
              Unassign Teacher
            </SelectItem>
            {Object.entries(teachersByDepartment).map(([department, deptTeachers]) => (
              <div key={department}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {department}
                </div>
                {deptTeachers.map((teacher) => (
                  <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div>{teacher.full_name}</div>
                        {teacher.designation && (
                          <div className="text-xs text-muted-foreground">
                            {teacher.designation}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Assignment'}
        </Button>
      </div>
    </div>
  );
}