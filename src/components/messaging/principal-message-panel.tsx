// src/components/messaging/principal-message-panel.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
}

export function PrincipalMessagePanel({ teacher, thread, currentUser, onMessageSent }: PrincipalMessagePanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
    }
  }, [thread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!thread) return;
    
    try {
      setIsLoading(true);
      const fetchedMessages = await messagingAPI.fetchMessages(thread.id);
      setMessages(fetchedMessages);
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                </div>
              ))}
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                    {message.sender.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className={cn(
                    'flex-1 max-w-[70%]',
                    message.sender_id === currentUser.id ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      message.sender_id === currentUser.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p>{message.content}</p>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-xs text-muted-foreground',
                      message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
                    )}>
                      <span>{formatMessageTimeShort(message.created_at)}</span>
                      {message.sender_id === currentUser.id && (
                        <span className={cn(
                          'w-1 h-1 rounded-full',
                          message.status === 'sent' ? 'bg-green-500' :
                          message.status === 'sending' ? 'bg-yellow-500' :
                          message.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        )} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
