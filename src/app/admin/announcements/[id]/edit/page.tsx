'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, AlertCircle, Calendar, Users, Star, Edit } from 'lucide-react';
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
import { createAnnouncementsAPI, type Announcement } from '@/lib/api/announcements';

const announcementTypes = [
  { value: 'notification', label: 'Notification', icon: AlertCircle, description: 'General notifications and updates' },
  { value: 'circular', label: 'Circular', icon: BookOpen, description: 'Official circulars and announcements' },
  { value: 'general', label: 'General', icon: AlertCircle, description: 'General announcements' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
];

const targetRoles = [
  { value: 'teacher', label: 'Teachers' },
  { value: 'parent', label: 'Parents' },
  { value: 'student', label: 'Students' },
  { value: 'admin', label: 'Administrators' },
];

export default function AdminEditAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 'medium',
    target_roles: [] as string[],
    target_classes: [] as string[],
    publish_date: '',
    publish_time: '09:00',
    expires_date: '',
    expires_time: '17:00',
    is_featured: false,
  });

  const fetchAnnouncement = useCallback(async (id: string) => {
    try {
      setFetchLoading(true);
      const api = createAnnouncementsAPI(token!);
      const response = await api.getAnnouncementById(id);

      if (response.status === 'success') {
        setAnnouncement(response.data.announcement);
      } else {
        throw new Error('Failed to fetch announcement');
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch announcement details',
        variant: 'error',
      });
      router.push('/admin/announcements');
    } finally {
      setFetchLoading(false);
    }
  }, [token, toast, router]);

  useEffect(() => {
    if (params.id && token) {
      fetchAnnouncement(params.id as string);
    }
  }, [params.id, token, fetchAnnouncement]);

  useEffect(() => {
    if (announcement) {
      // Populate form with existing data
      const publishDate = new Date(announcement.publish_at);
      const expiresDate = new Date(announcement.expires_at);

      setFormData({
        title: announcement.title,
        content: announcement.content,
        announcement_type: announcement.announcement_type,
        priority: announcement.priority,
        target_roles: announcement.target_roles,
        target_classes: announcement.target_classes,
        publish_date: publishDate.toISOString().split('T')[0],
        publish_time: publishDate.toTimeString().slice(0, 5),
        expires_date: expiresDate.toISOString().split('T')[0],
        expires_time: expiresDate.toTimeString().slice(0, 5),
        is_featured: announcement.is_featured,
      });
    }
  }, [announcement]);

  const handleEditAnnouncement = async () => {
    if (!announcement) return;

    if (!formData.title.trim() || !formData.content.trim() || !formData.publish_date || !formData.publish_time || !formData.expires_date || !formData.expires_time) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'error',
      });
      return;
    }

    if (formData.target_roles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one target role',
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
        announcement_type: formData.announcement_type as 'general' | 'notification' | 'circular',
        priority: formData.priority as 'low' | 'medium' | 'high',
        target_roles: formData.target_roles,
        target_classes: formData.target_classes,
        publish_at: new Date(`${formData.publish_date}T${formData.publish_time}`).toISOString(),
        expires_at: new Date(`${formData.expires_date}T${formData.expires_time}`).toISOString(),
        is_featured: formData.is_featured,
      };

      const response = await api.editAnnouncement(announcement.id, payload);

      if (response.status === 'success') {
        toast({
          title: 'Success',
          description: 'Announcement updated successfully and moved to pending for re-approval',
        });
        router.push('/admin/announcements');
      } else {
        throw new Error(response.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement',
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

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading announcement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Announcement Not Found</h2>
          <p className="text-muted-foreground mb-4">The announcement you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

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
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Announcement</h1>
          <p className="text-muted-foreground">
            Update announcement details and resubmit for approval
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
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide the essential details for your announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter announcement content"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
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
                Scheduling
              </CardTitle>
              <CardDescription>
                Set when the announcement should be published and expire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publish_date">Publish Date *</Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publish_time">Publish Time *</Label>
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
                  <Label htmlFor="expires_date">Expiry Date *</Label>
                  <Input
                    id="expires_date"
                    type="date"
                    value={formData.expires_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_time">Expiry Time *</Label>
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
                Target Audience
              </CardTitle>
              <CardDescription>
                Select who should receive this announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Target Roles *</Label>
                <div className="flex flex-wrap gap-2">
                  {targetRoles.map((role) => (
                    <Button
                      key={role.value}
                      variant={formData.target_roles.includes(role.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRoleToggle(role.value)}
                      className="h-8"
                    >
                      {role.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.target_roles.length} role(s)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  announcement.status === 'approved' ? 'bg-green-100 text-green-800' :
                  announcement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Editing this announcement will move it back to pending status for re-approval.
              </p>
            </CardContent>
          </Card>

          {/* Type Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getTypeIcon(formData.announcement_type), { className: "w-5 h-5" })}
                Type Preview
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
              <CardTitle>Options</CardTitle>
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
                  Mark as featured
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Featured announcements will be highlighted and appear at the top of the list.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  onClick={handleEditAnnouncement}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Announcement
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
