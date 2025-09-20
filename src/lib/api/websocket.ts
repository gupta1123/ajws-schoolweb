export interface WebSocketMessage {
  type: 'subscribe_thread' | 'send_message' | 'message_received' | 'thread_updated' | 'message_status_update' | 'typing_indicator' | 'connection_status';
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
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private onConnectionStatusCallback: ((connected: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingSubscriptions: Set<string> = new Set();
  private lastErrorLoggedAt = 0;
  private isManualDisconnect = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(token: string) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const wsUrl = `wss://ajws-school-ba8ae5e3f955.herokuapp.com?token=${this.token}`;
        this.ws = new WebSocket(wsUrl);

        // Set a timeout for the connection attempt
        const connectionTimeout = setTimeout(() => {
          console.warn('WebSocket connection timeout');
          if (this.ws) {
            this.ws.close();
          }
          // Do not reject; allow reconnection logic to proceed
        }, 10000);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.isManualDisconnect = false;
          
          // Start heartbeat to keep connection alive
          this.startHeartbeat();
          
          // Notify connection status callback
          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(true);
          }
          
          // Flush any pending subscriptions
          this.pendingSubscriptions.forEach((threadId) => {
            const message: WebSocketMessage = { type: 'subscribe_thread', thread_id: threadId };
            this.ws?.send(JSON.stringify(message));
          });
          this.pendingSubscriptions.clear();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
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
          
          // Notify connection status callback
          if (this.onConnectionStatusCallback) {
            this.onConnectionStatusCallback(false);
          }
          
          // Only attempt reconnection if not manually disconnected
          if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type: 'subscribe_thread', thread_id: threadId };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendMessage(threadId: string, content: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'send_message',
        thread_id: threadId,
        content,
        message_type: 'text'
      };
      this.ws.send(JSON.stringify(message));
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
        // Send a ping message to keep connection alive
        const pingMessage: WebSocketMessage = {
          type: 'connection_status',
          connection_status: 'connected'
        };
        this.ws.send(JSON.stringify(pingMessage));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
