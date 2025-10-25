// src/app/admin/messaging/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ThreadList, MessagePanel, PrincipalNewChatModal } from '@/components/messaging';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { messagingAPI, ChatThread } from '@/lib/api/messaging';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';

export default function PrincipalMessagingPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // WebSocket connection status
  const { isConnected, connectionStatus } = useWebSocketChat();

  // Fetch threads on component mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      const threads = await messagingAPI.fetchThreads();
      setThreads(threads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  const handleNewThread = (newThread: ChatThread) => {
    setThreads(prev => [newThread, ...prev]);
    setSelectedThread(newThread);
    setIsNewChatOpen(false);
  };

  const handleMessageSent = (message: { id: string; content: string; created_at: string; sender_id: string }) => {
    // Update the last message in the thread
    setThreads(prev => prev.map(thread => 
      thread.id === selectedThread?.id 
        ? { ...thread, last_message: [message] }
        : thread
    ));
  };

  // Auto-refresh thread list every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing thread list');
      fetchThreads();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('messaging.newChat')}
            </Button>
            {/* Removed Filter by Division button per requirements */}
            <Button 
              variant="outline"
              onClick={() => router.push('/admin/messaging/approvals')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Approvals
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card">
        {/* Thread List Panel */}
        <div className="w-1/3 border-r flex flex-col bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('principalMessaging.conversations')}
              </h2>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            <ThreadList
              threads={threads}
              selectedThread={selectedThread}
              onThreadSelect={handleThreadSelect}
              isLoading={isLoading}
              onRefresh={fetchThreads}
              currentUserId={user?.id || ''}
              isConnected={isConnected}
              connectionStatus={connectionStatus}
            />
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 flex flex-col">
          {selectedThread && user ? (
            <MessagePanel
              thread={selectedThread}
              currentUser={user}
              currentUserRole={user.role}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {t('principalMessaging.selectConversation')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('principalMessaging.chooseConversation')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {user && (
        <PrincipalNewChatModal
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onThreadCreated={handleNewThread}
          currentUser={user}
        />
      )}

    </div>
  );
}
