'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, AlertCircle, Star, BookOpen, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { Attachment } from '@/types/homework';
import { useI18n } from '@/lib/i18n/context';

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  target_roles: string[];
  target_classes: string[];
  target_departments: string[];
  publish_at: string;
  expires_at: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    role: string;
    full_name: string;
  };
  approver?: {
    id: string;
    role: string;
    full_name: string;
  };
  attachments: Attachment[];
}

const announcementTypes = [
  { value: 'notification', label: 'Notification', icon: AlertCircle },
  { value: 'circular', label: 'Circular', icon: BookOpen },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
];



export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();
  const { token } = useAuth();
  const router = useRouter();
  const { t, lang } = useI18n();



    const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('https://ajws-school-ba8ae5e3f955.herokuapp.com/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.status === 'success') {
        setAnnouncements(data.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.fetchFailed', 'Failed to fetch announcements'),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast, t]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);





  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
    const matchesType = typeFilter === 'all' || announcement.announcement_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString(lang, { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };



  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('announcements.list.title', 'Announcements')}</h1>
          <p className="text-muted-foreground">
            {t('announcements.list.subtitle.teacher', 'Create and manage school announcements for students, parents, and staff')}
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => router.push('/announcements/create')}
        >
          <Plus className="w-4 h-4" />
          {t('announcements.create.cta', 'Create Announcement')}
        </Button>
      </div>

      {/* Help Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">
                {t('announcements.teacher.helpTitle', 'Need to make changes?')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('announcements.teacher.helpDesc', "You can edit or delete your announcements while they're pending approval. Once approved or rejected, you'll need to contact an administrator for any changes.")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('announcements.list.search', 'Search announcements...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('announcements.filters.status', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('announcements.filters.allStatus', 'All Status')}</SelectItem>
                  <SelectItem value="pending">{t('announcements.common.pending', 'Pending')}</SelectItem>
                  <SelectItem value="approved">{t('announcements.common.approved', 'Approved')}</SelectItem>
                  <SelectItem value="rejected">{t('announcements.common.rejected', 'Rejected')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('announcements.filters.type', 'Type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('announcements.filters.allTypes', 'All Types')}</SelectItem>
                  {announcementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('announcements.filters.priority', 'Priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('announcements.filters.allPriorities', 'All Priorities')}</SelectItem>
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

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">{t('announcements.list.loading', 'Loading announcements...')}</p>
          </div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('announcements.list.emptyTitle', 'No announcements found')}</h3>
              <p>{t('announcements.list.emptyHelpTeacher', 'Create your first announcement to get started.')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('announcements.table.title', 'Title')}</TableHead>
                  <TableHead>{t('announcements.table.type', 'Type')}</TableHead>
                  <TableHead>{t('announcements.table.status', 'Status')}</TableHead>
                  <TableHead>{t('announcements.table.priority', 'Priority')}</TableHead>
                  <TableHead>{t('announcements.table.createdDate', 'Created Date')}</TableHead>
                  <TableHead className="text-right">{t('announcements.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{announcement.title}</span>
                        {announcement.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {announcementTypes.find(t => t.value === announcement.announcement_type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(announcement.status)}>
                        {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorities.find(p => p.value === announcement.priority)?.color}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(announcement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/announcements/${announcement.id}`)}
                      >
                        {t('actions.view', 'View')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
