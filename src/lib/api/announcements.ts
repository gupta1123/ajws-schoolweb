// src/lib/api/announcements.ts

export interface Attachment {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface AnnouncementFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  announcement_type?: string;
  priority?: string;
  is_featured?: boolean;
  page?: number;
  limit?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'notification' | 'circular' | 'general';
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  target_roles: string[];
  target_classes: string[];
  target_departments: string[];
  publish_at: string;
  expires_at: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    role: string;
    full_name: string;
  };
  approver?: {
    id: string;
    role: string;
    full_name: string;
  };
  rejector?: {
    id: string;
    role: string;
    full_name: string;
  };
  attachments: Attachment[];
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  announcement_type: 'notification' | 'circular' | 'general';
  priority: 'low' | 'medium' | 'high';
  target_roles: string[];
  target_classes?: string[];
  target_departments?: string[];
  publish_at: string;
  expires_at: string;
  is_featured?: boolean;
}

export interface ApprovalActionData {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface AnnouncementsResponse {
  status: string;
  data: {
    announcements: Announcement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    filters?: AnnouncementFilters;
  };
}

const API_BASE_URL = 'https://ajws-school-ba8ae5e3f955.herokuapp.com/api';

class AnnouncementsAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Create a new announcement
  async createAnnouncement(data: CreateAnnouncementData): Promise<{ status: string; data: { announcement: Announcement; auto_approved: boolean } }> {
    return this.makeRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get all announcements with optional filters
  async getAnnouncements(filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    announcement_type?: string;
    priority?: string;
    is_featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/announcements${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(endpoint);
  }

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<{ status: string; data: { announcement: Announcement } }> {
    return this.makeRequest(`/announcements/${id}`);
  }

  // Approve or reject announcement
  async approveOrRejectAnnouncement(id: string, data: ApprovalActionData): Promise<{ status: string; message: string; data: { announcement: Announcement } }> {
    return this.makeRequest(`/announcements/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Edit announcement
  async editAnnouncement(id: string, data: Partial<CreateAnnouncementData>): Promise<{ status: string; message: string; data: { announcement: Announcement; status_changed: boolean; requires_reapproval: boolean } }> {
    return this.makeRequest(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete announcement
  async deleteAnnouncement(id: string): Promise<{ status: string; message: string }> {
    return this.makeRequest(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export factory function to create API instance
export function createAnnouncementsAPI(token: string) {
  return new AnnouncementsAPI(token);
}

// Export types
export type { AnnouncementsAPI };