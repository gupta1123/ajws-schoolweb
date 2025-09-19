'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, CheckCircle, XCircle, Clock, Eye, MessageSquare, BookOpen, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { createAnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { useI18n } from '@/lib/i18n/context';


const announcementTypes = [
  { value: 'notification', label: 'Notification', icon: AlertCircle },
  { value: 'circular', label: 'Circular', icon: BookOpen },
  { value: 'general', label: 'General', icon: MessageSquare },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
];

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: 'Rejected' },
};



export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');


  const { toast } = useToast();
  const { token, user } = useAuth();
  const router = useRouter();
  const { t, lang } = useI18n();
  const api = useMemo(() => (token ? createAnnouncementsAPI(token) : null), [token]);

  const fetchAnnouncements = useCallback(async () => {
    if (!api) return;

    try {
      setAnnouncementsLoading(true);
      const response = await api.getAnnouncements();
      if (response.status === 'success') {
        setAnnouncements(response.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.fetchFailed', 'Failed to fetch announcements'),
        variant: 'error',
      });
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [api, toast, t]);

  const fetchPendingAnnouncements = useCallback(async () => {
    if (!api) return;

    try {
      setPendingLoading(true);
      const response = await api.getAnnouncements({ status: 'pending' });
      if (response.status === 'success') {
        setPendingAnnouncements(response.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching pending announcements:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.fetchPendingFailed', 'Failed to fetch pending announcements'),
        variant: 'error',
      });
    } finally {
      setPendingLoading(false);
    }
  }, [api, toast, t]);

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
      // Only principals view/manage pending approvals
      if (user?.role === 'principal') {
        fetchPendingAnnouncements();
      }
    }
  }, [token, user?.role, fetchAnnouncements, fetchPendingAnnouncements]);

  const handleApproveAnnouncement = async (announcementId: string) => {
    if (!api) return;

    try {
      const response = await api.approveOrRejectAnnouncement(announcementId, { action: 'approve' });
      if (response.status === 'success') {
        toast({
          title: t('common.success', 'Success'),
          description: t('announcements.list.approved', 'Announcement approved successfully'),
        });
        // Refresh data
        fetchAnnouncements();
        fetchPendingAnnouncements();
      }
    } catch (error) {
      console.error('Error approving announcement:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('announcements.list.approveFailed', 'Failed to approve announcement'),
        variant: 'error',
      });
    }
  };





  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.creator.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
    const matchesType = typeFilter === 'all' || announcement.announcement_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString(lang, { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };



  if (!user || (user.role !== 'admin' && user.role !== 'principal')) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('announcements.list.title', 'Announcements')}</h1>
          <p className="text-muted-foreground">
            {t('announcements.list.subtitle', 'Create and manage school announcements')}
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => router.push('/admin/announcements/create')}
        >
          <Plus className="w-4 h-4" />
          {t('announcements.create.cta', 'Create Announcement')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {user?.role === 'principal' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('announcements.common.pending', 'Pending')}</p>
                  <p className="text-2xl font-bold">{pendingAnnouncements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('announcements.common.approved', 'Approved')}</p>
                <p className="text-2xl font-bold">
                  {announcements.filter(a => a.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('announcements.common.rejected', 'Rejected')}</p>
                <p className="text-2xl font-bold">
                  {announcements.filter(a => a.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('announcements.common.total', 'Total')}</p>
                <p className="text-2xl font-bold">{announcements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className={`grid w-full ${user?.role === 'principal' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t('announcements.list.tabs.overview', 'Overview')}
          </TabsTrigger>
          {user?.role === 'principal' && (
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('announcements.list.tabs.pending', 'Pending Approvals')} ({pendingAnnouncements.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">

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

          {/* Announcements Table */}
          {announcementsLoading ? (
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
                  <p>{t('announcements.list.emptyHelp', 'No announcements match your current filters.')}</p>
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
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                          <div className="text-sm">
                            <div className="font-medium">{announcement.creator.full_name}</div>
                            <div className="text-muted-foreground capitalize">
                              {announcement.creator.role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[announcement.status].color}>
                            {statusConfig[announcement.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {announcementTypes.find(t => t.value === announcement.announcement_type)?.label}
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
                            onClick={() => router.push(`/admin/announcements/${announcement.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {user?.role === 'principal' && (
        <TabsContent value="pending" className="space-y-4">
          {/* Filters for Pending Tab */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {announcementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
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

          {/* Pending Announcements Table */}
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading pending announcements...</p>
              </div>
            </div>
          ) : pendingAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No pending announcements</h3>
                  <p>All announcements have been reviewed.</p>
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
                      <TableHead>{t('announcements.table.creator', 'Creator')}</TableHead>
                      <TableHead>{t('announcements.table.type', 'Type')}</TableHead>
                      <TableHead>{t('announcements.table.priority', 'Priority')}</TableHead>
                      <TableHead>{t('announcements.table.created', 'Created')}</TableHead>
                      <TableHead className="text-right">{t('announcements.table.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAnnouncements
                      .filter(announcement => {
                        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             announcement.creator.full_name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesType = typeFilter === 'all' || announcement.announcement_type === typeFilter;
                        const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
                        return matchesSearch && matchesType && matchesPriority;
                      })
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((announcement) => (
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
                            <div className="text-sm">
                              <div className="font-medium">{announcement.creator.full_name}</div>
                              <div className="text-muted-foreground capitalize">
                                {announcement.creator.role}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {announcementTypes.find(t => t.value === announcement.announcement_type)?.label}
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
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/announcements/${announcement.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveAnnouncement(announcement.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        )}


      </Tabs>


    </div>
  );
}
