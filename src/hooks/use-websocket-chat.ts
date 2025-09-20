// src/hooks/use-websocket-chat.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { ChatWebSocket, WebSocketMessage } from '@/lib/api/websocket';
import { sendMessage } from '@/lib/api/messages';
import { chatThreadsServices } from '@/lib/api/chat-threads';

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  sender?: {
    full_name: string;
    role: string;
  };
}

interface UseWebSocketChatOptions {
  threadId: string | null;
  onMessageReceived?: (message: ChatMessage) => void;
  onMessageStatusUpdate?: (messageId: string, status: string) => void;
  onTypingIndicator?: (isTyping: boolean, sender: string) => void;
}

interface UseWebSocketChatReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessageWebSocket: (content: string) => Promise<void>;
  lastError: string | null;
  reconnect: () => void;
}

export function useWebSocketChat({
  threadId,
  onMessageReceived,
  onMessageStatusUpdate,
  onTypingIndicator
}: UseWebSocketChatOptions): UseWebSocketChatReturn {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  
  const websocketRef = useRef<ChatWebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timeouts/intervals
  const clearTimeouts = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // HTTP Polling as backup (every 3 seconds like mobile app)
  const startPolling = useCallback(async () => {
    if (!token || !threadId || pollingIntervalRef.current) return;

    console.log('Starting HTTP polling for thread:', threadId);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('Polling for new messages...');
        
        const response = await chatThreadsServices.getMessagesAfter(threadId, lastMessageIdRef.current, token);
        if (response.data.messages.length > 0) {
          response.data.messages.forEach((msg) => {
            const chatMessage: ChatMessage = {
              id: msg.id,
              thread_id: msg.thread_id,
              sender_id: msg.sender_id,
              content: msg.content,
              timestamp: msg.created_at,
              status: msg.status as 'sent' | 'delivered' | 'read',
              isOwn: msg.sender_id === user?.id,
              sender: msg.sender
            };
            
            if (onMessageReceived) {
              onMessageReceived(chatMessage);
            }
          });
          lastMessageIdRef.current = response.data.messages[response.data.messages.length - 1].id;
        }
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds like mobile app
  }, [token, threadId, onMessageReceived, user?.id]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('Stopped HTTP polling');
    }
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async () => {
    if (!token || websocketRef.current) return;

    try {
      setConnectionStatus('connecting');
      setLastError(null);

      const ws = new ChatWebSocket(token);
      websocketRef.current = ws;

      // Set up message handler
      ws.onMessage((message: WebSocketMessage) => {
        console.log('WebSocket message received:', message);

        switch (message.type) {
          case 'message_received':
          case 'send_message':
          case 'thread_updated':
            if (message.thread_id === threadId && message.content) {
              const chatMessage: ChatMessage = {
                id: Date.now().toString(), // Temporary ID
                thread_id: message.thread_id,
                sender_id: 'other', // Will be updated with actual sender ID
                content: message.content,
                timestamp: message.created_at || new Date().toISOString(),
                status: 'delivered',
                isOwn: false,
                sender: message.sender
              };

              if (onMessageReceived) {
                onMessageReceived(chatMessage);
              }
            }
            break;

          case 'message_status_update':
            if (message.thread_id === threadId && onMessageStatusUpdate) {
              // Handle message status updates (delivered, read, etc.)
              // This would need the message ID from the server
              console.log('Message status update:', message);
            }
            break;

          case 'typing_indicator':
            if (message.thread_id === threadId && onTypingIndicator) {
              // Handle typing indicators
              onTypingIndicator(true, message.sender?.full_name || 'Someone');
            }
            break;

          default:
            console.log('Unhandled WebSocket message type:', message.type);
        }
      });

      // Connect to WebSocket
      await ws.connect();
      
      if (ws.isConnected()) {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('WebSocket connected successfully');
        
        // Subscribe to thread if threadId is provided
        if (threadId) {
          ws.subscribeToThread(threadId);
          console.log('🔗 WebSocket: Auto-subscribed to thread on connection:', threadId);
        }
        
        // Stop polling when WebSocket is connected
        stopPolling();
      } else {
        setConnectionStatus('error');
        setLastError('Failed to establish WebSocket connection');
      }
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'WebSocket connection failed');
      
      // Start polling as fallback
      startPolling();
    }
  }, [token, threadId, onMessageReceived, onMessageStatusUpdate, onTypingIndicator, stopPolling, startPolling]);

  // Send message via WebSocket with HTTP fallback
  const sendMessageWebSocket = useCallback(async (content: string) => {
    if (!threadId || !token) {
      throw new Error('Thread ID or token not available');
    }

    const ws = websocketRef.current;
    
    // Try WebSocket first (preferred method like mobile app)
    if (ws && ws.isConnected()) {
      try {
        console.log('Sending message via WebSocket');
        ws.sendMessage(threadId, content);
        
        // Add optimistic message to UI
        const optimisticMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          thread_id: threadId,
          sender_id: user?.id || 'me',
          content,
          timestamp: new Date().toISOString(),
          status: 'sending',
          isOwn: true,
          sender: {
            full_name: user?.full_name || 'You',
            role: user?.role || 'user'
          }
        };

        if (onMessageReceived) {
          onMessageReceived(optimisticMessage);
        }

        // Update status to sent after WebSocket sends
        setTimeout(() => {
          if (onMessageStatusUpdate) {
            onMessageStatusUpdate(optimisticMessage.id, 'sent');
          }
        }, 100);

        return;
      } catch (error) {
        console.warn('WebSocket send failed, falling back to HTTP:', error);
      }
    }

    // Fallback to HTTP (like mobile app)
    console.log('Sending message via HTTP fallback');
    try {
      const response = await sendMessage(
        { thread_id: threadId, content },
        token
      );

      if (response instanceof Blob) {
        throw new Error('Unexpected blob response');
      }

      if (response.status === 'success' && 'data' in response && response.data) {
        const messageData = response.data;
        
        const sentMessage: ChatMessage = {
          id: messageData.data.id,
          thread_id: messageData.data.thread_id || threadId,
          sender_id: messageData.data.sender_id,
          content: messageData.data.content,
          timestamp: messageData.data.created_at,
          status: 'sent',
          isOwn: messageData.data.sender_id === user?.id,
          sender: messageData.data.sender ? {
            full_name: messageData.data.sender.full_name,
            role: messageData.data.sender.role || 'unknown'
          } : undefined
        };

        if (onMessageReceived) {
          onMessageReceived(sentMessage);
        }
      } else {
        throw new Error('Failed to send message via HTTP');
      }
    } catch (error) {
      console.error('HTTP send failed:', error);
      throw error;
    }
  }, [threadId, token, user, onMessageReceived, onMessageStatusUpdate]);

  // Reconnect function
  const reconnect = useCallback(async () => {
    console.log('Manual reconnect requested');
    clearTimeouts();
    
    if (websocketRef.current) {
      websocketRef.current.disconnect();
      websocketRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    await initializeWebSocket();
  }, [clearTimeouts, initializeWebSocket]);

  // Initialize WebSocket when token or threadId changes
  useEffect(() => {
    if (token) {
      initializeWebSocket();
    }

    return () => {
      clearTimeouts();
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
      }
    };
  }, [token, initializeWebSocket, clearTimeouts]);

  // Subscribe to thread when threadId changes
  useEffect(() => {
    if (websocketRef.current && threadId) {
      if (websocketRef.current.isConnected()) {
        websocketRef.current.subscribeToThread(threadId);
        console.log('🔗 WebSocket: Subscribed to thread:', threadId);
      } else {
        console.log('🔗 WebSocket: Connection not ready, will subscribe when connected');
        // The subscription will be handled when connection is established
      }
    }
  }, [threadId]);

  // Start polling if WebSocket is not connected
  useEffect(() => {
    if (!isConnected && threadId && token) {
      startPolling();
    } else if (isConnected) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isConnected, threadId, token, startPolling, stopPolling]);

  return {
    isConnected,
    connectionStatus,
    sendMessageWebSocket,
    lastError,
    reconnect
  };
}
