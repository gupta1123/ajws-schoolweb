'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, User, BookOpen, Users } from 'lucide-react';
import { teachersServices, Teacher } from '@/lib/api/teachers';
import { useAuth } from '@/lib/auth/context';
import { Badge } from '@/components/ui/badge';

interface StartNewChatAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeacherSelected: (teacher: Teacher) => void;
}

export function StartNewChatAdminModal({ open, onOpenChange, onTeacherSelected }: StartNewChatAdminModalProps) {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await teachersServices.getTeachersWithAssignments(token);

      if (response.status === 'success' && response.data && 'teachers' in response.data) {
        const teachersList = response.data.teachers as Teacher[];
        setTeachers(teachersList);
        setFilteredTeachers(teachersList);
      } else {
        throw new Error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch teachers when modal opens
  useEffect(() => {
    if (open && token) {
      fetchTeachers();
    }
  }, [open, token, fetchTeachers]);

  // Filter teachers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(teacher => {
        const teacherName = teacher.full_name.toLowerCase();
        const subjects = teacher.summary.subjects_taught.join(' ').toLowerCase();
        const classes = teacher.assignments.primary_classes
          .concat(teacher.assignments.subject_teacher_assignments)
          .map(a => a.class_name.toLowerCase())
          .join(' ');
        const searchLower = searchTerm.toLowerCase();

        return teacherName.includes(searchLower) ||
               subjects.includes(searchLower) ||
               classes.includes(searchLower);
      });
      setFilteredTeachers(filtered);
    }
  }, [searchTerm, teachers]);

  const handleTeacherSelect = (teacher: Teacher) => {
    onTeacherSelected(teacher);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setError(null);
  };

  const getAssignmentTypeIcon = (assignmentType: string) => {
    switch (assignmentType) {
      case 'class_teacher':
        return <Users className="h-4 w-4" />;
      case 'subject_teacher':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getAssignmentTypeLabel = (assignmentType: string) => {
    switch (assignmentType) {
      case 'class_teacher':
        return 'Class Teacher';
      case 'subject_teacher':
        return 'Subject Teacher';
      default:
        return assignmentType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Start New Chat with Teacher
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers, subjects, or classes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Teachers List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading teachers...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {searchTerm ? 'No matches found' : 'No teachers available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'No teachers found in the system.'}
                </p>
              </div>
            ) : (
              filteredTeachers.map((teacher) => (
                <div
                  key={teacher.teacher_id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTeacherSelect(teacher)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">
                          {teacher.full_name}
                        </h4>
                        {teacher.staff_info && (
                          <Badge variant="outline" className="text-xs">
                            {teacher.staff_info.designation}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Subjects Taught */}
                      {teacher.summary.subjects_taught.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">
                            Subjects: {teacher.summary.subjects_taught.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Assignments */}
                      <div className="space-y-1">
                        {/* Primary Classes */}
                        {teacher.assignments.primary_classes.map((assignment, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getAssignmentTypeIcon(assignment.assignment_type)}
                            <span className="font-medium">{assignment.class_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getAssignmentTypeLabel(assignment.assignment_type)}
                            </Badge>
                          </div>
                        ))}
                        
                        {/* Subject Teacher Assignments */}
                        {teacher.assignments.subject_teacher_assignments.map((assignment, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getAssignmentTypeIcon(assignment.assignment_type)}
                            <span>{assignment.subject} • {assignment.class_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getAssignmentTypeLabel(assignment.assignment_type)}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Summary Stats */}
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {teacher.summary.total_classes} classes
                        </Badge>
                        {teacher.summary.primary_teacher_for > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {teacher.summary.primary_teacher_for} primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
