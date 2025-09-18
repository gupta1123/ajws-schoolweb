'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Image as ImageIcon, FileText, File as FileIcon, Edit, Trash2, X, RefreshCw, Download } from 'lucide-react';
import { homeworkServices, AttachmentsResponse } from '@/lib/api/homework';
import { academicServices } from '@/lib/api/academic';
import { ApiResponseWithCache, ApiErrorResponse } from '@/lib/api/client';
import { Homework, Attachment } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { FileUploader } from '@/components/ui/file-uploader';

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
  subject?: string;
}

// API Response types
interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface HomeworkApiResponse extends ApiResponse {
  data?: {
    homework?: Homework;
  };
}



interface UploadApiResponse extends ApiResponse {
  data?: {
    attachments?: Attachment[];
  };
}

interface TeacherClassesApiResponse extends ApiResponse {
  data?: {
    assigned_classes?: AssignedClass[];
  };
}

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

type PageProps = { params: Promise<{ id: string }> };

export default function EditHomeworkPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const { user, token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [classDivisions, setClassDivisions] = useState<TransformedClass[]>([]);

  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [editingAttachment, setEditingAttachment] = useState<string | null>(null);
  const [editFileInput, setEditFileInput] = useState<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});

  // keep track of mounted status to avoid state updates on unmounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Format class division name for display
  const formatClassName = (division: TransformedClass) => {
    return `${division.class_level?.name || t('common.none', 'Unknown')} - ${t('timetable.section', 'Section')} ${division.division}`;
  };

  // Load image as blob URL using API client
  const loadImageBlob = useCallback(async (attachment: Attachment): Promise<string | null> => {
    if (!homework?.id || !attachment.file_type?.startsWith('image/')) {
      return null;
    }

    try {
      console.log('Loading image blob for:', attachment.file_name);

      // First, try using the Supabase public URL if available
      if (attachment.download_url) {
        console.log('Using Supabase URL for:', attachment.file_name, attachment.download_url);
        return attachment.download_url;
      }

      // Fallback to API client for blob loading
      const blob = await homeworkServices.downloadAttachment(homework.id, attachment.id, token || '');
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('Failed to load image blob for:', attachment.file_name, error);
      return null;
    }
  }, [homework?.id, token]);

  // Load all image blobs for attachments
  const loadAllImageBlobs = useCallback(async (attachments: Attachment[]) => {
    const imageAttachments = attachments.filter(att => att.file_type?.startsWith('image/'));

    for (const attachment of imageAttachments) {
      const blobUrl = await loadImageBlob(attachment);
      if (blobUrl && mountedRef.current) {
        setImageBlobUrls(prev => ({ ...prev, [attachment.id]: blobUrl }));
      }
    }
  }, [loadImageBlob]);

  // Cleanup function for blob URLs
  const cleanupBlobUrls = useCallback(() => {
    Object.values(imageBlobUrls).forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      // Note: Supabase URLs don't need cleanup
    });
    setImageBlobUrls({});
  }, [imageBlobUrls]);

  const fetchExistingAttachmentsById = useCallback(
    async (homeworkId: string) => {
      if (!homeworkId || !token) {
        console.log('Cannot fetch attachments: missing homework ID or token', { homeworkId, hasToken: !!token });
        return;
      }
      try {
        console.log('Fetching attachments for homework:', homeworkId);
        const response = await homeworkServices.getHomeworkAttachments(homeworkId, token);
        console.log('Attachments API response status:', (response as ApiResponseWithCache<AttachmentsResponse> | ApiErrorResponse)?.status);

        if ((response as ApiErrorResponse)?.status === 'error') {
          console.log('API error while fetching attachments:', response);
          return;
        }

        const attachments = (response as ApiResponseWithCache<AttachmentsResponse>)?.data?.attachments ?? [];
        setExistingAttachments(attachments);
        console.log('Successfully loaded attachments:', attachments.length);
        if (attachments.length > 0) {
          console.log('Sample attachment:', {
            name: attachments[0].file_name,
            hasDownloadUrl: !!attachments[0].download_url,
            hasDownloadEndpoint: !!attachments[0].download_endpoint
          });
        }

        // Load image blobs for all image attachments
        await loadAllImageBlobs(attachments);
      } catch (err) {
        console.error('Error fetching attachments:', err);
      }
    },
    [token, loadAllImageBlobs]
  );

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!homework?.id || !token) return;

    if (!confirm(`Are you sure you want to delete "${attachment.file_name}"?`)) {
      return;
    }

    try {
      const response = await homeworkServices.deleteAttachment(homework.id, attachment.id, token);
      if ((response as ApiResponse)?.status === 'success') {
        toast({
          title: "Success",
          description: "Attachment deleted successfully!",
          variant: "success",
        });
        // Remove from local state
        setExistingAttachments(prev => prev.filter(att => att.id !== attachment.id));

      } else {
        throw new Error((response as ApiResponse)?.message || 'Failed to delete attachment');
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
      toast({
        title: "Error",
        description: "Failed to delete attachment. Please try again.",
        variant: "error",
      });
    }
  };

  const handleEditAttachment = async (attachment: Attachment, newFile: File) => {
    if (!homework?.id || !token) return;

    try {
      const formData = new FormData();
      formData.append('files', newFile);

      const response = await homeworkServices.updateAttachment(homework.id, attachment.id, formData, token);
      if ((response as ApiResponse)?.status === 'success') {
        toast({
          title: "Success",
          description: "Attachment updated successfully!",
          variant: "success",
        });
        // Refresh attachments to get updated data
        await fetchExistingAttachmentsById(homework.id);
      } else {
        throw new Error((response as ApiResponse)?.message || 'Failed to update attachment');
      }
    } catch (err) {
      console.error('Error updating attachment:', err);
      toast({
        title: "Error",
        description: "Failed to update attachment. Please try again.",
        variant: "error",
      });
    }
  };

  const handleThumbnailClick = (attachment: Attachment) => {
    if (attachment.file_type?.startsWith('image/')) {
      const imageUrl = imageBlobUrls[attachment.id];
      if (imageUrl) {
        setPreviewImage({ url: imageUrl, name: attachment.file_name });
      } else {
        console.log('Blob URL not available yet for:', attachment.file_name);
      }
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const downloadUrl = homework?.id ? `https://ajws-school-ba8ae5e3f955.herokuapp.com/api/homework/${homework.id}/attachments/${attachment.id}?token=${token}` : (attachment.download_url || '');

    if (!downloadUrl) return;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-green-500" />;
    } else if (fileType?.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileType?.includes('word') || fileType?.includes('document') || fileType?.includes('msword')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (fileType?.includes('text') || fileType === 'text/plain') {
      return <FileText className="h-5 w-5 text-gray-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [formData, setFormData] = useState({
    class_division_id: '',
    subject: '',
    title: '',
    description: '',
    due_date: ''
  });

  // Fetch base data
  useEffect(() => {
    const homeworkIdFromParams = unwrappedParams.id;

    const fetchData = async () => {
      if (!user || !token || !homeworkIdFromParams) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch class divisions (subject teacher only)
        const teacherResponse = await academicServices.getMyTeacherClasses(token);
        if ((teacherResponse as TeacherClassesApiResponse)?.status === 'success' && (teacherResponse as TeacherClassesApiResponse)?.data) {
          const subjectTeacherClasses = (teacherResponse as TeacherClassesApiResponse).data?.assigned_classes?.filter(
            (assignment: AssignedClass) => assignment.assignment_type === 'subject_teacher'
          ) ?? [];

          const transformedClasses: TransformedClass[] = subjectTeacherClasses.map((assignment: AssignedClass) => ({
            id: assignment.class_division_id,
            division: assignment.division,
            class_level: { name: assignment.class_level },
            academic_year: { year_name: assignment.academic_year }
          }));

          // dedupe
          const uniqueClasses = transformedClasses.filter(
            (classItem, index, self) => index === self.findIndex(c => c.id === classItem.id)
          );
          setClassDivisions(uniqueClasses);
        }

        // Fetch specific homework data
        console.log('Fetching homework with ID:', homeworkIdFromParams);
        const homeworkResponse = await homeworkServices.getHomeworkById(token, homeworkIdFromParams);
        console.log('API Response:', homeworkResponse);

        if ((homeworkResponse as HomeworkApiResponse)?.status === 'success') {
          const homeworkData = (homeworkResponse as HomeworkApiResponse).data?.homework;
          if (homeworkData) {
            console.log('Found homework data:', homeworkData);
            setHomework(homeworkData);
            const formattedDueDate = homeworkData.due_date
              ? new Date(homeworkData.due_date).toISOString().split('T')[0]
              : '';

            setFormData({
              class_division_id: homeworkData.class_division_id ?? '',
              subject: homeworkData.subject ?? '',
              title: homeworkData.title ?? '',
              description: homeworkData.description ?? '',
              due_date: formattedDueDate
            });

            // ✅ Fetch attachments using the ID directly (not relying on state yet)
            await fetchExistingAttachmentsById(homeworkIdFromParams);
          } else {
            setError('Homework data not found in response');
            console.error('No homework data in response:', (homeworkResponse as HomeworkApiResponse).data);
          }
        } else {
          setError('Failed to fetch homework');
          console.error('API Error:', homeworkResponse);
        }
      } catch (err) {
        setError('Failed to load homework data');
        console.error('Error fetching data:', err);
        toast({
          title: "Error",
          description: "Failed to load homework data",
          variant: "error",
        });
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id, token, user]);

  // Also refetch attachments if homework id changes (e.g., after an update)
  useEffect(() => {
    if (homework?.id && token && !loading) {
      fetchExistingAttachmentsById(homework.id);
    }
  }, [homework?.id, token, loading, fetchExistingAttachmentsById]);

  // Refresh attachments when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (token && homework?.id) {
        fetchExistingAttachmentsById(homework.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, homework?.id, fetchExistingAttachmentsById]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      cleanupBlobUrls();
    };
  }, [cleanupBlobUrls]);



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

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">{t('homeworkTeacher.edit.loading', 'Loading homework...')}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error || !homework) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t('homeworkTeacher.edit.errorTitle', 'Error Loading Homework')}</h2>
            <p className="text-gray-600 mb-4">{error || t('homeworkTeacher.edit.notFound', 'Homework not found')}</p>
            <Button onClick={() => router.back()}>
              ← Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!homework?.id || files.length === 0) return;

    try {
      const response = await homeworkServices.uploadAttachments(homework.id, files, token || '');
      if ((response as ApiResponse)?.status === 'success') {
        toast({
          title: "Success",
          description: `${files.length} file(s) uploaded successfully!`,
          variant: "success",
        });
        await fetchExistingAttachmentsById(homework.id);
      } else {
        throw new Error((response as UploadApiResponse)?.message || 'Failed to upload files');
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await homeworkServices.updateHomework(homework!.id, formData, token!);
      if ((response as ApiResponse)?.status === 'success') {
        router.push('/homework');
      } else {
        setError('Failed to update homework');
      }
    } catch (err) {
      setError('An error occurred while updating homework');
      console.error('Error updating homework:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="mb-4"
          >
            ← {t('homeworkTeacher.create.back', 'Back to Homework')}
          </Button>
          <h1 className="text-3xl font-bold mb-2">{t('homeworkTeacher.edit.title', 'Edit Homework')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('homeworkTeacher.edit.subtitle', 'Update the homework assignment details')}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle>{t('homeworkTeacher.edit.detailsTitle', 'Edit Homework Assignment')}</CardTitle>
              <CardDescription>
                Update the details for the homework assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_division_id">Class</Label>
                  <select
                    id="class_division_id"
                    name="class_division_id"
                    value={formData.class_division_id}
                    onChange={handleChange}
                    className="border rounded-md px-3 py-2 w-full"
                    required
                  >
                    <option value="">Select a class</option>
                    {classDivisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {formatClassName(division)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter homework title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter detailed description of the homework"
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Attachments</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => homework?.id && fetchExistingAttachmentsById(homework.id)}
                    className="h-8 px-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Hidden file input for editing */}
                <input
                  type="file"
                  ref={setEditFileInput}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editingAttachment) {
                      const attachment = existingAttachments.find(att => att.id === editingAttachment);
                      if (attachment) {
                        handleEditAttachment(attachment, file);
                      }
                      setEditingAttachment(null);
                      if (editFileInput) editFileInput.value = '';
                    }
                  }}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                
                {/* Existing Attachments */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Existing Files:</p>
                      <span className="text-xs text-muted-foreground">
                        {existingAttachments.length} file{existingAttachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                      {existingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="bg-muted/20 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                        >
                          {/* Image/File Display */}
                          <div className="relative mb-3">
                            {attachment.file_type?.startsWith('image/') ? (
                              <div className="relative">
                                {imageBlobUrls[attachment.id] ? (
                                  <Image
                                    src={imageBlobUrls[attachment.id]}
                                    alt={attachment.file_name}
                                    width={400}
                                    height={96}
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleThumbnailClick(attachment)}
                                    title="Click to preview"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                      console.error('Blob URL failed for:', attachment.file_name);
                                      // Hide broken img and show fallback
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-24 flex items-center justify-center bg-muted rounded border">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                      <span className="text-xs text-muted-foreground">Loading...</span>
                                    </div>
                                  </div>
                                )}
                                {/* Fallback icon if image fails to load */}
                                <div className="hidden w-full h-24 flex items-center justify-center bg-muted rounded border">
                                  <div className="flex flex-col items-center gap-1">
                                    {getFileIcon(attachment.file_type)}
                                    <span className="text-xs text-muted-foreground">Failed to load</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-24 flex items-center justify-center bg-muted rounded border">
                                {getFileIcon(attachment.file_type)}
                              </div>
                            )}
                          </div>

                          {/* File Information */}
                          <div className="text-center space-y-2">
                            <p className="text-xs font-medium text-foreground truncate" title={attachment.file_name}>
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-center gap-1 mt-3">
                            {attachment.file_type?.startsWith('image/') && homework?.id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleThumbnailClick(attachment)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Preview image"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(attachment)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAttachment(attachment.id);
                                if (editFileInput) editFileInput.click();
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit file"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAttachment(attachment)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Uploader */}
                <FileUploader
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
                onClick={handleCancel}
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('homeworkTeacher.detail.saving', 'Saving...')}
                  </>
                ) : (
                  t('homeworkTeacher.edit.cta', 'Update Homework')
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800">
              <h3 className="font-medium">{previewImage.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewImage(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <Image
                src={previewImage.url}
                alt={previewImage.name}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain mx-auto"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                onError={() => {
                  console.error('Preview image failed to load:', previewImage.name);
                  setPreviewImage(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
