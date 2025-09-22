// src/hooks/use-chat-threads.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  chatThreadsServices,
  ChatThread,
  ChatMessage
} from '@/lib/api/chat-threads';

export function useChatThreads() {
  const { token } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await chatThreadsServices.getChatThreads(token);
      setThreads(response.data.threads);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chat threads';
      setError(errorMessage);
      console.error('Chat threads fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchThreads();
  }, [token, fetchThreads]);

  const refreshThreads = () => {
    fetchThreads();
  };

  return {
    threads,
    loading,
    error,
    refreshThreads
  };
}

export function useChatMessages(threadId: string | null) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    console.log('📡 HOOK: useChatMessages fetchMessages called:', {
      threadId,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    
    if (!token || !threadId) {
      console.log('🧹 HOOK: No token or thread ID, clearing messages');
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 HOOK: Fetching messages for thread:', threadId);
      const response = await chatThreadsServices.getChatMessages(threadId, token);
      console.log('📨 HOOK: Messages response received:', {
        status: response.status,
        messageCount: response.data?.messages?.length || 0,
        messages: response.data?.messages?.map(m => ({
          id: m.id,
          content: m.content?.substring(0, 20) + '...',
          sender: m.sender?.full_name
        }))
      });
      setMessages(response.data.messages);
      console.log('✅ HOOK: Messages set successfully, count:', response.data.messages.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('❌ HOOK: Chat messages fetch error:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId, token]);

  useEffect(() => {
    console.log('🔄 HOOK: useChatMessages useEffect triggered:', {
      threadId,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    fetchMessages();
  }, [threadId, token, fetchMessages]);

  const refreshMessages = () => {
    fetchMessages();
  };

  return {
    messages,
    loading,
    error,
    refreshMessages
  };
}
