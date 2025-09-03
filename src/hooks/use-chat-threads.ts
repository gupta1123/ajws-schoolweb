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
    console.log('=== useChatMessages fetchMessages called ===');
    console.log('Thread ID:', threadId);
    console.log('Token available:', !!token);
    
    if (!token || !threadId) {
      console.log('No token or thread ID, clearing messages');
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching messages for thread:', threadId);
      const response = await chatThreadsServices.getChatMessages(threadId, token);
      console.log('Messages response:', response);
      setMessages(response.data.messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Chat messages fetch error:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [threadId, token]);

  useEffect(() => {
    console.log('=== useChatMessages useEffect triggered ===');
    console.log('Thread ID changed to:', threadId);
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
