// src/components/messaging/principal-message-panel.tsx

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Users, MessageCircle, Phone, Mail } from 'lucide-react';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { messagingAPI, Message, formatMessageTimeShort } from '@/lib/api/messaging';
import { PrincipalDivisionTeacher } from '@/lib/api/principal-messaging';
import { useI18n } from '@/lib/i18n/context';
import { RejectionModal } from '@/components/ui/rejection-modal';

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

interface PrincipalMessagePanelProps {
  teacher: PrincipalDivisionTeacher;
  thread: ChatThread;
  currentUser: { id: string; full_name: string };
  onMessageSent: (message: { id: string; content: string; created_at: string; sender_id: string }) => void;
  teacherPerspective?: boolean; // If true, show teacher messages on right, others on left
}

export function PrincipalMessagePanel({ teacher, thread, currentUser, onMessageSent, teacherPerspective = false }: PrincipalMessagePanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isSubscribedRef = useRef<string | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const scrollPositionRef = useRef<number>(0);
  
  // Compute the latest parent message timestamp to gate approval actions
  const lastParentMessageAt = useMemo(() => {
    const parentMessages = messages.filter(m => m.sender?.role === 'parent');
    if (parentMessages.length === 0) return null as string | null;
    return parentMessages.reduce((latest, m) => {
      return new Date(m.created_at) > new Date(latest) ? m.created_at : latest;
    }, parentMessages[0].created_at);
  }, [messages]);

  // Ensure instant updates even if WebSocket doesn't emit to principal (e.g., not a participant)
  useEffect(() => {
    if (!thread?.id) return;
    const interval = setInterval(async () => {
      try {
        const latest = await messagingAPI.fetchMessages(thread.id, undefined, 50, { tolerate403: true, suppressErrors: true });
        if (Array.isArray(latest) && latest.length > 0) {
          setMessages(prev => {
            // If latest message id differs from prev last, merge new messages instead of replacing
            const prevLast = prev[prev.length - 1]?.id;
            const latestLast = latest[latest.length - 1]?.id;
            if (prevLast !== latestLast) {
              // Merge new messages with existing ones, avoiding duplicates
              const existingIds = new Set(prev.map(msg => msg.id));
              const newMessages = latest.filter(msg => !existingIds.has(msg.id));
              
              if (newMessages.length > 0) {
                // Only update if there are actually new messages
                return [...prev, ...newMessages].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              }
            }
            return prev;
          });
        }
      } catch (e) {
        // tolerate failures silently
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [thread?.id]);
  
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

  // Handle new messages from WebSocket (single message)
  const handleNewMessage = useCallback((message: { id: string; content: string; sender_id: string; sender: { full_name: string }; created_at: string } | undefined) => {
    if (message) {
      const newMessage: Message = {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        sender: {
          id: message.sender_id,
          full_name: message.sender.full_name
        },
        created_at: message.created_at,
        status: 'sent' as const,
        message_type: 'text' as const
      };
      
      setMessages(prev => {
        if (!prev.some(existing => existing.id === newMessage.id)) {
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        return prev;
      });
    }
  }, []);


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
      
      return [...prev, ...uniqueNewMessages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (thread && isConnected) {
      // Unsubscribe from previous thread
      if (isSubscribedRef.current && isSubscribedRef.current !== thread.id) {
        unsubscribeFromThread(isSubscribedRef.current);
      }
      
      // Subscribe to new thread
      subscribeToThread(thread.id, handleNewMessage);
      isSubscribedRef.current = thread.id;
      
      // Start polling for new messages
      startPolling(thread.id, handleNewMessages);
      
      return () => {
        unsubscribeFromThread(thread.id);
        stopPolling(thread.id);
        isSubscribedRef.current = null;
      };
    }
  }, [thread, isConnected, subscribeToThread, unsubscribeFromThread, startPolling, stopPolling, handleNewMessage, handleNewMessages, fetchNewMessages]);

  // Fetch messages when thread changes
  useEffect(() => {
    if (thread) {
      fetchMessages();
      // Reset scroll position tracking when thread changes
      isAtBottomRef.current = true;
    }
  }, [thread]);

  // Track scroll position to determine if user is at bottom
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      isAtBottomRef.current = isNearBottom;
      scrollPositionRef.current = scrollTop;
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom only if user is already at bottom (or near it)
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    // Only auto-scroll if user is at bottom (within 100px threshold)
    if (isAtBottomRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    } else {
      // Preserve scroll position when user is scrolling up
      scrollElement.scrollTop = scrollPositionRef.current;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!thread) return;
    
    try {
      setIsLoading(true);
      const fetchedMessages = await messagingAPI.fetchMessages(thread.id);
      setMessages(fetchedMessages);
      // Reset to bottom when initially loading messages
      isAtBottomRef.current = true;
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
      message_type: 'text'
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
          // Mark as sent (WebSocket doesn't return the message)
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, status: 'sent' }
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
          
          // Replace optimistic message with real one from server
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...sentMessage!, status: 'sent' }
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
      // Mark message as failed
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

  const getTeacherRole = (teacher: PrincipalDivisionTeacher) => {
    if (teacher.is_primary) return t('principalMessaging.classTeacher');
    return teacher.subject ? `${teacher.subject} ${t('principalMessaging.teacher')}` : t('principalMessaging.subjectTeacher');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Teacher Info Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{teacher.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {getTeacherRole(teacher)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{teacher.phone_number}</span>
          </div>
          {teacher.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{teacher.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => {
                const isOwn = i % 2 === 0;
                return (
                  <div key={i} className={cn('flex items-start gap-3', isOwn && 'flex-row-reverse')}>
                    {thread.thread_type === 'group' && (
                      <Skeleton className="w-8 h-8 rounded-full" />
                    )}
                    <div className="max-w-[70%]">
                      <div className="rounded-lg p-2 bg-muted/60">
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
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {t('principalMessaging.noMessagesYet')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('principalMessaging.startConversation').replace('{name}', teacher.full_name)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                // Determine alignment based on perspective mode
                const isTeacher = message.sender?.role === 'teacher';
                const isOnRight = teacherPerspective 
                  ? isTeacher 
                  : message.sender_id === currentUser.id;
                
                return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOnRight ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {thread.thread_type === 'group' && (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                      {message.sender.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[70%] flex flex-col',
                    isOnRight ? 'items-end' : 'items-start'
                  )}>
                    {/* Bubble with approval status coloring and WhatsApp-like footer */}
                    <div className={cn(
                      'inline-block w-fit rounded-lg px-3 py-2 text-sm break-words',
                      message.approval_status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      message.approval_status === 'pending' && message.sender?.role === 'teacher' ? 'bg-yellow-50 text-yellow-900 border border-yellow-200' :
                      isOnRight ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <div>{message.content}</div>
                      {/* Footer inside bubble */}
                      <div className="mt-1 flex items-center gap-1 text-[10px] opacity-80 justify-end">
                        <span>{formatMessageTimeShort(message.created_at)}</span>
                        {isOnRight && thread.thread_type !== 'group' && (
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
                              <svg width="14" height="14" viewBox="0 0 24 24" className={cn('text-primary-foreground/50')}>
                                <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                              </svg>
                            );
                          })()
                        )}
                      </div>
                      {/* Inline approval badges & actions for principal */}
                      <div className="mt-1 flex items-center gap-2 text-xs">
                      {message.approval_status === 'pending' && (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-900">Pending approval</span>
                            {(message.sender?.role === 'teacher' && (lastParentMessageAt === null || new Date(message.created_at) > new Date(lastParentMessageAt))) && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                const updated = await messagingAPI.approveMessage(message.id);
                                setMessages(prev => prev.map(m => m.id === message.id ? { ...m, ...updated } : m));
                              } catch (e) {
                                console.error(e);
                              }
                            }}>Approve</Button>
                            )}
                            {(message.sender?.role === 'teacher' && (lastParentMessageAt === null || new Date(message.created_at) > new Date(lastParentMessageAt))) && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              setRejectTarget(message);
                              setRejectOpen(true);
                            }}>Reject</Button>
                            )}
                          </>
                        )}
                        {message.approval_status === 'rejected' && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-900">Rejected{message.rejection_reason ? `: ${message.rejection_reason}` : ''}</span>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('principalMessaging.messagePlaceholder').replace('{name}', teacher.full_name)}
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
      </div>

      <RejectionModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={async (reason: string) => {
          if (!rejectTarget) return;
          try {
            const updated = await messagingAPI.rejectMessage(rejectTarget.id, reason);
            setMessages(prev => prev.map(m => m.id === rejectTarget.id ? { ...m, ...updated } : m));
            setRejectOpen(false);
            setRejectTarget(null);
          } catch (e) {
            console.error(e);
          }
        }}
        title="Reject message"
        description="Provide a reason for rejecting this message."
      />
    </div>
  );
}
