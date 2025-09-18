'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, BookOpen, AlertCircle, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';

const announcementTypes = [
  { value: 'notification', label: 'Notification', icon: AlertCircle, description: 'General notifications and updates' },
  { value: 'circular', label: 'Circular', icon: BookOpen, description: 'Official circulars and announcements' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
];

const targetRoles = [
  { value: 'teacher' },
  { value: 'parent' },
  { value: 'student' },
  { value: 'admin' },
] as const;

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'notification',
    priority: 'medium',
    target_roles: [] as string[],
    target_classes: [] as string[],
    publish_date: '',
    publish_time: '09:00',
    expires_date: '',
    expires_time: '17:00',
    is_featured: false,
  });

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.publish_date || !formData.publish_time || !formData.expires_date || !formData.expires_time) {
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
      const payload = {
        ...formData,
        publish_at: new Date(`${formData.publish_date}T${formData.publish_time}`).toISOString(),
        expires_at: new Date(`${formData.expires_date}T${formData.expires_time}`).toISOString(),
      };

      const response = await fetch('https://ajws-school-ba8ae5e3f955.herokuapp.com/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('announcements.create.successPending', 'Announcement created successfully and pending approval'),
        });
        router.push('/announcements');
      } else {
        throw new Error(data.message || 'Failed to create announcement');
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
            {t('announcements.create.subtitle', 'Create a new announcement that will be reviewed by administrators before publishing')}
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
                    onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
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
                  <Label htmlFor="publish_date">{t('announcements.create.publishDate', 'Publish Date *')}</Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publish_time">{t('announcements.create.publishTime', 'Publish Time *')}</Label>
                  <Input
                    id="publish_time"
                    type="time"
                    value={formData.publish_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires_date">{t('announcements.create.expiresDate', 'Expiry Date *')}</Label>
                  <Input
                    id="expires_date"
                    type="date"
                    value={formData.expires_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_time">{t('announcements.create.expiresTime', 'Expiry Time *')}</Label>
                  <Input
                    id="expires_time"
                    type="time"
                    value={formData.expires_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_time: e.target.value }))}
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
                      {role.value === 'admin' && t('announcements.roles.admin', 'Administrators')}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('announcements.create.selectedRoles', 'Selected:')} {formData.target_roles.length} {t('announcements.create.rolesSuffix', 'role(s)')}
                </p>
              </div>
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

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>{t('announcements.create.options', 'Options')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="featured" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {t('announcements.create.markFeatured', 'Mark as featured')}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('announcements.create.featuredHelp', 'Featured announcements will be highlighted and appear at the top of the list.')}
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
