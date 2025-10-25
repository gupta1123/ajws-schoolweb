// src/components/messaging/message-panel.tsx

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Users, MessageCircle } from 'lucide-react';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { messagingAPI, Message, formatMessageTimeShort } from '@/lib/api/messaging';
import { EditMessageModal } from '@/components/ui/edit-message-modal';

interface ChatThread {
  id: string;
  title: string;
  thread_type: 'direct' | 'group';
  participants: Array<{
    user_id: string;
    user: {
      id: string;
      full_name: string;
    };
  }>;
  last_message?: Array<{
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }>;
  created_at: string;
  updated_at: string;
}


interface MessagePanelProps {
  thread: ChatThread;
  currentUser: { id: string; full_name: string };
  onMessageSent: (message: Message) => void;
}

export function MessagePanel({ thread, currentUser, onMessageSent }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Compute the latest message timestamp from the other participant (for direct messages)
  const lastOtherMessageAt = useMemo(() => {
    const others = messages.filter(m => m.sender_id !== currentUser.id);
    if (others.length === 0) return null as string | null;
    return others.reduce((latest, m) => {
      return new Date(m.created_at) > new Date(latest) ? m.created_at : latest;
    }, others[0].created_at);
  }, [messages, currentUser.id]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isSubscribedRef = useRef<string | null>(null);
  
  const {
    isConnected,
    connectionStatus,
    sendMessage: sendWebSocketMessage,
    subscribeToThread,
    unsubscribeFromThread,
    startPolling,
    stopPolling,
    fetchNewMessages
  } = useWebSocketChat();

  // Handle new messages from polling
  const handleNewMessages = useCallback((wsMessages: ({ id: string; content: string; sender_id: string; sender: { full_name: string }; created_at: string } | undefined)[]) => {
    const validMessages = wsMessages.filter((msg): msg is { id: string; content: string; sender_id: string; sender: { full_name: string }; created_at: string } => msg !== undefined);
    
    if (validMessages.length === 0) return;
    
    console.log('🔄 Polling: Received new messages:', validMessages.length);
    
    // Convert WebSocket messages to Message format
    const newMessages: Message[] = validMessages.map(wsMsg => ({
      id: wsMsg.id,
      content: wsMsg.content,
      sender_id: wsMsg.sender_id,
      sender: {
        id: wsMsg.sender_id,
        full_name: wsMsg.sender.full_name
      },
      created_at: wsMsg.created_at,
      status: 'sent' as const,
      message_type: 'text' as const
    }));
    
    setMessages(prev => {
      const existingIds = new Set(prev.map(msg => msg.id));
      const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
      
      if (uniqueNewMessages.length === 0) return prev;
      
      console.log('✅ Polling: Adding new messages:', uniqueNewMessages.length);
      
      // Sort messages by created_at to maintain order
      const allMessages = [...prev, ...uniqueNewMessages];
      return allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, []);

  // Handle WebSocket messages with deduplication
  const handleWebSocketMessage = useCallback((wsMessage: { id: string; content: string; sender_id: string; sender: { full_name: string }; created_at: string } | undefined) => {
    console.log('📨 MessagePanel: handleWebSocketMessage called with:', wsMessage);
    if (!wsMessage) {
      console.log('📨 MessagePanel: No message provided');
      return;
    }
    
    console.log('📨 WebSocket: Received message:', wsMessage.id, wsMessage.content.substring(0, 20) + '...');
    
    // Convert WebSocket message to Message format
    const message: Message = {
      id: wsMessage.id,
      content: wsMessage.content,
      sender_id: wsMessage.sender_id,
      sender: {
        id: wsMessage.sender_id,
        full_name: wsMessage.sender.full_name
      },
      created_at: wsMessage.created_at,
      status: 'sent',
      message_type: 'text'
    };
    
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const existingIds = new Set(prev.map(msg => msg.id));
      if (existingIds.has(message.id)) {
        console.log('🔄 WebSocket: Message already exists, skipping');
        return prev;
      }
      
      // Check for optimistic message replacement
      const optimisticMessage = prev.find(msg => 
        msg.id.startsWith('temp-') && 
        msg.content === message.content && 
        msg.sender_id === message.sender_id
      );
      
      if (optimisticMessage) {
        console.log('🔄 WebSocket: Replacing optimistic message');
        // Replace optimistic message with real one
        return prev.map(msg => 
          msg.id === optimisticMessage.id ? message : msg
        );
      }
      
      console.log('✅ WebSocket: Adding new message');
      // Add new message
      const allMessages = [...prev, message];
      return allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, []);

  // Fetch messages when thread changes
  useEffect(() => {
    if (thread && isSubscribedRef.current !== thread.id) {
      console.log('🔄 Thread changed, fetching messages and setting up auto-refresh');
      fetchMessages();
      subscribeToThread(thread.id, handleWebSocketMessage);
      isSubscribedRef.current = thread.id;
      
      // Always start polling as a backup, regardless of WebSocket status
      console.log('🔄 Starting polling for thread:', thread.id);
      startPolling(thread.id, handleNewMessages);
    }

    return () => {
      if (thread && isSubscribedRef.current === thread.id) {
        console.log('🔄 Cleaning up thread:', thread.id);
        unsubscribeFromThread(thread.id);
        stopPolling(thread.id);
        isSubscribedRef.current = null;
        console.log('🔄 Thread cleanup completed, WebSocket will disconnect if no other subscriptions');
      }
    };
  }, [thread?.id]); // Simplified dependencies to prevent rapid re-subscriptions

  // Monitor connection status and start/stop polling accordingly
  useEffect(() => {
    if (thread) {
      console.log('🔄 Connection status changed:', { isConnected, connectionStatus, threadId: thread.id });
      
      // Always keep polling running as backup, even when WebSocket is connected
      // This ensures messages are received even if WebSocket message processing fails
      console.log('🔄 Starting polling for thread (backup):', thread.id);
      startPolling(thread.id, handleNewMessages);
    }
  }, [isConnected, connectionStatus, thread?.id, startPolling, stopPolling, handleNewMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const messages = await messagingAPI.fetchMessages(thread.id, undefined, 50);
      setMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Create optimistic message with unique temp ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: currentUser.id,
      sender: {
        id: currentUser.id,
        full_name: currentUser.full_name
      },
      created_at: new Date().toISOString(),
      status: 'sending',
      message_type: 'text',
      approval_status: 'pending'
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      let success = false;
      let sentMessage: Message | null = null;

      // Try WebSocket first
      if (isConnected) {
        try {
          await sendWebSocketMessage(thread.id, messageContent, 'text');
          // Mark as sent (keeps approval_status pending until server updates arrive)
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, status: 'sent', approval_status: 'pending' }
              : msg
          ));
          success = true;
        } catch (error) {
          console.log('WebSocket send failed, trying HTTP fallback');
        }
      }

      // Fallback to HTTP
      if (!success) {
        try {
          sentMessage = await messagingAPI.sendMessage(thread.id, messageContent, 'text');
          success = true;
          
          // Replace optimistic message with real one from server; default approval_status to pending if missing
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...sentMessage!, status: 'sent', approval_status: sentMessage!.approval_status ?? 'pending' }
              : msg
          ));
          
          onMessageSent(sentMessage);
        } catch (error) {
          console.error('HTTP send failed:', error);
        }
      }

      if (!success) {
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Retry failed message
  const retryFailedMessage = async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId);
    if (!failedMessage || failedMessage.status !== 'failed') return;

    // Update status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'sending' }
        : msg
    ));

    try {
      let success = false;
      let sentMessage: Message | null = null;

      // Try WebSocket first
      if (isConnected) {
        try {
          await sendWebSocketMessage(thread.id, failedMessage.content, 'text');
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'sent', approval_status: 'pending' }
              : msg
          ));
          success = true;
        } catch (error) {
          console.log('WebSocket retry failed, trying HTTP fallback');
        }
      }

      // Fallback to HTTP
      if (!success) {
        try {
          sentMessage = await messagingAPI.sendMessage(thread.id, failedMessage.content, 'text');
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...sentMessage!, status: 'sent', approval_status: sentMessage!.approval_status ?? 'pending' }
              : msg
          ));
          onMessageSent(sentMessage);
          success = true;
        } catch (error) {
          console.error('HTTP retry failed:', error);
        }
      }

      if (!success) {
        // Mark message as failed again
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };



  const getThreadTitle = () => {
    if (thread.thread_type === 'group') {
      return thread.title;
    }
    
    // Safety check for participants array
    if (!thread.participants || !Array.isArray(thread.participants)) {
      return thread.title;
    }
    
    const otherParticipant = thread.participants.find(p => p.user_id !== currentUser.id);
    return otherParticipant?.user.full_name || thread.title;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => {
              const isOwn = i % 2 === 1;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3',
                    isOwn && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar skeleton only for group chats */}
                  {thread.thread_type === 'group' && (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  )}
                  <div className={cn('max-w-xs w-fit', isOwn && 'items-end')}> 
                    <div className={cn('rounded-lg p-2', 'bg-muted/60')}>
                      <Skeleton className="h-4 w-40" />
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-3 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {thread.thread_type === 'group' ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <MessageCircle className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{getThreadTitle()}</h2>
              <p className="text-sm text-muted-foreground">
                {thread.thread_type === 'group' 
                  ? `${thread.participants?.length || 0} participants`
                  : 'Direct message'
                }
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex space-x-3",
                    isOwn && "flex-row-reverse space-x-reverse"
                  )}
                >
                  {/* Avatar only for group chats */}
                  {thread.thread_type === 'group' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {message.sender.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn("max-w-[70%] flex flex-col", isOwn && "items-end")}>
                    {/* Sender label for group chats */}
                    {thread.thread_type === 'group' && !isOwn && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.sender.full_name}
                      </p>
                    )}
                    
                    <div
                      className={cn(
                        "inline-block w-fit rounded-lg px-3 py-2 text-sm break-words",
                        message.approval_status === 'rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : (isOwn && message.approval_status === 'pending')
                            ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                            : (isOwn 
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted')
                      )}
                    >
                      <div>{message.content}</div>
                      {/* Rejected reason + edit button for own pending/rejected */}
                      {isOwn && (message.approval_status === 'rejected' || message.approval_status === 'pending') && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {message.approval_status === 'rejected' && (
                            <span className="text-[11px] text-red-600">
                              Rejected{message.rejection_reason ? `: ${message.rejection_reason}` : ''}
                            </span>
                          )}
                          {(() => {
                            const canEdit = thread.thread_type !== 'direct' || lastOtherMessageAt === null || new Date(message.created_at) > new Date(lastOtherMessageAt);
                            if (!canEdit) return null;
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs ml-auto"
                                onClick={() => { setEditTarget(message); setEditOpen(true); }}
                              >
                                Edit
                              </Button>
                            );
                          })()}
                        </div>
                      )}
                      {/* Time and tick inside bubble, aligned right */}
                      <div className={cn(
                        "mt-1 flex items-center gap-1 text-[10px] opacity-80",
                        "justify-end"
                      )}>
                        <span>{formatMessageTimeShort(message.created_at)}</span>
                        {isOwn && thread.thread_type !== 'group' && (
                          (() => {
                            const othersRead = Array.isArray(message.read_by)
                              ? message.read_by.some(r => r.user_id !== currentUser.id)
                              : false;
                            if (othersRead) {
                              return (
                                <span className="inline-flex items-center">
                                  <svg width="14" height="14" viewBox="0 0 24 24" className={cn('text-blue-700 dark:text-blue-300')}>
                                    <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                                  </svg>
                                  <svg width="14" height="14" viewBox="0 0 24 24" className={cn('-ml-2 z-10 text-blue-700 dark:text-blue-300')}>
                                    <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                                  </svg>
                                </span>
                              );
                            }
                            return (
                              <svg width="14" height="14" viewBox="0 0 24 24" className={cn(isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground')}>
                                <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                              </svg>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit & Resend Modal */}
      <EditMessageModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        originalContent={editTarget?.content || ''}
        rejectionReason={editTarget?.rejection_reason}
        isLoading={isUpdating}
        onConfirm={async (content) => {
          if (!editTarget) return;
          try {
            setIsUpdating(true);
            const updated = await messagingAPI.updateMessage(editTarget.id, content);
            // Update message content locally
            setMessages(prev => prev.map(m => m.id === editTarget.id ? { ...m, ...updated } : m));
            setEditOpen(false);
            setEditTarget(null);
          } finally {
            setIsUpdating(false);
          }
        }}
      />
    </div>
  );
}
