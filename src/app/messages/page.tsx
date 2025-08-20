'use client';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Plus, Users, BellIcon, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ChatInterface } from '@/components/messages/chat-interface';
import { BatchNotifications } from '@/components/messages/batch-notifications';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications'>('chat');

  const handleTabChange = (tab: 'chat' | 'notifications') => {
    setActiveTab(tab);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <PageHeader
        title="Messages & Notifications"
        description="Chat with parents, teachers, and send batch notifications"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        }
      />

      <div className="flex flex-wrap border-b gap-2 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'chat' 
              ? 'bg-muted border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('chat')}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Chat
          </div>
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'notifications' 
              ? 'bg-muted border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('notifications')}
        >
          <div className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" />
            Batch Notifications
          </div>
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          <ChatInterface />
          
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start New Chat
            </Button>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        </>
      ) : (
        <BatchNotifications />
      )}
    </div>
  );
}