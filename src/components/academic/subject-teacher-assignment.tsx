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
import { Checkbox } from '@/components/ui/checkbox';
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

interface SubjectTeacherAssignmentProps {
  division: ClassDivision;
  teachers: Teacher[];
  availableSubjects: Subject[]; // Add available subjects prop
  onSave: (divisionId: string, teacherId: string, subject: string, isPrimary: boolean) => void;
  onCancel: () => void;
}

export function SubjectTeacherAssignment({ 
  division, 
  teachers, 
  availableSubjects,
  onSave, 
  onCancel 
}: SubjectTeacherAssignmentProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
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

  const handleSave = () => {
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
      onSave(division.id, selectedTeacherId, selectedSubject, isPrimary);
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
      
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-500" />
          <div>
            <div className="font-medium">{division.division} Section</div>
            <div className="text-sm text-muted-foreground">
              Assign a subject teacher
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teacher-select">Select Teacher</Label>
          <Select 
            value={selectedTeacherId} 
            onValueChange={setSelectedTeacherId}
          >
            <SelectTrigger id="teacher-select">
              <SelectValue placeholder="Choose a teacher" />
            </SelectTrigger>
            <SelectContent>
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

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={selectedSubject}
            onValueChange={setSelectedSubject}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="Choose a subject" />
            </SelectTrigger>
                         <SelectContent>
               {(availableSubjects || []).map(subject => (
                 <SelectItem key={subject.id} value={subject.name}>
                   {subject.name}
                 </SelectItem>
               ))}
             </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-primary"
            checked={isPrimary}
            onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
          />
          <Label htmlFor="is-primary" className="text-sm">
            Set as primary subject teacher
          </Label>
        </div>
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
          {isLoading ? 'Assigning...' : 'Assign Subject Teacher'}
        </Button>
      </div>
    </div>
  );
}
