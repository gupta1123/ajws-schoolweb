export interface WebSocketMessage {
  type: 'subscribe_thread' | 'send_message' | 'message_received' | 'thread_updated';
  thread_id?: string;
  content?: string;
  message_type?: 'text';
  sender?: {
    full_name: string;
    role: string;
  };
  created_at?: string;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(token: string) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `wss://ajws-school-ba8ae5e3f955.herokuapp.com?token=${this.token}`;
        this.ws = new WebSocket(wsUrl);

        // Set a timeout for the connection attempt
        const connectionTimeout = setTimeout(() => {
          console.error('WebSocket connection timeout');
          if (this.ws) {
            this.ws.close();
          }
          reject(new Error('WebSocket connection timeout'));
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
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

          // Only reject if we haven't already resolved and this is the first connection attempt
          if (this.reconnectAttempts === 0) {
            reject(new Error(`WebSocket closed: ${event.code} ${event.reason}`));
          }

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't reject immediately - let the onclose event handle it
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribeToThread(threadId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe_thread',
        thread_id: threadId
      };
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
