// src/lib/api/principal-chats.ts

import { apiClient } from './client';

export interface ChatParticipant {
  user_id: string;
  role: string;
  last_read_at: string | null;
  user: {
    id: string;
    role: string;
    email: string | null;
    full_name: string;
    phone_number: string;
  };
  is_principal: boolean;
}

export interface ChatParticipants {
  all: ChatParticipant[];
  teachers: ChatParticipant[];
  parents: ChatParticipant[];
  students: ChatParticipant[];
  admins: ChatParticipant[];
  count: number;
}

export interface ChatBadges {
  includes_principal: boolean;
  is_group: boolean;
  is_direct: boolean;
  has_teachers: boolean;
  has_parents: boolean;
  has_students: boolean;
  has_admins: boolean;
}

export interface ChatThread {
  thread_id: string;
  title: string;
  thread_type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  created_by: string;
  message_count: number;
  is_principal_participant: boolean;
  participants: ChatParticipants;
  last_message: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      full_name: string;
      role: string;
    };
  } | null;
  class_info: {
    class_division_id: string;
    division: string;
    class_name: string;
    class_level: string;
    academic_year: string;
  } | null;
  badges: ChatBadges;
}

export interface ChatFilters {
  chat_type: string;
  includes_me: string;
  page: number;
  limit: number;
}

export interface ChatPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ParticipantStats {
  total_unique: number;
  teachers: number;
  parents: number;
  students: number;
  admins: number;
}

export interface ChatSummary {
  total_threads: number;
  direct_chats: number;
  group_chats: number;
  includes_principal: number;
  excludes_principal: number;
  total_messages: number;
  average_messages_per_thread: number;
  participant_stats: ParticipantStats;
}

export interface PrincipalChatsResponse {
  status: string;
  data: {
    threads: ChatThread[];
    filters: ChatFilters;
    pagination: ChatPagination;
    summary: ChatSummary;
  };
}

export interface PrincipalChatsParams {
  start_date?: string;
  end_date?: string;
  chat_type?: 'all' | 'direct' | 'group';
  includes_me?: 'all' | 'yes' | 'no';
  class_division_id?: string;
  page?: number;
  limit?: number;
}

export const principalChatsServices = {
  getPrincipalChats: async (
    params: PrincipalChatsParams = {}, 
    token: string
  ): Promise<PrincipalChatsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.chat_type && params.chat_type !== 'all') queryParams.append('chat_type', params.chat_type);
    if (params.includes_me && params.includes_me !== 'all') queryParams.append('includes_me', params.includes_me);
    if (params.class_division_id) queryParams.append('class_division_id', params.class_division_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/users/principal/chats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PrincipalChatsResponse['data']>(endpoint, token);

    // Handle Blob response (shouldn't happen for JSON endpoints)
    if (response instanceof Blob) {
      throw new Error('Unexpected blob response for principal chats');
    }

    if (response.status === 'error') {
      throw new Error((response as { message: string }).message || 'Failed to fetch principal chats');
    }

    return response as PrincipalChatsResponse;
  }
};
