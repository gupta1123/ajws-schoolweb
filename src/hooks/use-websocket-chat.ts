// src/hooks/use-websocket-chat.ts

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  thread_id?: string;
  content?: string;
  message_type?: string;
  message?: {
    id: string;
    content: string;
    sender_id: string;
    sender: {
      full_name: string;
    };
    created_at: string;
  };
  data?: {
    id: string;
    thread_id: string;
    sender_id: string;
    content: string;
    message_type: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
}

interface UseWebSocketChatReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  sendMessage: (threadId: string, content: string, messageType: string) => Promise<void>;
  subscribeToThread: (threadId: string, messageHandler?: (message: WebSocketMessage['message']) => void) => void;
  unsubscribeFromThread: (threadId: string) => void;
  onMessage?: (message: WebSocketMessage['message']) => void;
  startPolling: (threadId: string, callback: (messages: WebSocketMessage['message'][]) => void) => void;
  stopPolling: (threadId: string) => void;
  fetchNewMessages: (threadId: string, lastMessageId?: string) => Promise<WebSocketMessage['message'][]>;
}

export function useWebSocketChat(): UseWebSocketChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed'>('disconnected');
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedThreadsRef = useRef<Set<string>>(new Set());
  const messageHandlersRef = useRef<Map<string, (message: WebSocketMessage['message']) => void>>(new Map());
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pollingCallbacksRef = useRef<Map<string, (messages: WebSocketMessage['message'][]) => void>>(new Map());
  const lastMessageIdsRef = useRef<Map<string, string>>(new Map());
  const connectionAttemptsRef = useRef(0);
  const lastConnectionAttemptRef = useRef(0);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected, skipping');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🔌 WebSocket already connecting, skipping');
      return;
    }

    // Throttle connection attempts
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
    if (timeSinceLastAttempt < 2000) { // Wait at least 2 seconds between attempts
      console.log('🔌 Connection throttled, waiting...');
      return;
    }

    if (isConnectingRef.current) {
      console.log('🔌 Already connecting, skipping');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for WebSocket connection');
      setConnectionStatus('failed');
      return;
    }

    // Don't close existing connection, just skip if already exists
    if (wsRef.current) {
      console.log('🔌 WebSocket already exists, skipping new connection');
      return;
    }

    isConnectingRef.current = true;
    lastConnectionAttemptRef.current = now;
    connectionAttemptsRef.current++;
    
    setConnectionStatus('connecting');
    console.log('🔌 Connecting to WebSocket... (attempt:', connectionAttemptsRef.current, ')');

    // Try multiple WebSocket endpoints for compatibility
    const wsUrls = [
      `wss://ajws-school-ba8ae5e3f955.herokuapp.com?token=${encodeURIComponent(token)}`,
      `wss://ajws-school-ba8ae5e3f955.herokuapp.com/ws?token=${encodeURIComponent(token)}`,
      `wss://ajws-school-ba8ae5e3f955.herokuapp.com/websocket?token=${encodeURIComponent(token)}`
    ];

    let connected = false;

    const tryConnect = async (urlIndex = 0) => {
      if (connected || urlIndex >= wsUrls.length) {
        if (!connected) {
          setConnectionStatus('failed');
          setIsConnected(false);
        }
        return;
      }

      try {
        const ws = new WebSocket(wsUrls[urlIndex]);
        
        ws.onopen = () => {
          console.log('🔌 WebSocket connected:', wsUrls[urlIndex]);
          wsRef.current = ws;
          setIsConnected(true);
          setConnectionStatus('connected');
          connected = true;
          isConnectingRef.current = false; // Reset connecting flag
          connectionAttemptsRef.current = 0; // Reset attempts on successful connection

          // Re-subscribe to all threads
          subscribedThreadsRef.current.forEach(threadId => {
            ws.send(JSON.stringify({
              type: 'subscribe_thread',
              thread_id: threadId
            }));
          });
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);

            if (message.type === 'new_message' && message.data?.thread_id) {
              const threadId = message.data.thread_id;
              console.log('📨 Processing new_message for thread:', threadId);
              const handler = messageHandlersRef.current.get(threadId);
              console.log('📨 Handler found:', !!handler, 'Message data:', !!message.data);
              if (handler && message.data) {
                console.log('📨 Calling handler with message:', message.data);
                handler(message.data);
              } else {
                console.log('📨 No handler or message - Handler:', !!handler, 'Message data:', !!message.data);
              }
            } else {
              console.log('📨 Message not processed - Type:', message.type, 'Thread ID:', message.data?.thread_id);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          wsRef.current = null;
          setIsConnected(false);
          isConnectingRef.current = false; // Reset connecting flag
          
          if (event.code === 1006) {
            console.log('WebSocket closed with 1006. Disabling WebSocket for this session.');
            setConnectionStatus('failed');
          } else {
            setConnectionStatus('disconnected');
            // Try to reconnect after a delay
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              setConnectionStatus('reconnecting');
              tryConnect(urlIndex + 1);
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          isConnectingRef.current = false; // Reset connecting flag
          if (!connected) {
            tryConnect(urlIndex + 1);
          }
        };

      } catch (error) {
        console.error('WebSocket connection error:', error);
        isConnectingRef.current = false; // Reset connecting flag
        tryConnect(urlIndex + 1);
      }
    };

    tryConnect();
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback(async (threadId: string, content: string, messageType: string = 'text'): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: WebSocketMessage = {
      type: 'send_message',
      thread_id: threadId,
      content,
      message_type: messageType
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  const subscribeToThread = useCallback((threadId: string, messageHandler?: (message: WebSocketMessage['message']) => void) => {
    console.log('📨 Subscribing to thread:', threadId, 'Handler:', !!messageHandler);
    
    // Check if already subscribed to this thread
    if (subscribedThreadsRef.current.has(threadId)) {
      console.log('📨 Already subscribed to thread:', threadId);
      // Update handler if provided
      if (messageHandler) {
        messageHandlersRef.current.set(threadId, messageHandler);
        console.log('📨 Handler updated for thread:', threadId);
      }
      return;
    }
    
    const wasEmpty = subscribedThreadsRef.current.size === 0;
    subscribedThreadsRef.current.add(threadId);
    
    // Update subscription count
    setActiveSubscriptions(subscribedThreadsRef.current.size);
    
    // Store message handler for this thread
    if (messageHandler) {
      messageHandlersRef.current.set(threadId, messageHandler);
      console.log('📨 Handler stored for thread:', threadId);
    }
    
    // Connect WebSocket if this is the first subscription
    if (wasEmpty && !isConnected) {
      console.log('📨 First subscription, connecting WebSocket');
      connect();
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'subscribe_thread',
        thread_id: threadId
      };
      console.log('📨 Sending subscribe message:', subscribeMessage);
      wsRef.current.send(JSON.stringify(subscribeMessage));
    } else {
      console.log('📨 WebSocket not open, cannot subscribe. State:', wsRef.current?.readyState);
    }
  }, [isConnected, connect]);

  const unsubscribeFromThread = useCallback((threadId: string) => {
    console.log('📨 Unsubscribing from thread:', threadId);
    subscribedThreadsRef.current.delete(threadId);
    messageHandlersRef.current.delete(threadId);
    
    // Update subscription count
    setActiveSubscriptions(subscribedThreadsRef.current.size);
    
    // Disconnect WebSocket if no more subscriptions
    if (subscribedThreadsRef.current.size === 0 && isConnected) {
      console.log('📨 No more subscriptions, disconnecting WebSocket');
      disconnect();
    }
  }, [isConnected, disconnect]);

  // Polling functionality for when WebSocket is unavailable
  const fetchNewMessages = useCallback(async (threadId: string, lastMessageId?: string): Promise<WebSocketMessage['message'][]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      let url = `https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/messages?thread_id=${threadId}`;
      
      if (lastMessageId) {
        url += `&after_id=${lastMessageId}`;
      } else {
        url += `&limit=10`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.messages || [];
      }
      return [];
    } catch (error) {
      console.error('Error polling for messages:', error);
      return [];
    }
  }, []);

  const startPolling = useCallback((threadId: string, callback: (messages: WebSocketMessage['message'][]) => void) => {
    // Stop existing polling for this thread
    stopPolling(threadId);
    
    // Store the callback
    pollingCallbacksRef.current.set(threadId, callback);
    
    // Start polling every 3-5 seconds when WebSocket is disconnected
    const pollInterval = setInterval(async () => {
      if ((!isConnected || connectionStatus === 'disconnected' || connectionStatus === 'failed') && pollingCallbacksRef.current.has(threadId)) {
        console.log('🔄 Polling: Fetching messages for thread:', threadId);
        const lastMessageId = lastMessageIdsRef.current.get(threadId);
        const newMessages = await fetchNewMessages(threadId, lastMessageId);
        
        if (newMessages.length > 0) {
          console.log('🔄 Polling: Found new messages:', newMessages.length);
          const callback = pollingCallbacksRef.current.get(threadId);
          if (callback) {
            callback(newMessages);
            // Update last message ID
            const latestMessage = newMessages[newMessages.length - 1];
            if (latestMessage?.id) {
              lastMessageIdsRef.current.set(threadId, latestMessage.id);
            }
          }
        } else {
          console.log('🔄 Polling: No new messages');
        }
      }
        }, 5000); // Poll every 5 seconds (reduced frequency)

    pollingIntervalsRef.current.set(threadId, pollInterval);
  }, [isConnected, connectionStatus, fetchNewMessages]);

  const stopPolling = useCallback((threadId: string) => {
    const interval = pollingIntervalsRef.current.get(threadId);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(threadId);
    }
    pollingCallbacksRef.current.delete(threadId);
    lastMessageIdsRef.current.delete(threadId);
  }, []);

  // Monitor subscription changes and manage WebSocket connection
  useEffect(() => {
    console.log('🔌 Active subscriptions:', activeSubscriptions, 'Connected:', isConnected);
    
    if (activeSubscriptions > 0 && !isConnected && connectionStatus !== 'connecting') {
      console.log('🔌 Connecting WebSocket due to active subscriptions');
      connect();
    } else if (activeSubscriptions === 0 && isConnected) {
      console.log('🔌 Disconnecting WebSocket - no active subscriptions');
      disconnect();
    }
  }, [activeSubscriptions, isConnected, connectionStatus, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Clear all polling intervals
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollingIntervalsRef.current.clear();
      pollingCallbacksRef.current.clear();
      lastMessageIdsRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    subscribeToThread,
    unsubscribeFromThread,
    startPolling,
    stopPolling,
    fetchNewMessages
  };
}