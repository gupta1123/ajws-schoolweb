// src/app/(teacher)/homework/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { homeworkServices } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { FileUploader } from '@/components/ui/file-uploader';

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

export default function CreateHomeworkPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    title: '',
    description: '',
    due_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [classDivisions, setClassDivisions] = useState<TransformedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [homeworkId, setHomeworkId] = useState<string | null>(null);


  // Fetch class divisions on component mount
  useEffect(() => {
    const fetchClassDivisions = async () => {
      try {
        setLoadingClasses(true);
        
        if (!token) {
          console.log('No token available, skipping API call');
          return;
        }
        
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
  }, [token, t]);

  // Debug: Log authentication state
  console.log('Auth state:', { user, token: !!token, isAuthenticated, authLoading });

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

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



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!homeworkId || files.length === 0) return;
    

    
    try {
      const response = await homeworkServices.uploadAttachments(homeworkId, files, token || '');
      
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.create.uploadSuccess', '{count} file(s) uploaded successfully!').replace('{count}', String(files.length)),
          variant: "success",
        });
        // Clear selected files after successful upload
        setSelectedFiles([]);
      } else {
        throw new Error(response.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('homeworkTeacher.create.uploadFailed', 'Failed to upload files. Please try again.'),
        variant: "error",
      });
    } finally {

    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format the due date to ISO string with time
      const dueDate = new Date(formData.due_date);
      dueDate.setHours(23, 59, 59, 999); // Set to end of day
      
      const payload = {
        ...formData,
        due_date: dueDate.toISOString()
      };

      const response = await homeworkServices.createHomework(payload, token || '');
      
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('homeworkTeacher.create.success', 'Homework created successfully!'),
          variant: "success",
        });
        
        // Store the homework ID for file uploads
        if (response.data?.homework?.id) {
          setHomeworkId(response.data.homework.id);
          
          // If files were selected, upload them now
          if (selectedFiles.length > 0) {
            await handleUploadFiles(selectedFiles);
            // After file upload, redirect to homework page
            router.push('/homework');
          } else {
            // No files to upload, redirect immediately
            router.push('/homework');
          }
        } else {
          // Fallback if no homework ID in response
          router.push('/homework');
        }
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
                      required
                    />
                  </div>
                </div>

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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('homeworkTeacher.create.creating', 'Creating...') : t('homeworkTeacher.create.cta', 'Create Homework')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
