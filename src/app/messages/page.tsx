'use client';

import { Button } from '@/components/ui/button';
import { Users, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/messages/chat-interface';
import { CreateGroupModal } from '@/components/messages/create-group-modal';
import { StartNewChatModal } from '@/components/messages/start-new-chat-modal';
import { StartNewChatAdminModal } from '@/components/messages/start-new-chat-admin-modal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/context';
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

  // Optimized: No page-level fetches; ChatInterface handles threads/messages.

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




  // No loading/error guards needed here now

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Actions */}
      <div className="flex flex-col gap-4">
        {/* Chat Type Tabs */}
        {/* Simple header actions */}
        <div className="flex items-center justify-between">
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

        {/* Filters Section */}
        {/* Filters removed for optimization */}

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
