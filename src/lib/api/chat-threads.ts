// src/lib/api/chat-threads.ts

import { apiClient } from './client';

export interface ChatAttachment {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface ChatMessageSummary {
  id: string;
  content: string;
  created_at: string;
  sender: {
    role: string;
    full_name: string;
  };
}

export interface ChatParticipant {
  role: string;
  user: {
    role: string;
    full_name: string;
  };
  user_id: string;
  last_read_at: string | null;
}

export interface ChatThread {
  id: string;
  thread_type: 'direct' | 'group';
  title: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  participants: ChatParticipant[];
  last_message: ChatMessageSummary | null;
}

export interface ChatThreadsResponse {
  status: string;
  data: {
    threads: ChatThread[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  status: string;
  moderated: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_reason: string | null;
  created_at: string;
  updated_at: string;
  sender: {
    role: string;
    full_name: string;
  };
  attachments: ChatAttachment[];
}

export interface ChatMessagesResponse {
  status: string;
  data: {
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export const chatThreadsServices = {
  getChatThreads: async (token: string, params?: { limit?: number; page?: number }): Promise<ChatThreadsResponse> => {
    const qp = new URLSearchParams();
    if (params?.limit) qp.append('limit', String(params.limit));
    if (params?.page) qp.append('page', String(params.page));
    const url = `/api/chat/threads${qp.toString() ? `?${qp.toString()}` : ''}`;
    const response = await apiClient.get<ChatThreadsResponse['data']>(url, token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response for chat threads');
    }

    if (response.status === 'error') {
      throw new Error((response as { message: string }).message || 'Failed to fetch chat threads');
    }

    return response as ChatThreadsResponse;
  },

  getChatMessages: async (threadId: string, token: string): Promise<ChatMessagesResponse> => {
    const response = await apiClient.get<ChatMessagesResponse['data']>(`/api/chat/messages?thread_id=${threadId}`, token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response for chat messages');
    }

    if (response.status === 'error') {
      throw new Error((response as { message: string }).message || 'Failed to fetch chat messages');
    }

    return response as ChatMessagesResponse;
  },

  // HTTP polling fallback - get messages after a specific message ID
  getMessagesAfter: async (threadId: string, afterId: string | null, token: string): Promise<ChatMessagesResponse> => {
    const params = new URLSearchParams({ thread_id: threadId });
    if (afterId) {
      params.append('after_id', afterId);
    }
    
    const response = await apiClient.get<ChatMessagesResponse['data']>(`/api/chat/messages?${params.toString()}`, token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response for chat messages');
    }

    if (response.status === 'error') {
      throw new Error((response as { message: string }).message || 'Failed to fetch new messages');
    }

    return response as ChatMessagesResponse;
  }
};
