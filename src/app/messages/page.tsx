'use client';

import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Filter, Loader2, AlertCircle, Calendar, UserCheck, UserX, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/messages/chat-interface';
import { CreateGroupModal } from '@/components/messages/create-group-modal';
import { StartNewChatModal } from '@/components/messages/start-new-chat-modal';
import { StartNewChatAdminModal } from '@/components/messages/start-new-chat-admin-modal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
import { usePrincipalChats } from '@/hooks/use-principal-chats';
import { useClassDivisions } from '@/hooks/use-class-divisions';
import { useChatThreads } from '@/hooks/use-chat-threads';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/date-picker/calendar';
import { useI18n } from '@/lib/i18n/context';

export default function MessagesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isStartNewChatModalOpen, setIsStartNewChatModalOpen] = useState(false);
  const [isStartNewChatAdminModalOpen, setIsStartNewChatAdminModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Hooks for admin/principal functionality
  const { chatsData, loading, error, filters, updateFilters } = usePrincipalChats();
  const { classDivisionsList } = useClassDivisions();
  const { loading: adminThreadsLoading } = useChatThreads();

  const isAdminOrPrincipal = user?.role === 'admin' || user?.role === 'principal';

  const handleGroupCreated = (threadId: string) => {
    // Close the modal
    setIsCreateGroupModalOpen(false);
    
    // Trigger a refresh of the chat interface to show the new group
    setRefreshKey(prev => prev + 1);
    
    // Show additional success toast
    toast({
      title: t('messages.groupReadyTitle'),
      description: t('messages.groupReadyDesc'),
      variant: "success"
    });
    
    console.log('Group created with thread ID:', threadId);
  };

  const handleParentSelected = (parent: { parent_id: string; full_name: string }) => {
    // Close the modal
    setIsStartNewChatModalOpen(false);
    
    // Set the selected parent ID to open their chat
    setSelectedParentId(parent.parent_id);
    
    // Don't trigger refresh key for parent selection - let the ChatInterface handle it
    // setRefreshKey(prev => prev + 1);
    
    // Show success toast
    toast({
      title: t('messages.chatStartedTitle'),
      description: `${t('messages.chatOpenedWith')} ${parent.full_name}`,
      variant: "success"
    });
    
    console.log('Parent selected for chat:', parent);
  };

  const handleTeacherSelected = (teacher: { teacher_id: string; full_name: string }) => {
    // Close the modal
    setIsStartNewChatAdminModalOpen(false);
    
    // Set the selected teacher ID to open their chat
    setSelectedParentId(teacher.teacher_id);
    
    // Show success toast
    toast({
      title: t('messages.chatStartedTitle'),
      description: `${t('messages.chatOpenedWith')} ${teacher.full_name}`,
      variant: "success"
    });
    
    console.log('Teacher selected for chat:', teacher);
  };

  // Clear selected parent ID after the chat interface has had time to process it
  useEffect(() => {
    if (refreshKey > 0 && selectedParentId) {
      // Give more time for the chat interface to load and select the parent
      const timer = setTimeout(() => {
        setSelectedParentId(null);
      }, 2000); // Increased from 1000ms to 2000ms to ensure proper loading
      return () => clearTimeout(timer);
    }
  }, [refreshKey, selectedParentId]);

  // Handle tab change for admin/principal
  const handleTabChange = (tab: 'direct' | 'group') => {
    setActiveTab(tab);
    updateFilters({ chat_type: tab });
  };

  // Handle class division filter change
  const handleClassDivisionChange = (classDivisionId: string) => {
    updateFilters({ class_division_id: classDivisionId === 'all' ? undefined : classDivisionId });
  };

  // Handle includes me filter change
  const handleIncludesMeChange = (includesMe: string) => {
    updateFilters({ includes_me: includesMe as 'all' | 'yes' | 'no' });
  };



  // Clear all filters
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    updateFilters({
      chat_type: 'all',
      includes_me: 'all',
      class_division_id: undefined,
      start_date: undefined,
      end_date: undefined
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.chat_type !== 'all' || 
                          filters.includes_me !== 'all' || 
                          filters.class_division_id || 
                          startDate || 
                          endDate;

  if (isAdminOrPrincipal && (loading || adminThreadsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">{t('messages.loading', 'Loading chats...')}</p>
        </div>
      </div>
    );
  }

  if (isAdminOrPrincipal && error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">{t('messages.errorTitle', 'Error Loading Chats')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('messages.tryAgain', 'Try Again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Actions */}
      <div className="flex flex-col gap-4">
        {/* Chat Type Tabs */}
        {isAdminOrPrincipal && (
          <div className="flex items-center justify-between">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={activeTab === 'direct' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('direct')}
                className="rounded-r-none border-r"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {t('messages.tabs.direct', 'Direct Chats')}
                {chatsData && (
                  <Badge variant="secondary" className="ml-2">
                    {chatsData.summary.direct_chats}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'group' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('group')}
                className="rounded-l-none"
              >
                <Users className="h-4 w-4 mr-2" />
                {t('messages.tabs.group', 'Group Chats')}
                {chatsData && (
                  <Badge variant="secondary" className="ml-2">
                    {chatsData.summary.group_chats}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => isAdminOrPrincipal ? setIsStartNewChatAdminModalOpen(true) : setIsStartNewChatModalOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('messages.actions.startNew')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsCreateGroupModalOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                {t('messages.actions.createGroup')}
              </Button>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {isAdminOrPrincipal && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{t('messages.filters.title', 'Filters')}</h3>
                {hasActiveFilters && (
                  <Badge variant="outline" className="text-xs">
                    {Object.values(filters).filter(v => v && v !== 'all' && v !== null).length + 
                     (startDate ? 1 : 0) + 
                     (endDate ? 1 : 0)} {t('messages.active', 'active')}
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('messages.filters.clearAll', 'Clear All')}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Division Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{t('messages.filters.class', 'Class')}</Label>
                <Select
                  onValueChange={handleClassDivisionChange}
                  defaultValue="all"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('messages.filters.allClasses', 'All Classes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('messages.filters.allClasses', 'All Classes')}</SelectItem>
                    {classDivisionsList?.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.class_level.name} {division.division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Includes Me Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{t('messages.filters.participation', 'Participation')}</Label>
                <Select
                  onValueChange={handleIncludesMeChange}
                  defaultValue="all"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('messages.filters.allChats', 'All Chats')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('messages.filters.allChats', 'All Chats')}</SelectItem>
                    <SelectItem value="yes">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {t('messages.filters.includesMe', 'Includes Me')}
                      </div>
                    </SelectItem>
                    <SelectItem value="no">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        {t('messages.filters.excludesMe', 'Excludes Me')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{t('messages.filters.startDate', 'Start Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : t('messages.filters.selectDate', 'Select date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (date) {
                          updateFilters({ start_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{t('messages.filters.endDate', 'End Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : t('messages.filters.selectDate', 'Select date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        if (date) {
                          updateFilters({ end_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons for Teachers */}
        {!isAdminOrPrincipal && (
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsStartNewChatModalOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {t('messages.actions.startNew')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsCreateGroupModalOpen(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              {t('messages.actions.createGroup')}
            </Button>
          </div>
        )}
      </div>

      {/* Chat Interface */}
                  <ChatInterface
        selectedParentId={selectedParentId || undefined}
        isAdminOrPrincipal={isAdminOrPrincipal}
        activeTab={activeTab}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onOpenChange={setIsCreateGroupModalOpen}
        onGroupCreated={handleGroupCreated}
      />

      {/* Start New Chat Modal */}
      <StartNewChatModal
        open={isStartNewChatModalOpen}
        onOpenChange={setIsStartNewChatModalOpen}
        onParentSelected={handleParentSelected}
      />

      {/* Start New Chat Admin Modal */}
      <StartNewChatAdminModal
        open={isStartNewChatAdminModalOpen}
        onOpenChange={setIsStartNewChatAdminModalOpen}
        onTeacherSelected={handleTeacherSelected}
      />
    </div>
  );
}
