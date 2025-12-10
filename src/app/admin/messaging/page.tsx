// src/app/admin/messaging/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ThreadList, MessagePanel, PrincipalNewChatModal } from '@/components/messaging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MessageCircle, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { ChatThread as MessagingChatThread } from '@/lib/api/messaging';
import { principalChatsServices } from '@/lib/api';
import type { ChatThread as PrincipalChatThread } from '@/lib/api/principal-chats';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';

type TabType = 'dm' | 'approvals';

export default function PrincipalMessagingPage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [selectedThread, setSelectedThread] = useState<MessagingChatThread | null>(null);
  const [threads, setThreads] = useState<MessagingChatThread[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dm');
  const [query, setQuery] = useState('');
  
  // WebSocket connection status
  const { isConnected, connectionStatus } = useWebSocketChat();

  // Map principal chats API threads to messaging ChatThread shape used by UI
  const mapPrincipalThreadToMessagingThread = (thread: PrincipalChatThread): MessagingChatThread => {
    const last = thread.last_message;
    const hasLastSender = !!(last && last.sender && last.sender.id);

    return {
      id: thread.thread_id,
      title: thread.title,
      thread_type: thread.thread_type,
      participants: (thread.participants?.all ?? []).map((p) => ({
        user_id: p.user_id,
        user: {
          id: p.user.id,
          full_name: p.user.full_name,
          role: p.user.role,
        },
      })),
      last_message: hasLastSender
        ? [
            {
              id: last!.id,
              content: last!.content,
              created_at: last!.created_at,
              sender_id: last!.sender!.id,
            },
          ]
        : [],
      created_at: thread.created_at,
      updated_at: thread.updated_at,
    };
  };

  const fetchThreads = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Use principal chats endpoint, filtered to direct messages including the principal
      const response = await principalChatsServices.getPrincipalChats(
        {
          chat_type: 'direct',
          includes_me: 'yes',
          page: 1,
          limit: 50,
        },
        token
      );

      const principalThreads = response.data.threads ?? [];
      const mappedThreads = principalThreads.map(mapPrincipalThreadToMessagingThread);
      setThreads(mappedThreads);

      // Auto-select first thread only when nothing is selected yet
      if (!selectedThread && mappedThreads.length > 0) {
        setSelectedThread(mappedThreads[0]);
      }
    } catch (error) {
      console.error('Error fetching principal DM threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedThread]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((thread) => {
      const title = thread.title?.toLowerCase() ?? '';
      const lastMessageContent =
        thread.last_message && thread.last_message.length > 0
          ? thread.last_message[0].content.toLowerCase()
          : '';
      const participants = (thread.participants ?? [])
        .map((p) => p.user.full_name.toLowerCase())
        .join(' ');

      return (
        title.includes(q) ||
        lastMessageContent.includes(q) ||
        participants.includes(q)
      );
    });
  }, [threads, query]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleThreadSelect = (thread: MessagingChatThread) => {
    setSelectedThread(thread);
  };

  const handleNewThread = (newThread: MessagingChatThread) => {
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
  }, [fetchThreads]);

  return (
    <div className="space-y-6">
      {/* Header with Tabs & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div className="flex items-center gap-1">
            <Button
              variant={activeTab === 'dm' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-none border-b-2 ${activeTab === 'dm' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => {
                setActiveTab('dm');
                // Stay on this page for DM view
                router.push('/admin/messaging');
              }}
            >
              DM
            </Button>
            <Button
              variant={activeTab === 'approvals' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-none border-b-2 ${activeTab === 'approvals' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => {
                setActiveTab('approvals');
                router.push('/admin/messaging/approvals');
              }}
            >
              Approvals
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('messaging.newChat')}
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
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search conversations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            <ThreadList
              threads={filteredThreads}
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
