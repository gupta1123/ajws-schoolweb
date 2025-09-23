// src/components/academic/subject-teacher-assignment.tsx

'use client';

import { useState, useEffect } from 'react';
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
import { SearchableSubjectDropdown } from '@/components/ui/searchable-subject-dropdown';
import { SearchableTeacherDropdown } from '@/components/ui/searchable-teacher-dropdown';
import { AlertCircle, CheckCircle, User, BookOpen, X, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
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
  const { token } = useAuth();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(prefillData?.teacherId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(prefillData?.subject || '');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>(teachers);

  // Fetch all teachers when component mounts or when teachers prop changes
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('https://ajws-school-ba8ae5e3f955.herokuapp.com/api/academic/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200 || response.status === 304) {
          const data = await response.json();
          if (data.status === 'success' && data.data.teachers) {
            setAllTeachers(data.data.teachers);
          }
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        // Fallback to props if API fails
        setAllTeachers(teachers);
      }
    };

    fetchTeachers();
  }, [token, teachers]);

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

  // Group teachers by department for better organization
  const teachersByDepartment: Record<string, Teacher[]> = {};
  allTeachers.forEach(teacher => {
    const department = teacher.department || 'Other';
    if (!teachersByDepartment[department]) {
      teachersByDepartment[department] = [];
    }
    teachersByDepartment[department].push(teacher);
  });



  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {division.class_level?.name} - Section {division.division}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage subject teacher assignments
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 animate-in slide-in-from-top-2">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Subject teacher assigned successfully!</AlertDescription>
        </Alert>
      )}

      {/* Current Subject Teachers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Subject Teachers
          </h3>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {currentSubjectTeachers?.length || 0} teacher{(currentSubjectTeachers?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {currentSubjectTeachers && currentSubjectTeachers.length > 0 ? (
          <div className="space-y-2">
            {currentSubjectTeachers.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{st.name}</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">{st.subject}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacherId(st.id);
                      setSelectedSubject(st.subject || '');
                    }}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    title="Edit assignment"
                  >
                    <span className="text-sm">✏️</span>
                  </Button>
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(division.id, st.id, st.subject)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove assignment"
                    >
                      <span className="text-sm">🗑️</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No subject teachers assigned</p>
            <p className="text-xs text-gray-500 mt-1">Add teachers using the form below</p>
          </div>
        )}
      </div>

      {/* Add New Assignment Form */}
      <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Add New Subject Teacher
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <SearchableTeacherDropdown
              teachers={teachers}
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
              label="Select Teacher"
              placeholder="Choose a teacher..."
              showPhone={false}
              showDepartment={true}
              emptyMessage="No teachers found"
            />
          </div>

          <div className="space-y-2">
            <SearchableSubjectDropdown
              subjects={availableSubjects || []}
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              label="Select Subject"
              placeholder="Choose a subject..."
              showCode={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedTeacherId || !selectedSubject}
            className="px-6 py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Adding...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Add Assignment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
