// src/lib/api/messaging.ts

export interface ChatThread {
  id: string;
  title: string;
  thread_type: 'direct' | 'group';
  participants: Array<{
    user_id: string;
    user: {
      id: string;
      full_name: string;
    };
  }>;
  last_message?: Array<{
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender: {
    id: string;
    full_name: string;
  };
  created_at: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  message_type: 'text';
  attachments?: unknown[];
}

export interface Parent {
  id: string;
  name: string;
  students: Array<{
    student: {
      id: string;
      name: string;
      roll_number: string;
    };
  }>;
}

interface DivisionParentResponse {
  id: string;
  name: string;
  email: string | null;
  phone_number: string;
  relationship: string;
  is_primary_guardian: boolean;
}

interface DivisionStudentData {
  student: {
    id: string;
    name: string;
    roll_number: string;
  };
  parents: DivisionParentResponse[];
}

interface LinkedStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  class_division_id: string;
  teacher_assignments: Array<{
    assignment_type: string;
    subject: string;
    is_primary: boolean;
    class_name: string;
    academic_year: string;
  }>;
}

interface LinkedParentResponse {
  parent_id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  linked_students: LinkedStudent[];
  chat_info: {
    has_thread: boolean;
    thread_id: string;
    message_count: number;
    participants: Array<{
      role: string;
      user: {
        role: string;
        full_name: string;
      };
      user_id: string;
      last_read_at: string | null;
    }>;
    thread_title: string;
    thread_type: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ClassDivision {
  class_division_id: string;
  class_name: string;
  class_level: string;
  division: string;
  subject: string;
  assignment_type: string;
  is_primary: boolean;
}

const API_BASE_URL = 'https://ajws-school-ba8ae5e3f955.herokuapp.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const messagingAPI = {
  // Fetch all chat threads
  async fetchThreads(): Promise<ChatThread[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/threads`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.threads || [];
      }
      throw new Error(data.message || 'Failed to fetch threads');
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  },

  // Check if thread exists
  async checkExistingThread(participants: string[], threadType: 'direct' | 'group' = 'direct'): Promise<{ exists: boolean; thread?: ChatThread }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/check-existing-thread`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participants,
          thread_type: threadType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data;
      }
      throw new Error(data.message || 'Failed to check existing thread');
    } catch (error) {
      console.error('Error checking existing thread:', error);
      throw error;
    }
  },

  // Create new thread
  async createThread(
    participants: string[],
    threadType: 'direct' | 'group' = 'direct',
    title: string,
    messageContent: string
  ): Promise<ChatThread> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/start-conversation`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          participants,
          thread_type: threadType,
          title,
          message_content: messageContent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.thread;
      }
      throw new Error(data.message || 'Failed to create thread');
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  },

  // Fetch messages for a thread
  async fetchMessages(
    threadId: string,
    afterId?: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      let url = `${API_BASE_URL}/chat/messages?thread_id=${threadId}&limit=${limit}`;
      if (afterId) {
        url += `&after_id=${afterId}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.messages || [];
      }
      throw new Error(data.message || 'Failed to fetch messages');
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message via HTTP (fallback)
  async sendMessage(
    threadId: string,
    content: string,
    messageType: string = 'text'
  ): Promise<Message> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/send-message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          thread_id: threadId,
          content,
          message_type: messageType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.message;
      }
      throw new Error(data.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get teacher's assigned classes
  async getAssignedClasses(): Promise<ClassDivision[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/academic/my-teacher-id`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.data.assigned_classes || [];
      }
      throw new Error(data.message || 'Failed to fetch assigned classes');
    } catch (error) {
      console.error('Error fetching assigned classes:', error);
      throw error;
    }
  },

  // Get linked parents and principal
  async getLinkedParents(classDivisionId?: string): Promise<{ linked_parents: Parent[]; principal: { id: string; full_name: string } }> {
    try {
      const url = classDivisionId 
        ? `${API_BASE_URL}/users/teacher-linked-parents?class_division_id=${classDivisionId}`
        : `${API_BASE_URL}/users/teacher-linked-parents`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Transform the API response structure
        const linkedParents: Parent[] = data.data.linked_parents.map((parentData: LinkedParentResponse) => ({
          id: parentData.parent_id,
          name: parentData.full_name,
          students: parentData.linked_students.map((student: LinkedStudent) => ({
            student: {
              id: student.student_id,
              name: student.student_name,
              roll_number: student.roll_number
            }
          }))
        }));

        return {
          linked_parents: linkedParents,
          principal: data.data.principal
        };
      }
      throw new Error(data.message || 'Failed to fetch linked parents');
    } catch (error) {
      console.error('Error fetching linked parents:', error);
      throw error;
    }
  },

  // Get parents by division
  async getParentsByDivision(divisionId: string): Promise<Parent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/division/${divisionId}/parents`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Transform the API response structure
        const parents: Parent[] = [];
        const parentMap = new Map<string, Parent>();

        // Extract parents from students array
        data.data.students.forEach((studentData: DivisionStudentData) => {
          studentData.parents.forEach((parentData: DivisionParentResponse) => {
            if (!parentMap.has(parentData.id)) {
              const parent: Parent = {
                id: parentData.id,
                name: parentData.name,
                students: [{
                  student: {
                    id: studentData.student.id,
                    name: studentData.student.name,
                    roll_number: studentData.student.roll_number
                  }
                }]
              };
              parentMap.set(parentData.id, parent);
              parents.push(parent);
            } else {
              // Add student to existing parent
              const existingParent = parentMap.get(parentData.id)!;
              existingParent.students.push({
                student: {
                  id: studentData.student.id,
                  name: studentData.student.name,
                  roll_number: studentData.student.roll_number
                }
              });
            }
          });
        });

        return parents;
      }
      throw new Error(data.message || 'Failed to fetch parents by division');
    } catch (error) {
      console.error('Error fetching parents by division:', error);
      throw error;
    }
  }
};

// Utility functions
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

export const formatMessageTimeShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getThreadTitle = (thread: ChatThread, currentUserId: string): string => {
  if (thread.thread_type === 'group') {
    return thread.title;
  }
  
  // Safety check for participants array
  if (!thread.participants || !Array.isArray(thread.participants)) {
    return thread.title;
  }
  
  // For direct messages, show the other participant's name
  const otherParticipant = thread.participants.find(p => p.user_id !== currentUserId);
  return otherParticipant?.user.full_name || thread.title;
};

export const getLastMessagePreview = (thread: ChatThread): string => {
  if (!thread.last_message || thread.last_message.length === 0) {
    return 'No messages yet';
  }
  
  const lastMsg = thread.last_message[0];
  return lastMsg.content.length > 50 
    ? `${lastMsg.content.substring(0, 50)}...`
    : lastMsg.content;
};
