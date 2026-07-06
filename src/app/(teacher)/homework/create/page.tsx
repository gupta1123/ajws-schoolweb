// src/app/(teacher)/homework/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Loader2, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { homeworkServices, CreateHomeworkData } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { FileUploader } from '@/components/ui/file-uploader';
import type { HomeworkTargetType } from '@/types/homework';

// Interface for the transformed class data we're using
interface TransformedClass {
  id: string;
  division: string;
  class_level: {
    name: string;
  };
  academic_year: {
    year_name: string;
  };
}

// Interface for the API response structure
interface AssignedClass {
  assignment_id: string;
  class_division_id: string;
  division: string;
  class_name: string;
  class_level: string;
  sequence_number: number;
  academic_year: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  is_primary: boolean;
  assigned_date: string;
  subject?: string; // Subject for subject teacher assignments
}

interface ClassStudent {
  id: string;
  full_name: string;
  admission_number: string;
}

export default function CreateHomeworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const canManageHomework = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'principal';
  const isTeacher = user?.role === 'teacher';
  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    title: '',
    description: '',
    due_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [classDivisions, setClassDivisions] = useState<TransformedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [homeworkId, setHomeworkId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<HomeworkTargetType>('class');
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);


  // Fetch class divisions on component mount
  useEffect(() => {
    const fetchClassDivisions = async () => {
      try {
        setLoadingClasses(true);
        
        if (!token) {
          console.log('No token available, skipping API call');
          return;
        }
        
        if (user?.role === 'teacher') {
          const response = await academicServices.getMyTeacherClasses(token);
          if (response.status === 'success' && response.data) {
          // Filter for only subject teacher assignments (not class teacher assignments)
          const subjectTeacherClasses = (response.data.assigned_classes as AssignedClass[]).filter(
            assignedClass => assignedClass.assignment_type === 'subject_teacher'
          );
          
          // Extract unique subjects from subject teacher assignments
          const subjects = [...new Set(
            subjectTeacherClasses
              .map(assignedClass => assignedClass.subject)
              .filter((subject): subject is string => !!subject)
          )];
          setAvailableSubjects(subjects);
          
          // Transform the filtered assigned classes to match the expected format
          const transformedClasses = subjectTeacherClasses.map(assignedClass => ({
            id: assignedClass.class_division_id,
            division: assignedClass.division,
            class_level: {
              name: assignedClass.class_level
            },
            academic_year: {
              year_name: assignedClass.academic_year
            }
          }));
          
          // Filter out duplicates based on ID to prevent React key conflicts
          const uniqueClasses = transformedClasses.filter((classItem, index, self) => 
            index === self.findIndex(c => c.id === classItem.id)
          );
          
          setClassDivisions(uniqueClasses);
          }
          return;
        }

        if (user?.role === 'admin' || user?.role === 'principal') {
          const response = await academicServices.getClassDivisionsSummary(token);
          if (response.status === 'success' && response.data) {
            const transformedClasses = response.data.divisions.map(division => ({
              id: division.id,
              division: division.division,
              class_level: {
                name: division.level.name
              },
              academic_year: {
                year_name: division.academic_year.year_name
              }
            }));

            setClassDivisions(transformedClasses);
          }
        }
      } catch (error) {
        console.error('Error fetching teacher classes:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchClassesFailed', 'Failed to fetch your assigned classes'),
          variant: "error",
        });
      } finally {
        setLoadingClasses(false);
      }
    };

    if (token) {
      fetchClassDivisions();
    } else {
      console.log('No token available, skipping API call');
    }
  }, [token, user?.role, t]);

  useEffect(() => {
    const fetchSubjectsForSelectedClass = async () => {
      if (!token || isTeacher) return;

      if (!formData.class_division_id) {
        setAvailableSubjects([]);
        return;
      }

      try {
        const response = await academicServices.getSubjectsByClassDivision(formData.class_division_id, token);
        let subjects = response.status === 'success'
          ? response.data.subjects.map(subject => subject.name).filter(Boolean)
          : [];

        if (subjects.length === 0) {
          const allSubjectsResponse = await academicServices.getSubjects(token);
          subjects = allSubjectsResponse.status === 'success'
            ? allSubjectsResponse.data.subjects.map(subject => subject.name).filter(Boolean)
            : [];
        }

        setAvailableSubjects(Array.from(new Set(subjects)));
      } catch (error) {
        console.error('Error fetching subjects for class:', error);
        setAvailableSubjects([]);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchSubjectsFailed', 'Failed to fetch subjects for this class'),
          variant: 'error',
        });
      }
    };

    fetchSubjectsForSelectedClass();
  }, [formData.class_division_id, isTeacher, token, t]);

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!token || !formData.class_division_id || targetType !== 'students') {
        setClassStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        const response = await academicServices.getStudentsByClass(formData.class_division_id, token);

        if (response.status === 'success') {
          setClassStudents(response.data.students || []);
        } else {
          setClassStudents([]);
        }
      } catch (error) {
        console.error('Error fetching class students:', error);
        setClassStudents([]);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchStudentsFailed', 'Failed to load students for this class'),
          variant: 'error',
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchClassStudents();
  }, [formData.class_division_id, targetType, token, t]);

  // Debug: Log authentication state
  console.log('Auth state:', { user, token: !!token, isAuthenticated, authLoading });

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!canManageHomework) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers, admins, and principals can access this page.</p>
        </div>
      </div>
    );
  }



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'class_division_id') {
      setSelectedStudentIds([]);
      if (!isTeacher) {
        setFormData(prev => ({
          ...prev,
          subject: ''
        }));
      }
    }
  };

  const handleTargetTypeChange = (value: HomeworkTargetType) => {
    setTargetType(value);
    if (value === 'class') {
      setSelectedStudentIds([]);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const buildHomeworkPayload = (): CreateHomeworkData => {
    const dueDate = formData.due_date ? new Date(formData.due_date) : null;
    if (dueDate) {
      dueDate.setHours(23, 59, 59, 999);
    }

    return {
      class_division_id: formData.class_division_id,
      subject: formData.subject,
      title: formData.title,
      description: formData.description,
      due_date: dueDate ? dueDate.toISOString() : null,
      target_type: targetType,
      ...(targetType === 'students' ? { student_ids: selectedStudentIds } : {}),
    };
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (!token) return;
    setIsUploading(true);

    try {
      let id = homeworkId;
      // If homework not created yet, create it now using current form data
      if (!id) {
        // Validate minimal required fields before creating
        if (!formData.class_division_id || !formData.subject || !formData.title) {
          toast({
            title: t('common.error', 'Error'),
            description: t('homeworkTeacher.create.fillDetailsBeforeUpload', 'Please fill in class, subject, and title before uploading.'),
            variant: 'error',
          });
          return;
        }

        if (targetType === 'students' && selectedStudentIds.length === 0) {
          toast({
            title: t('common.error', 'Error'),
            description: t('homeworkTeacher.create.selectStudentsRequired', 'Select at least one student.'),
            variant: 'error',
          });
          return;
        }

        const payload = buildHomeworkPayload();
        const createRes = await homeworkServices.createHomework(payload, token);
        if (createRes.status !== 'success' || !createRes.data?.homework?.id) {
          throw new Error(createRes.message || 'Failed to create homework before upload');
        }
        id = createRes.data.homework.id;
        setHomeworkId(id);
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.create.success', 'Homework created successfully!'),
          variant: 'success',
        });
      }

      const response = await homeworkServices.uploadAttachments(id!, files, token);
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.create.uploadSuccess', '{count} file(s) uploaded successfully!').replace('{count}', String(files.length)),
          variant: 'success',
        });
        setSelectedFiles([]);
        // After successful upload, navigate to homework list
        router.push('/homework');
      } else {
        throw new Error(response.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.create.uploadFailed', 'Failed to upload files. Please try again.'),
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If there are selected files that are not uploaded yet, require explicit upload first
    if (selectedFiles.length > 0 && !homeworkId) {
      toast({
        title: t('homeworkTeacher.create.uploadFirstTitle', 'Upload documents first'),
        description: t('homeworkTeacher.create.uploadFirstDesc', 'You selected files. Please click "Upload" to upload them before creating.'),
        variant: 'error',
      });
      return;
    }
    setIsLoading(true);
    
    try {
      if (targetType === 'students' && selectedStudentIds.length === 0) {
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.selectStudentsRequired', 'Select at least one student.'),
          variant: "error",
        });
        return;
      }

      const payload = buildHomeworkPayload();

      const response = await homeworkServices.createHomework(payload, token || '');
      
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.create.success', 'Homework created successfully!'),
          variant: "success",
        });
        
        // Created successfully and there were no pending files (blocked earlier), go to list
        router.push('/homework');
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.create.failed', 'Failed to create homework assignment'),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format class division name for display
  const formatClassName = (division: TransformedClass) => {
    return `${division.class_level?.name || t('common.none', 'Unknown')} - ${t('timetable.section', 'Section')} ${division.division}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-2xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← {t('homeworkTeacher.create.back', 'Back to Homework')}
            </Button>
            <h1 className="text-3xl font-bold mb-2">{t('homeworkTeacher.create.title', 'Create Homework')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('homeworkTeacher.create.subtitle', 'Create a new homework assignment for your class')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t('homeworkTeacher.create.detailsTitle', 'Homework Details')}</CardTitle>
                <CardDescription>
                  {t('homeworkTeacher.create.detailsDesc', 'Fill in the details for the homework assignment')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="class_division_id">{t('homeworkTeacher.create.classDivision', 'Class Division')}</Label>
                    <select
                      id="class_division_id"
                      name="class_division_id"
                      value={formData.class_division_id}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full"
                      required
                    >
                      <option value="">{t('homeworkTeacher.labels.selectClass', 'Select a class')}</option>
                      {loadingClasses ? (
                        <option value="">{t('classes.loading', 'Loading classes...')}</option>
                      ) : classDivisions.length === 0 ? (
                        <option value="">{t('classes.emptyTitle', 'No classes found')}</option>
                      ) : (
                        classDivisions.map((division, index) => (
                          <option key={`${division.id}-${division.division}-${index}`} value={division.id}>
                            {formatClassName(division)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('homeworkTeacher.create.subject', 'Subject')}</Label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full"
                      required
                    >
                      <option value="">{t('homeworkTeacher.create.selectSubject', 'Select a subject')}</option>
                      {availableSubjects.length === 0 ? (
                        <option value="">{t('homeworkTeacher.filters.noSubjects', 'No subjects assigned')}</option>
                      ) : (
                        availableSubjects.map((subject, index) => (
                          <option key={`${subject}-${index}`} value={subject}>
                            {subject}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_type">{t('homeworkTeacher.create.assignTo', 'Assign to')}</Label>
                  <select
                    id="target_type"
                    value={targetType}
                    onChange={(e) => handleTargetTypeChange(e.target.value as HomeworkTargetType)}
                    className="border rounded-md px-3 py-2 w-full"
                  >
                    <option value="class">{t('homeworkTeacher.create.entireClass', 'Entire class')}</option>
                    <option value="students">{t('homeworkTeacher.create.selectedStudents', 'Selected students')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{t('homeworkTeacher.create.titleLabel', 'Title')}</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t('homeworkTeacher.create.titlePlaceholder', 'e.g., Chapter 3 Exercises')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('homeworkTeacher.create.description', 'Description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('homeworkTeacher.create.descriptionPlaceholder', 'Enter homework description and instructions')}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">{t('homeworkTeacher.create.dueDate', 'Due Date')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                {targetType === 'students' && (
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>{t('homeworkTeacher.create.students', 'Students')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.class_division_id
                            ? t('homeworkTeacher.create.studentsHelp', 'Select one or more students from the chosen class.')
                            : t('homeworkTeacher.create.selectClassFirst', 'Select a class first to load students.')}
                        </p>
                      </div>
                      {selectedStudentIds.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {selectedStudentIds.length} {t('common.selected', 'Selected')}
                        </span>
                      )}
                    </div>

                    {loadingStudents ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('homeworkTeacher.create.loadingStudents', 'Loading students...')}
                      </div>
                    ) : classStudents.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {formData.class_division_id
                          ? t('homeworkTeacher.create.noStudents', 'No students found for this class.')
                          : t('homeworkTeacher.create.noClassSelected', 'No class selected.')}
                      </div>
                    ) : (
                      <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                        {classStudents.map((student) => (
                          <label
                            key={student.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedStudentIds.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{student.full_name}</span>
                              <span className="block text-xs text-muted-foreground">{student.admission_number}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label>{t('homeworkTeacher.create.attachments', 'Attachments (Optional)')}</Label>
                  <FileUploader
                    onFilesSelected={handleFilesSelected}
                    onUpload={handleUploadFiles}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    maxFiles={5}
                    maxSize={10}
                    className="border-0 shadow-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('homeworkTeacher.create.supported', 'Supported formats: PDF, Word documents, text files, and images. Max 5 files, 10MB each.')}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('actions.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={isLoading || isUploading || (selectedFiles.length > 0 && !homeworkId)}>
                  {isLoading
                    ? t('homeworkTeacher.create.creating', 'Creating...')
                    : isUploading
                    ? t('homeworkTeacher.create.uploading', 'Uploading...')
                    : (selectedFiles.length > 0 && !homeworkId)
                    ? t('homeworkTeacher.create.uploadFirstButton', 'Upload documents first')
                    : t('homeworkTeacher.create.cta', 'Create Homework')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
