export interface WebSocketMessage {
  type:
    | 'subscribe_thread'
    | 'thread_subscribed'
    | 'send_message'
    | 'message_received'
    | 'new_message'
    | 'message' // server may use generic 'message'
    | 'thread_updated'
    | 'message_status_update'
    | 'typing_indicator'
    | 'typing'
    | 'error'
    | 'connection_status'
    | 'connection_established'
    | 'pong'
    | 'ping';
  thread_id?: string;
  content?: string;
  message_type?: 'text';
  message_id?: string;
  status?: 'sent' | 'delivered' | 'read';
  sender?: {
    full_name: string;
    role: string;
    id?: string;
  };
  created_at?: string;
  is_typing?: boolean;
  connection_status?: 'connected' | 'disconnected';
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
  // Handshake fields (server → client)
  user_id?: string;
  timestamp?: string;
  // Generic ids for incoming messages
  id?: string;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private onConnectionStatusCallback: ((connected: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Limit to 3 attempts to prevent infinite loops
  private reconnectDelay = 500; // base delay ms - faster reconnection
  private pendingSubscriptions: Set<string> = new Set();
  private subscribedThreads: Set<string> = new Set();
  private lastErrorLoggedAt = 0;
  private isManualDisconnect = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private handshakeComplete = false;
  private abnormalCloseCount = 0;
  private permanentlyDisabled = false;
  private wsUrls: string[] = [];
  private currentUrlIndex = 0;

  constructor(token: string) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Try multiple endpoints similar to mobile client
        if (this.wsUrls.length === 0) {
          const base = 'wss://ajws-school-ba8ae5e3f955.herokuapp.com';
          const q = `?token=${encodeURIComponent(this.token)}`;
          this.wsUrls = [
            `${base}${q}`,
            `${base}/ws${q}`,
            `${base}/websocket${q}`,
          ];
          this.currentUrlIndex = 0;
        }
        const targetUrl = this.wsUrls[this.currentUrlIndex % this.wsUrls.length];
        console.log('WebSocket connecting to:', targetUrl);
        this.ws = new WebSocket(targetUrl);

        // Set a timeout for the connection attempt
        const connectionTimeout = setTimeout(() => {
          console.warn('WebSocket connection timeout');
          if (this.ws) {
            this.ws.close();
          }
          // Do not reject; allow reconnection logic to proceed
        }, 5000); // Reduced timeout for faster fallback to polling

        // Ensure the caller does not hang awaiting connect()
        let settled = false;

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.isManualDisconnect = false;
          this.handshakeComplete = false;
          this.abnormalCloseCount = 0;
          
          // (Temporarily disabled) Only start heartbeat if server requires it
          // this.startHeartbeat();
          
          // Do not mark connected yet; wait for server handshake
          
          if (!settled) {
            settled = true;
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            // Handle server handshake before forwarding
            if (message.type === 'connection_established') {
              this.handshakeComplete = true;
              if (this.onConnectionStatusCallback) {
                this.onConnectionStatusCallback(true);
              }
              // Flush any pending subscriptions now that server is ready
              this.pendingSubscriptions.forEach((threadId) => {
                const sub: WebSocketMessage = { type: 'subscribe_thread', thread_id: threadId };
                this.ws?.send(JSON.stringify(sub));
              });
              this.pendingSubscriptions.clear();
              return; // Don't fall through; already handled
            }
            if (message.type === 'thread_subscribed' && message.thread_id) {
              this.subscribedThreads.add(message.thread_id);
              // Do not early return; let consumer know as well
            }
            if (message.type === 'ping') {
              // Reply to application-level ping if server expects it
              const pong: WebSocketMessage = { type: 'pong' } as WebSocketMessage;
              this.ws?.send(JSON.stringify(pong));
              return;
            }
            if (this.onMessageCallback) {
              this.onMessageCallback(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();
          this.handshakeComplete = false;
          this.subscribedThreads.clear();
          
          // Notify connection status callback
          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(false);
          }
          if (event.code === 1006 || event.code === 1005) {
            this.abnormalCloseCount += 1;
            if (this.abnormalCloseCount >= 3) {
              console.warn('WebSocket disabled for session after repeated abnormal closes');
              this.permanentlyDisabled = true;
            }
          }
          
          // Cycle to next URL if handshake never completed
          if (!this.handshakeComplete) {
            this.currentUrlIndex = (this.currentUrlIndex + 1) % this.wsUrls.length;
          }
          // Only attempt reconnection if not manually disconnected or permanently disabled
          if (!this.isManualDisconnect && !this.permanentlyDisabled && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const expBackoff = Math.min(30000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
            const jitter = Math.floor(Math.random() * 500); // up to 0.5s jitter
            const delay = expBackoff + jitter;
            setTimeout(() => {
              console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect();
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('WebSocket: Max reconnection attempts reached, giving up');
            this.permanentlyDisabled = true;
          }

          // Resolve the initial connect() promise if it hasn't yet
          if (!settled) {
            settled = true;
            resolve();
          }
        };

        this.ws.onerror = (error: Event) => {
          // Throttle and soften error logging; avoid leaking sensitive URL/token
          const now = Date.now();
          if (now - this.lastErrorLoggedAt > 5000) {
            this.lastErrorLoggedAt = now;
            try {
              const target = (error as Event & { target?: WebSocket })?.target;
              const readyState = target?.readyState;
              console.warn('WebSocket transient error; will retry', { type: error.type, readyState });
            } catch {
              console.warn('WebSocket transient error; will retry');
            }
          }
          // Let onclose handle reconnection
        };
      } catch (error) {
        console.error('WebSocket setup error:', error);
        // Swallow to keep UI functioning without realtime
      }
    });
  }

  subscribeToThread(threadId: string): void {
    // Queue the subscription either way
    this.pendingSubscriptions.add(threadId);
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.handshakeComplete) {
      const message: WebSocketMessage = { type: 'subscribe_thread', thread_id: threadId };
      this.ws.send(JSON.stringify(message));
    }
  }

  async waitForSubscription(threadId: string, timeoutMs = 2000): Promise<boolean> {
    if (this.subscribedThreads.has(threadId)) return true;
    // Busy-wait in small intervals; resolve false on timeout
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (this.subscribedThreads.has(threadId)) return resolve(true);
        if (Date.now() - start >= timeoutMs) return resolve(false);
        setTimeout(check, 50);
      };
      check();
    });
  }

  sendMessage(threadId: string, content: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.handshakeComplete) {
      const message: WebSocketMessage = {
        type: 'send_message',
        thread_id: threadId,
        content,
        message_type: 'text'
      };
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not ready');
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  onConnectionStatus(callback: (connected: boolean) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  sendTypingIndicator(threadId: string, isTyping: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.handshakeComplete) {
      const message: WebSocketMessage = {
        type: 'typing_indicator',
        thread_id: threadId,
        is_typing: isTyping
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // If server supports app-level pings, uncomment or adjust type
        // const pingMessage: WebSocketMessage = { type: 'ping' };
        // this.ws.send(JSON.stringify(pingMessage));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  isDisabled(): boolean {
    return this.permanentlyDisabled;
  }

  isSubscribed(threadId: string): boolean {
    return this.subscribedThreads.has(threadId);
  }
}
