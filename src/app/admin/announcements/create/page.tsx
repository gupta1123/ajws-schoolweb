'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, BookOpen, AlertCircle, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { createAnnouncementsAPI } from '@/lib/api/announcements';
import { classDivisionsServices } from '@/lib/api/class-divisions';

const announcementTypes = [
  { value: 'notification', label: 'Notification', icon: AlertCircle, description: 'General notifications and updates' },
  { value: 'circular', label: 'Circular', icon: BookOpen, description: 'Official circulars and announcements' },
  { value: 'general', label: 'General', icon: AlertCircle, description: 'General announcements' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
];

const targetRoles = [
  { value: 'teacher' },
  { value: 'parent' },
  { value: 'student' },
] as const;

export default function AdminCreateAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  // Class selection state
  const [availableClasses, setAvailableClasses] = useState<Array<{
    id: string;
    division: string;
    class_name: string;
    class_level: string;
    academic_year: string;
  }>>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 'low',
    target_roles: [] as string[],
    target_classes: [] as string[],
    announcement_date: '',
    announcement_time: '09:00',
  });

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.announcement_date || !formData.announcement_time) {
      toast({
        title: t('announcements.create.validation', 'Validation Error'),
        description: t('announcements.create.fillAll', 'Please fill in all required fields'),
        variant: 'error',
      });
      return;
    }

    if (formData.target_roles.length === 0) {
      toast({
        title: t('announcements.create.validation', 'Validation Error'),
        description: t('announcements.create.selectOneRole', 'Please select at least one target role'),
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const api = createAnnouncementsAPI(token!);

      const payload = {
        title: formData.title,
        content: formData.content,
        announcement_type: formData.announcement_type as 'notification' | 'circular' | 'general',
        priority: formData.priority as 'low' | 'high',
        target_roles: formData.target_roles,
        target_classes: formData.target_classes,
        publish_at: new Date(`${formData.announcement_date}T${formData.announcement_time}`).toISOString(),
        expires_at: new Date(`${formData.announcement_date}T${formData.announcement_time}`).toISOString(),
      };

      const response = await api.createAnnouncement(payload);

      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('announcements.create.autoApproved', 'Announcement created and auto-approved successfully'),
        });
        router.push('/admin/announcements');
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.create.failed', 'Failed to create announcement'),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  // Fetch available classes
  const fetchAvailableClasses = useCallback(async () => {
    if (!token) return;

    try {
      setClassesLoading(true);

      // Fetch class divisions using the existing API service
      const result = await classDivisionsServices.getClassDivisions(token);

      if (result.status === 'success') {
        // Get detailed information for each class division
        const classDetails = await Promise.all(
          result.data.class_divisions.map(async (classDivision) => {
            try {
              const detailResponse = await fetch(
                `https://ajws-school-ba8ae5e3f955.herokuapp.com/api/students/class/${classDivision.id}/details`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              const detailResult = await detailResponse.json();

              if (detailResult.status === 'success') {
                return {
                  id: classDivision.id,
                  division: detailResult.data.class_division.division,
                  class_name: detailResult.data.class_division.class_level.name,
                  class_level: detailResult.data.class_division.class_level.name,
                  academic_year: detailResult.data.class_division.academic_year.year_name,
                };
              }
            } catch (error) {
              console.error(`Error fetching details for class ${classDivision.id}:`, error);
            }
            return null;
          })
        );

        // Filter out null results and set available classes
        const validClasses = classDetails.filter((classItem): classItem is NonNullable<typeof classItem> => classItem !== null);
        setAvailableClasses(validClasses);
      } else {
        console.error('Failed to fetch class divisions:', result);
      }
    } catch (error) {
      console.error('Error fetching available classes:', error);
    } finally {
      setClassesLoading(false);
    }
  }, [token]);

  // Handle class selection
  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      target_classes: prev.target_classes.includes(classId)
        ? prev.target_classes.filter(c => c !== classId)
        : [...prev.target_classes, classId]
    }));
  };

  // Fetch classes when students are selected
  useEffect(() => {
    if (formData.target_roles.includes('student') && availableClasses.length === 0) {
      fetchAvailableClasses();
    }
  }, [formData.target_roles, availableClasses.length, fetchAvailableClasses]);

  const getTypeIcon = (type: string) => {
    const typeData = announcementTypes.find(t => t.value === type);
    return typeData ? typeData.icon : BookOpen;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('actions.back', 'Back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('announcements.create.title', 'Create Announcement')}</h1>
          <p className="text-muted-foreground">
            {t('announcements.create.subtitleAdmin', 'Create an announcement that will be automatically approved for publication')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t('announcements.create.basicInfo', 'Basic Information')}
              </CardTitle>
              <CardDescription>
                {t('announcements.create.basicInfoDesc', 'Provide the essential details for your announcement')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('announcements.create.titleLabel', 'Title *')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('announcements.create.titlePlaceholder', 'Enter announcement title')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t('announcements.create.contentLabel', 'Content *')}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('announcements.create.contentPlaceholder', 'Enter announcement content')}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('announcements.create.typeLabel', 'Type *')}</Label>
                  <Select
                    value={formData.announcement_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, announcement_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {announcementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{t('announcements.create.priorityLabel', 'Priority')}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'high' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('announcements.create.scheduling', 'Scheduling')}
              </CardTitle>
              <CardDescription>
                {t('announcements.create.schedulingDesc', 'Set when the announcement should be published and expire')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement_date">{t('announcements.create.announcementDate', 'Announcement Date *')}</Label>
                  <Input
                    id="announcement_date"
                    type="date"
                    value={formData.announcement_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, announcement_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement_time">{t('announcements.create.announcementTime', 'Announcement Time *')}</Label>
                  <Input
                    id="announcement_time"
                    type="time"
                    value={formData.announcement_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, announcement_time: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('announcements.create.targetAudience', 'Target Audience')}
              </CardTitle>
              <CardDescription>
                {t('announcements.create.targetAudienceDesc', 'Select who should receive this announcement')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>{t('announcements.create.targetRoles', 'Target Roles *')}</Label>
                <div className="flex flex-wrap gap-2">
                  {targetRoles.map((role) => (
                    <Button
                      key={role.value}
                      variant={formData.target_roles.includes(role.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRoleToggle(role.value)}
                      className="h-8"
                    >
                      {role.value === 'teacher' && t('announcements.roles.teacher', 'Teachers')}
                      {role.value === 'parent' && t('announcements.roles.parent', 'Parents')}
                      {role.value === 'student' && t('announcements.roles.student', 'Students')}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.target_roles.length} role(s)
                </p>
              </div>

              {/* Class Selection - Only show when students are selected */}
              {formData.target_roles.includes('student') && (
                <div className="space-y-3 border-t pt-4">
                  <Label>{t('announcements.create.targetClasses', 'Target Classes (Optional)')}</Label>
                  {classesLoading ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">{t('announcements.create.loadingClasses', 'Loading classes...')}</span>
                    </div>
                  ) : availableClasses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {availableClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                          <Checkbox
                            id={`class-${classItem.id}`}
                            checked={formData.target_classes.includes(classItem.id)}
                            onCheckedChange={() => handleClassToggle(classItem.id)}
                          />
                          <Label
                            htmlFor={`class-${classItem.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {classItem.class_name} - {classItem.division}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {classItem.academic_year}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">{t('announcements.create.noClasses', 'No classes available')}</p>
                  )}

                  {formData.target_classes.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('announcements.create.selectedClasses', 'Selected:')} {formData.target_classes.length} {t('announcements.create.classesSuffix', 'class(es)')}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t('announcements.create.classesHelp', 'Leave empty to send to all students, or select specific classes for targeted announcements.')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Type Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getTypeIcon(formData.announcement_type), { className: "w-5 h-5" })}
                {t('announcements.create.typePreview', 'Type Preview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {announcementTypes.find(t => t.value === formData.announcement_type)?.label}
                </Badge>
                <Badge className={priorities.find(p => p.value === formData.priority)?.color}>
                  {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {announcementTypes.find(t => t.value === formData.announcement_type)?.description}
              </p>
            </CardContent>
          </Card>



          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  onClick={handleCreateAnnouncement}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('announcements.create.cta', 'Create Announcement')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                  disabled={loading}
                >
                  {t('actions.cancel', 'Cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
