// src/components/messages/chat-interface.tsx

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Search, 
  User, 
  Users, 
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  Star,
  Pin,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import {
  getTeacherLinkedParents,
  TeacherLinkedParent,
  getChatThreads,
  startConversation,
  sendMessage,
  checkExistingThread,
  ChatThread,
  StartConversationPayload,
  SendMessagePayload,
  CheckExistingThreadPayload
} from '@/lib/api/messages';
import { useAuth } from '@/lib/auth/context';
import { ChatWebSocket, WebSocketMessage } from '@/lib/api/websocket';
import { useChatMessages } from '@/hooks/use-chat-threads';
import { ChatMessage as ApiChatMessage } from '@/lib/api/chat-threads';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  created_at?: string;
}

interface ChatContact {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  type: 'individual' | 'group' | 'announcement' | 'principal';
  avatar?: string;
  parentData?: TeacherLinkedParent | { parent_id: string; full_name: string; role: string } | null;
  threadData?: ChatThread;
  isGroup?: boolean;
  groupMembers?: string[];
  principalData?: { id: string; full_name: string; role: string };
  teacherData?: { teacher_id: string; full_name: string; role: string } | null;
  isPinned?: boolean;
}

interface TeacherLinkedParentsResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    linked_parents: TeacherLinkedParent[];
    principal?: { id: string; full_name: string; role: string };
  };
}

interface StudentData {
  student_name: string;
  student_id: string;
  teacher_assignments?: Array<{ class_name: string }>;
}

interface ConversationResponse {
  status: 'success' | 'error';
  data?: {
    thread: {
      id: string;
    };
    message?: {
      id: string;
      sender: { full_name: string; id: string };
      content: string;
      created_at: string;
    };
  };
}

// Function to format date as "11 Aug' 25"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month}' ${year}`;
};

// Function to format time as "8:00 PM"
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Function to get date label (Today, Yesterday, or formatted date)
const getDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare only dates
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    return formatDate(dateString);
  }
};

// Function to check if two dates are on the same day
const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Function to transform API data to chat contacts
const transformParentDataToContacts = (parents: TeacherLinkedParent[]): ChatContact[] => {
  return parents.map(parent => {
    const studentNames = parent.linked_students.map(student => student.student_name).join(', ');

    return {
      id: parent.parent_id,
      name: `${parent.full_name} (Parent of ${studentNames})`,
      lastMessage: parent.chat_info.has_thread ? 'Previous conversation available' : 'No messages yet',
      lastMessageTime: parent.chat_info.updated_at ? formatDate(parent.chat_info.updated_at) : 'New',
      unreadCount: parent.chat_info.message_count || 0,
      isOnline: false, // We'll keep this as false for now since API doesn't provide online status
      type: 'individual' as const,
      parentData: parent
    };
  });
};

// Function to transform principal data to chat contact
const transformPrincipalToContact = (principal: { id: string; full_name: string; role: string }): ChatContact => {
  return {
    id: `principal-${principal.id}`,
    name: `${principal.full_name} (Principal)`,
    lastMessage: 'Available for administrative discussions',
    lastMessageTime: 'Always',
    unreadCount: 0,
    isOnline: false,
    type: 'principal' as const,
    principalData: principal,
    isPinned: true
  };
};

// Function to sort contacts with pinned ones at the top
const sortContactsWithPinned = (contacts: ChatContact[]): ChatContact[] => {
  return contacts.sort((a, b) => {
    // Pinned contacts come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // If both are pinned or both are not pinned, maintain original order
    return 0;
  });
};

// Function to transform chat threads to contacts
const transformThreadsToContacts = (threads: ChatThread[], user: { id: string } | null): ChatContact[] => {
  return threads.map(thread => {
    const isGroup = thread.thread_type === 'group';
    const lastMessage = thread.last_message && thread.last_message.length > 0 
      ? thread.last_message[thread.last_message.length - 1] 
      : null;
    
    // Get group members (excluding the current user)
    const groupMembers = thread.participants
      .filter(p => p.user_id !== user?.id)
      .map(p => p.user.full_name);
    
    // Check if current user is a participant
    const isParticipant = thread.participants.some(p => p.user_id === user?.id);
    
    // Find teacher data if this is a teacher chat
    const teacherParticipant = thread.participants.find(p => p.user.role === 'teacher');
    const teacherData = teacherParticipant ? {
      teacher_id: teacherParticipant.user_id,
      full_name: teacherParticipant.user.full_name,
      role: teacherParticipant.user.role
    } : null;
    
    // Find parent data if this is a parent chat
    const parentParticipant = thread.participants.find(p => p.user.role === 'parent');
    const parentData = parentParticipant ? {
      parent_id: parentParticipant.user_id,
      full_name: parentParticipant.user.full_name,
      role: parentParticipant.user.role
    } : null;
    
    return {
      id: thread.id,
      name: thread.title,
      lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
      lastMessageTime: lastMessage ? formatDate(lastMessage.created_at) : formatDate(thread.created_at),
      unreadCount: 0, // TODO: Implement unread count logic
      isOnline: false,
      type: isGroup ? 'group' : 'individual',
      isGroup: isGroup,
      groupMembers: groupMembers,
      isPinned: isParticipant, // Pin chats where user is a participant
      teacherData: teacherData, // Add teacher data for admin/principal
      parentData: parentData, // Add parent data for admin/principal
      threadData: thread
    };
  });
};



// Function to transform API messages to chat interface format
const transformApiMessagesToChatMessages = (apiMessages: ApiChatMessage[], user: { id: string } | null): ChatMessage[] => {
  return apiMessages.map((msg) => ({
    id: msg.id,
    senderId: msg.sender_id,
    senderName: msg.sender.full_name,
    content: msg.content,
    timestamp: msg.created_at,
    status: msg.status as 'sent' | 'delivered' | 'read',
    isOwn: msg.sender_id === user?.id,
    created_at: msg.created_at
  }));
};



interface ChatInterfaceProps {
  selectedParentId?: string;
  isAdminOrPrincipal?: boolean;
  chatsData?: { threads?: ChatThread[] };
  activeTab?: 'direct' | 'group';
}

export function ChatInterface({ selectedParentId, isAdminOrPrincipal, chatsData, activeTab: externalActiveTab }: ChatInterfaceProps) {
  const { token, user } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [websocket, setWebsocket] = useState<ChatWebSocket | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectingParent, setSelectingParent] = useState(false);

  // Hooks for real API data
  const { messages: apiMessages } = useChatMessages(currentThreadId);

  // Handle tab change
  const handleTabChange = (tab: 'direct' | 'group') => {
    setActiveTab(tab);
    
    // Clear search when switching tabs
    setSearchTerm('');
    
    // If switching to group tab, refresh threads to ensure we have latest group data
    if (tab === 'group' && token && !isAdminOrPrincipal) {
      fetchThreads(true); // true indicates this is a group refresh
    }
    
    // Select appropriate contact for the new tab
    if (contacts.length > 0) {
      if (tab === 'group') {
        const firstGroup = contacts.find(c => c.isGroup);
        if (firstGroup) {
          setActiveChat(firstGroup);
          // Ensure WebSocket subscription for the group
          if (firstGroup.threadData && websocket) {
            websocket.subscribeToThread(firstGroup.threadData.id);
          }
        }
      } else {
        const firstDirect = contacts.find(c => !c.isGroup);
        if (firstDirect) {
          setActiveChat(firstDirect);
          // Ensure WebSocket subscription for the direct chat
          if (firstDirect.threadData && websocket) {
            websocket.subscribeToThread(firstDirect.threadData.id);
          }
        }
      }
    }
  };

  // Use external activeTab for admin/principal users
  useEffect(() => {
    if (isAdminOrPrincipal && externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [isAdminOrPrincipal, externalActiveTab]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (token) {
      const ws = new ChatWebSocket(token);
      ws.connect().then(() => {
        setWebsocket(ws);
        console.log('WebSocket connected successfully');
        // Clear any previous connection errors when WebSocket connects successfully
        setError(null);
      }).catch((error) => {
        console.error('Failed to connect WebSocket:', error);
        // Don't set error - allow chat to work without WebSocket
        console.warn('Chat will work without real-time updates due to WebSocket connection failure');
        setWebsocket(null);
      });

      // Set up connection status monitoring
      const checkConnection = () => {
        if (ws.isConnected()) {
          setError(null);
        }
      };

      // Check connection status every 2 seconds
      const interval = setInterval(checkConnection, 2000);

      return () => {
        clearInterval(interval);
        ws.disconnect();
      };
    }
  }, [token]);

  // Handle principal chats data for admin/principal users
  useEffect(() => {
    if (isAdminOrPrincipal && chatsData) {
      console.log('=== ADMIN/PRINCIPAL CHATS DATA ===');
      console.log('Chats data:', chatsData);
      console.log('Threads:', chatsData.threads);
      
      // For admin/principal users, we'll use the same thread-based approach as teachers
      // The chatsData contains threads that we can transform directly
      const transformedContacts = transformThreadsToContacts(chatsData.threads || [], user);
      console.log('Transformed contacts:', transformedContacts);
      
      const sortedContacts = sortContactsWithPinned(transformedContacts);
      setContacts(sortedContacts);
      setLoading(false);
      
      // Set first contact as active if none is selected
      if (transformedContacts.length > 0 && !activeChat) {
        const firstContact = transformedContacts[0];
        console.log('Setting first contact as active:', firstContact);
        setActiveChat(firstContact);
        // Set the thread ID for the first contact to load messages
        if (firstContact.threadData) {
          console.log('Setting thread ID for first contact:', firstContact.threadData.id);
          setCurrentThreadId(firstContact.threadData.id);
        }
      }
    }
  }, [isAdminOrPrincipal, chatsData, user, activeChat]);

  // Handle API messages when thread changes
  useEffect(() => {
    console.log('=== API MESSAGES UPDATED ===');
    console.log('API Messages count:', apiMessages.length);
    console.log('Current Thread ID:', currentThreadId);
    console.log('Is Admin/Principal:', isAdminOrPrincipal);
    
    if (apiMessages.length > 0) {
      const transformedMessages = transformApiMessagesToChatMessages(apiMessages, user);
      console.log('Transformed messages:', transformedMessages);
      setMessages(transformedMessages);
    } else {
      console.log('No API messages, clearing messages array');
      setMessages([]);
    }
  }, [apiMessages, user, currentThreadId, isAdminOrPrincipal]);

  // Fetch teacher-linked parents data (only for teachers)
  const fetchParents = useCallback(async () => {
    if (!token) {
      console.log('No authentication token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getTeacherLinkedParents(token, user?.id);
      console.log('API Response:', response); // Debug log

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

            // Check if response has error status
      if (response.status === 'error') {
        const errorMessage = (response as TeacherLinkedParentsResponse).message || 'Failed to fetch parents';
        console.error('API Error:', errorMessage);
        setError('Unexpected response format');
        return;
      }

      // Check if response has success status
      if (response.status === 'success' && 'data' in response && response.data && 'linked_parents' in response.data) {
        const responseData = response.data as TeacherLinkedParentsResponse['data'];
        if (!responseData) return; // Safety check
        const linkedParents = responseData.linked_parents as TeacherLinkedParent[];
        const transformedContacts = transformParentDataToContacts(linkedParents);

        // Add principal to contacts if available
        let allContacts = [...transformedContacts];
        if (responseData.principal) {
          const principalContact = transformPrincipalToContact(responseData.principal);
          allContacts = [principalContact, ...allContacts]; // Principal appears first
        }

        // Sort contacts with pinned ones at the top
        const sortedContacts = sortContactsWithPinned(allContacts);
        setContacts(sortedContacts);
        // Don't auto-select a contact here - let the thread loading handle it
      } else {
        console.error('Unexpected response format:', response);
      }
    } catch (error) {
      console.error('Error fetching teacher-linked parents:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (isAdminOrPrincipal) return; // Skip for admin/principal users
    fetchParents();
  }, [isAdminOrPrincipal, fetchParents]);

  // Fetch chat threads function
  const fetchThreads = useCallback(async (isGroupRefresh = false) => {
    if (!token) return;

    try {
      if (isGroupRefresh) {
        setLoadingGroups(true);
      }
      
      const response = await getChatThreads(token);
      
      if (response instanceof Blob) {
        console.error('Unexpected Blob response from threads');
        return;
      }
      
      if (response.status === 'success' && 'data' in response && response.data && 'threads' in response.data) {
        const threads = response.data.threads as ChatThread[];
        setChatThreads(threads);
        
        // Transform threads to contacts and add them to the contacts list
        if (user) {
          const threadContacts = transformThreadsToContacts(threads, user);
          setContacts(prevContacts => {
            // Combine parent contacts with thread contacts, avoiding duplicates
            const existingIds = new Set(prevContacts.map(c => c.id));
            const newThreadContacts = threadContacts.filter(c => !existingIds.has(c.id));
            const allContacts = [...prevContacts, ...newThreadContacts];
            
            // Sort contacts with pinned ones at the top
            const sortedContacts = sortContactsWithPinned(allContacts);
            
            // Auto-select the first contact if none is currently selected AND no specific parent is selected
            if (sortedContacts.length > 0 && !activeChat && !selectedParentId) {
              // Select based on current active tab
              if (activeTab === 'group') {
                const firstGroup = sortedContacts.find(c => c.isGroup);
                if (firstGroup) setActiveChat(firstGroup);
              } else {
                const firstDirect = sortedContacts.find(c => !c.isGroup);
                if (firstDirect) setActiveChat(firstDirect);
              }
            }
            
            return sortedContacts;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching chat threads:', error);
    } finally {
      if (isGroupRefresh) {
        setLoadingGroups(false);
      }
    }
  }, [token, user, activeTab, activeChat, selectedParentId]);

  // Fetch chat threads on component mount
  useEffect(() => {
    fetchThreads();
  }, [token, user, fetchThreads]);

  // Clean up selecting state when selectedParentId changes or component unmounts
  useEffect(() => {
    return () => {
      setSelectingParent(false);
    };
  }, [selectedParentId]);

  // Auto-select parent chat when selectedParentId is provided
  useEffect(() => {
    if (selectedParentId) {
      console.log('=== PARENT SELECTION START ===');
      console.log('Selected Parent ID:', selectedParentId);
      console.log('Available contacts:', contacts.length);
      console.log('Contact details:', contacts.map((c: ChatContact) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentData?.parent_id,
        isGroup: c.isGroup
      })));
      
      // Debug: Log all parent IDs to see what's available
      const allParentIds = contacts
        .filter((c: ChatContact) => c.parentData)
        .map((c: ChatContact) => c.parentData?.parent_id);
      console.log('All available parent IDs:', allParentIds);
      console.log('Looking for parent ID:', selectedParentId);
      console.log('Parent ID found in list:', allParentIds.includes(selectedParentId));
      
      setSelectingParent(true);
      
      // Clear any existing active chat to prevent showing default chat
      setActiveChat(null);
      setMessages([]);
      setCurrentThreadId(null);
      
      if (contacts.length === 0) {
        // If contacts are not loaded yet, wait a bit and try again
        console.log('Contacts not loaded yet, will retry...');
        return;
      }
      
      // Add a small delay to ensure contacts are properly processed
      setTimeout(() => {
        const selectedContact = contacts.find(contact => 
          contact.parentData?.parent_id === selectedParentId
        );
        
        if (selectedContact) {
          console.log('✅ Found selected contact:', selectedContact.name);
          console.log('Contact data:', selectedContact);
          setActiveChat(selectedContact);
          setActiveTab('direct');
          setSearchTerm('');
          setSelectingParent(false);
          console.log('=== PARENT SELECTION SUCCESS ===');
          
          // Ensure the contact is visible by scrolling to it if needed
          setTimeout(() => {
            const contactElement = document.querySelector(`[data-contact-id="${selectedContact.id}"]`);
            if (contactElement) {
              contactElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        } else {
          console.log('❌ Selected parent not found in contacts:', selectedParentId);
          console.log('Available parent IDs:', contacts.filter(c => c.parentData).map(c => c.parentData?.parent_id));
          // If the parent is not found, it might be because contacts are still loading
          // We'll let the contacts loading effect handle this
        }
      }, 100); // Small delay to ensure contacts are ready
    }
  }, [selectedParentId, contacts]);

  // Retry parent selection when contacts finish loading
  useEffect(() => {
    if (selectedParentId && contacts.length > 0 && !loading && selectingParent) {
      console.log('=== RETRYING PARENT SELECTION ===');
      console.log('Selected Parent ID:', selectedParentId);
      console.log('Contacts loaded:', contacts.length);
      console.log('Loading state:', loading);
      console.log('Selecting parent state:', selectingParent);
      console.log('Active chat:', activeChat);
      
      // Check if we need to retry the selection
      const selectedContact = contacts.find(contact => 
        contact.parentData?.parent_id === selectedParentId
      );
      
      if (selectedContact && !activeChat) {
        console.log('✅ Retry successful - Found selected contact:', selectedContact.name);
        setActiveChat(selectedContact);
        setActiveTab('direct');
        setSearchTerm('');
        setSelectingParent(false);
        console.log('=== RETRY PARENT SELECTION SUCCESS ===');
      } else {
        console.log('❌ Retry failed - Contact not found or already active');
        console.log('Selected contact found:', !!selectedContact);
        console.log('Active chat exists:', !!activeChat);
      }
    }
  }, [selectedParentId, contacts, loading, activeChat, selectingParent]);

  // Prevent auto-selection of first contact when we have a selectedParentId
  useEffect(() => {
    if (selectedParentId && !selectingParent) {
      // Don't auto-select any contact if we're waiting for a specific parent
      return;
    }
    
    // Only auto-select first contact if no specific parent is selected
    if (contacts.length > 0 && !activeChat && !selectedParentId) {
      const firstDirect = contacts.find(c => !c.isGroup);
      if (firstDirect) {
        console.log('Auto-selecting first direct contact:', firstDirect.name);
        setActiveChat(firstDirect);
        setActiveTab('direct');
      }
    }
  }, [contacts, activeChat, selectedParentId, selectingParent]);

  // Get counts for each tab
  const directContactsCount = contacts.filter(c => !c.isGroup).length;
  const groupContactsCount = contacts.filter(c => c.isGroup).length;

  // Filter contacts based on search and active tab
  const filteredContacts = contacts.filter(contact => {
    // First filter by tab type
    if (activeTab === 'direct' && contact.isGroup) return false;
    if (activeTab === 'group' && !contact.isGroup) return false;
    
    const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (contact.parentData) {
      // Search in parent name and student names
      const parentMatch = contact.parentData.full_name.toLowerCase().includes(searchTerm.toLowerCase());
          const studentMatch = contact.parentData && 'linked_students' in contact.parentData ?
      contact.parentData.linked_students.some((student: StudentData) =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      ) : false;
      return nameMatch || parentMatch || studentMatch;
    } else if (contact.isGroup && contact.groupMembers) {
      // Search in group name and member names
      const memberMatch = contact.groupMembers.some(member => 
        member.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return nameMatch || memberMatch;
    } else if (contact.principalData) {
      // Search in principal name
      const principalMatch = contact.principalData.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || principalMatch;
    }
    
    return nameMatch;
  });

  // Set up WebSocket message handling
  useEffect(() => {
    if (websocket) {
      websocket.onMessage((message: WebSocketMessage) => {
        if (message.type === 'message_received' && message.thread_id === currentThreadId) {
          // Add new message to the current chat
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'other',
            senderName: message.sender?.full_name || 'Unknown',
            content: message.content || '',
            timestamp: message.created_at || new Date().toISOString(),
            status: 'delivered',
            isOwn: false,
            created_at: message.created_at
          };
          setMessages(prev => [...prev, newMessage]);
          
          // Update the contact's last message for real-time updates
          setContacts(prevContacts => 
            prevContacts.map(contact => {
              if (contact.threadData?.id === message.thread_id) {
                return {
                  ...contact,
                  lastMessage: message.content || '',
                  lastMessageTime: message.created_at ? getDateLabel(message.created_at) : getDateLabel(new Date().toISOString())
                };
              }
              return contact;
            })
          );
        }
      });

      // Clear connection errors when WebSocket is available
      if (websocket.isConnected()) {
        setError(null);
      }
    }
  }, [websocket, currentThreadId]);

  // Update messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      console.log('=== CHAT OPENED ===');
      console.log('Active chat:', activeChat);
      console.log('Chat type:', activeChat.type);
      console.log('Is principal:', !!activeChat.principalData);
      console.log('Principal data:', activeChat.principalData);
      
      // Clear the selecting parent state when a chat is actually opened
      if (selectingParent) {
        setSelectingParent(false);
      }
      
      let existingThread: ChatThread | undefined;
      
      if (isAdminOrPrincipal && activeChat.threadData) {
        // For admin/principal users, use the thread data directly from the contact
        existingThread = activeChat.threadData;
        console.log('Found existing thread for admin/principal:', existingThread);
      } else if (activeChat.isGroup && activeChat.threadData) {
        // This is a group chat, use the thread data directly
        existingThread = activeChat.threadData;
        console.log('Found existing group thread:', existingThread);
      } else if (activeChat.parentData) {
        // This is an individual parent chat, find the thread
        existingThread = chatThreads.find(thread => 
          thread.participants.some(p => p.user_id === activeChat.parentData?.parent_id)
        );
        console.log('Found existing parent thread:', existingThread);
      } else if (activeChat.principalData) {
        // This is a principal chat, find the thread
        existingThread = chatThreads.find(thread => 
          thread.participants.some(p => p.user_id === activeChat.principalData?.id)
        );
        console.log('Found existing principal thread:', existingThread);
        console.log('Available threads:', chatThreads);
        console.log('Looking for principal ID:', activeChat.principalData?.id);
      }
      
      if (existingThread) {
        console.log('Loading messages from existing thread:', existingThread);
        setCurrentThreadId(existingThread.id);
        
        // For admin/principal users, we'll let the useChatMessages hook handle message loading
        // For teachers, we'll load messages from the thread data
        if (!isAdminOrPrincipal && existingThread.last_message && existingThread.last_message.length > 0) {
          const threadMessages: ChatMessage[] = existingThread.last_message.map((msg: { sender: { full_name: string }; content: string; created_at: string }, index: number) => ({
            id: `${existingThread.id}-${index}-${Date.now()}`,
            senderId: msg.sender.full_name === user?.full_name ? 'me' : 'other',
            senderName: msg.sender.full_name,
            content: msg.content,
            timestamp: msg.created_at,
            status: 'read',
            isOwn: msg.sender.full_name === user?.full_name,
            created_at: msg.created_at
          }));
          console.log('Setting thread messages:', threadMessages);
          setMessages(threadMessages);
        } else if (isAdminOrPrincipal) {
          // For admin/principal users, clear messages and let the hook load them
          console.log('Clearing messages for admin/principal to let hook load them');
          setMessages([]);
        } else {
          console.log('No existing messages in thread, setting empty array');
          setMessages([]);
        }
        
        // Subscribe to the thread
        if (websocket) {
          websocket.subscribeToThread(existingThread.id);
          console.log(`Subscribed to ${existingThread.thread_type} thread:`, existingThread.id);
        }
      } else {
        console.log('No existing thread found, clearing messages and thread ID');
        setCurrentThreadId(null);
        setMessages([]);
      }
    }
  }, [activeChat, chatThreads, websocket, user, selectingParent, isAdminOrPrincipal]);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !token) return;

    try {
      let threadId = currentThreadId;


      if (!threadId) {
        if (activeChat.parentData) {
          console.log('Checking for existing conversation with parent:', activeChat.parentData);

          // First check if a thread already exists
          const checkPayload: CheckExistingThreadPayload = {
            participants: [activeChat.parentData.parent_id],
            thread_type: 'direct'
          };

          console.log('Checking existing thread payload:', checkPayload);
          const checkResponse = await checkExistingThread(checkPayload, token);
          console.log('Check existing thread response:', checkResponse);

          let existingThreadId: string | null = null;

          if (checkResponse instanceof Blob) {
            console.error('Unexpected Blob response from check existing thread');
          } else if (checkResponse.status === 'success' && 'data' in checkResponse && checkResponse.data) {
            const checkData = checkResponse.data as unknown as { exists: boolean; thread?: { id: string } };
            if (checkData.exists && checkData.thread) {
              console.log('Found existing thread:', checkData.thread);
              existingThreadId = checkData.thread.id;
              threadId = existingThreadId;
              setCurrentThreadId(threadId);

              // Subscribe to the existing thread
              if (websocket && threadId) {
                websocket.subscribeToThread(threadId);
                console.log('Subscribed to existing thread:', threadId);
              }
            }
          }

          // If no existing thread found, create a new one
          if (!existingThreadId) {
            console.log('No existing thread found, creating new conversation with parent:', activeChat.parentData);
            const payload: StartConversationPayload = {
              participants: [activeChat.parentData.parent_id],
              message_content: newMessage,
              thread_type: 'direct',
              title: `Chat with ${activeChat.parentData.full_name}`
            };

            console.log('Sending conversation payload:', payload);
            const response = await startConversation(payload, token);
            console.log('Conversation response:', response);

            if (response instanceof Blob) {
              console.error('Unexpected Blob response');
              return;
            }

            if (response.status === 'success' && 'data' in response && response.data && 'thread' in response.data) {
              const threadData = response.data as ConversationResponse['data'];
              if (!threadData?.thread) return;
              threadId = threadData.thread.id;
              setCurrentThreadId(threadId);
              console.log('Created thread with ID:', threadId);

              // Add the initial message to the messages array
              if (threadData.message) {
                const initialMessage: ChatMessage = {
                  id: `${threadData.message.id}-${Date.now()}`,
                  senderId: threadData.message.sender.full_name === user?.full_name ? 'me' : 'other',
                  senderName: threadData.message.sender.full_name,
                  content: threadData.message.content,
                  timestamp: threadData.message.created_at,
                  status: 'read',
                  isOwn: threadData.message.sender.full_name === user?.full_name,
                  created_at: threadData.message.created_at
                };
                console.log('Setting initial message:', initialMessage);
                setMessages([initialMessage]);
              } else {
                console.log('No message data in response');
              }

              if (websocket && threadId) {
                websocket.subscribeToThread(threadId);
                console.log('Subscribed to new thread:', threadId);
              }
            } else {
              console.error('Failed to create conversation:', response);
              return;
            }
          }
        } else if (activeChat.principalData) {
          console.log('Checking for existing conversation with principal:', activeChat.principalData);

          // First check if a thread already exists
          const checkPayload: CheckExistingThreadPayload = {
            participants: [activeChat.principalData.id],
            thread_type: 'direct'
          };

          console.log('Checking existing thread payload:', checkPayload);
          const checkResponse = await checkExistingThread(checkPayload, token);
          console.log('Check existing thread response:', checkResponse);

          let existingThreadId: string | null = null;

          if (checkResponse instanceof Blob) {
            console.error('Unexpected Blob response from check existing thread');
          } else if (checkResponse.status === 'success' && 'data' in checkResponse && checkResponse.data) {
            const checkData = checkResponse.data as unknown as { exists: boolean; thread?: { id: string } };
            if (checkData.exists && checkData.thread) {
              console.log('Found existing thread:', checkData.thread);
              existingThreadId = checkData.thread.id;
              threadId = existingThreadId;
              setCurrentThreadId(threadId);

              // Subscribe to the existing thread
              if (websocket && threadId) {
                websocket.subscribeToThread(threadId);
                console.log('Subscribed to existing thread:', threadId);
              }
            }
          }

          // If no existing thread found, create a new one
          if (!existingThreadId) {
            console.log('No existing thread found, creating new conversation with principal:', activeChat.principalData);
            const payload: StartConversationPayload = {
              participants: [activeChat.principalData.id],
              message_content: newMessage,
              thread_type: 'direct',
              title: `Chat with ${activeChat.principalData.full_name} (Principal)`
            };

            console.log('Sending conversation payload:', payload);
            const response = await startConversation(payload, token);
            console.log('Conversation response:', response);

            if (response instanceof Blob) {
              console.error('Unexpected Blob response');
              return;
            }

            if (response.status === 'success' && 'data' in response && response.data && 'thread' in response.data) {
              const threadData = response.data as ConversationResponse['data'];
              if (!threadData?.thread) return;
              threadId = threadData.thread.id;
              setCurrentThreadId(threadId);
              console.log('Created thread with ID:', threadId);

              // Add the initial message to the messages array
              if (threadData.message) {
                const initialMessage: ChatMessage = {
                  id: `${threadData.message.id}-${Date.now()}`,
                  senderId: threadData.message.sender.full_name === user?.full_name ? 'me' : 'other',
                  senderName: threadData.message.sender.full_name,
                  content: threadData.message.content,
                  timestamp: threadData.message.created_at,
                  status: 'read',
                  isOwn: threadData.message.sender.full_name === user?.full_name,
                  created_at: threadData.message.created_at
                };
                console.log('Setting initial message:', initialMessage);
                setMessages([initialMessage]);
              } else {
                console.log('No message data in response');
              }

              if (websocket && threadId) {
                websocket.subscribeToThread(threadId);
                console.log('Subscribed to new thread:', threadId);
              }
            } else {
              console.error('Failed to create conversation:', response);
              return;
            }
          }
        } else {
          console.error('Cannot create conversation: no parent data, principal data, or thread data');
          return;
        }
      }

 
      if (threadId) {
        // Send message via API
        try {
          const payload: SendMessagePayload = {
            thread_id: threadId,
            content: newMessage
          };
          
          const response = await sendMessage(payload, token);
          
          if (response instanceof Blob) {
            console.error('Unexpected Blob response');
            return;
          }
          
          if (response.status === 'success' && 'data' in response && response.data) {
            const messageData = response.data as unknown as { id: string; sender_id: string; sender: { full_name: string }; content: string; created_at: string; status: string };
            
            // Add the sent message to the messages array
            const message: ChatMessage = {
              id: messageData.id,
              senderId: messageData.sender_id,
              senderName: messageData.sender.full_name,
              content: messageData.content,
              timestamp: messageData.created_at,
              status: messageData.status as 'sent' | 'delivered' | 'read',
              isOwn: messageData.sender_id === user?.id,
              created_at: messageData.created_at
            };
            
            setMessages(prev => [...prev, message]);
            setNewMessage('');
            
            // Also send via WebSocket if available
            if (websocket) {
              websocket.sendMessage(threadId, newMessage);
            }
          } else {
            console.error('Failed to send message:', response);
            setError('Failed to send message');
          }
        } catch (error) {
          console.error('Error sending message:', error);
          setError('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-4 w-4" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: ChatContact['type']) => {
    switch (type) {
      case 'individual':
        return <User className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'announcement':
        return <Bell className="h-4 w-4" />;
      case 'principal':
        return <Star className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card">
      {/* Contacts List */}
      <div className="w-1/3 border-r flex flex-col bg-card">
        {/* Tab Navigation - Only show for teachers */}
        {!isAdminOrPrincipal && (
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'direct'
                  ? 'bg-muted border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleTabChange('direct')}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                Direct
                {directContactsCount > 0 && (
                  <span className="ml-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {directContactsCount}
                  </span>
                )}
              </div>
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'group'
                  ? 'bg-muted border-b-2 border-primary text-primary'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              onClick={() => handleTabChange('group')}
              disabled={loadingGroups}
            >
              <div className="flex items-center justify-center gap-2">
                {loadingGroups ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Group
                {groupContactsCount > 0 && (
                  <span className="ml-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {groupContactsCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        )}
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${isAdminOrPrincipal ? 'chats' : activeTab === 'direct' ? 'parents and principals' : 'groups'}...`}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {loading || (activeTab === 'group' && loadingGroups) ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading ? 'Loading chats...' : 'Refreshing groups...'}
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-4 text-center">
              {isAdminOrPrincipal ? (
                <>
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No Chats Found
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'direct' ? 'No direct chats found for the selected filters.' : 'No group chats found for the selected filters.'}
                  </p>
                </>
              ) : activeTab === 'direct' ? (
                <>
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No Direct Chats Found
                  </h3>
                  <p className="text-muted-foreground">
                    You don&apos;t have any individual parent or principal chats yet.
                  </p>
                  {groupContactsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Switch to Group tab to see {groupContactsCount} group chat{groupContactsCount > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No Group Chats Found
                  </h3>
                  <p className="text-muted-foreground">
                    You don&apos;t have any group chats yet. Create one to get started!
                  </p>
                  {directContactsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Switch to Direct tab to see {directContactsCount} parent chat{directContactsCount > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact, index) => {
                const showPinnedSeparator = index === 0 && contact.isPinned;
                const showUnpinnedSeparator = index > 0 && 
                  filteredContacts[index - 1].isPinned && 
                  !contact.isPinned;
                
                return (
                  <div key={contact.id}>
                    {/* Pinned separator */}
                    {showPinnedSeparator && (
                      <div className="px-4 py-2 bg-primary/5 dark:bg-primary/10 border-b border-primary/20 dark:border-primary/30 animate-in slide-in-from-top-1 duration-300">
                        <div className="flex items-center gap-2">
                          <Pin className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Pinned
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Unpinned separator */}
                    {showUnpinnedSeparator && (
                      <div className="px-4 py-2 bg-muted/20 border-b border-muted/40 animate-in slide-in-from-top-1 duration-300">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Other Chats
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      data-contact-id={contact.id}
                      className={`p-4 cursor-pointer hover:bg-muted transition-all duration-200 ${
                        activeChat?.id === contact.id 
                          ? 'bg-muted border-l-4 border-primary' 
                          : contact.isPinned 
                            ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20 shadow-sm ring-1 ring-primary/10' 
                            : ''
                      } ${selectingParent && contact.parentData?.parent_id === selectedParentId ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
                      onClick={() => {
                        console.log('=== CONTACT CLICKED ===');
                        console.log('Contact:', contact);
                        console.log('Contact thread data:', contact.threadData);
                        console.log('Is Admin/Principal:', isAdminOrPrincipal);
                        
                        setActiveChat(contact);
                        // Set current thread ID for API message fetching
                        if (contact.threadData) {
                          console.log('Setting thread ID:', contact.threadData.id);
                          setCurrentThreadId(contact.threadData.id);
                          // Subscribe to WebSocket if available
                          if (websocket) {
                            websocket.subscribeToThread(contact.threadData.id);
                          }
                        } else {
                          console.log('No thread data, clearing thread ID');
                          setCurrentThreadId(null);
                        }
                        
                        // Clear any existing messages when switching chats
                        setMessages([]);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            {getTypeIcon(contact.type)}
                          </div>
                          {contact.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background"></div>
                          )}
                          {contact.isPinned && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse hover:bg-primary/90 hover:scale-110 transition-all duration-200 cursor-default shadow-lg shadow-primary/25" title="Pinned Chat">
                              <Pin className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">
                                {contact.parentData ? contact.parentData.full_name : 
                                 contact.principalData ? contact.principalData.full_name : 
                                 contact.name}
                              </h3>
                              {isAdminOrPrincipal && contact.isPinned && (
                                <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  You&apos;
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {contact.lastMessageTime}
                            </span>
                          </div>
                          {contact.parentData && 'linked_students' in contact.parentData ? (
                            contact.parentData.linked_students.length > 0 ? (
                              contact.parentData.linked_students.map((student: { student_name: string; teacher_assignments: Array<{ class_name: string }> }, studentIndex: number) => (
                                <div key={studentIndex}>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {student.student_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Grade {student.teacher_assignments[0]?.class_name.split(' ')[1]} {student.teacher_assignments[0]?.class_name.split(' ')[2]}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No students linked
                              </p>
                            )
                          ) : contact.principalData ? (
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                Principal
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          ) : contact.teacherData ? (
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                Teacher • {contact.teacherData.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          ) : contact.isGroup ? (
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.groupMembers?.length || 0} members
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          )}
                          {contact.unreadCount > 0 && (
                            <div className="flex justify-end mt-1">
                              <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {contact.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
    
      <div className="flex-grow flex flex-col bg-card">
        {activeChat ? (
          <>

            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    {getTypeIcon(activeChat.type)}
                  </div>

                  <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full transition-colors duration-200 border-2 border-background ${
                    websocket?.isConnected() ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
                <div>
                  <h2 className="font-medium">
                    {activeChat.parentData ? activeChat.parentData.full_name : 
                     activeChat.principalData ? activeChat.principalData.full_name : 
                     activeChat.teacherData ? activeChat.teacherData.full_name :
                     activeChat.name}
                  </h2>
                  {activeChat.parentData && 'linked_students' in activeChat.parentData ? (
                    activeChat.parentData.linked_students.length > 0 ? (
                      activeChat.parentData.linked_students.map((student: StudentData, index: number) => (
                        <div key={index}>
                          <p className="text-sm text-muted-foreground">
                            {student.student_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Grade {student.teacher_assignments?.[0]?.class_name.split(' ')[1]} {student.teacher_assignments?.[0]?.class_name.split(' ')[2]}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No students linked
                      </p>
                    )
                  ) : activeChat.principalData ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Principal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Administrative contact
                      </p>
                    </div>
                  ) : activeChat.isGroup ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Group • {activeChat.groupMembers?.length || 0} members
                      </p>
                      {activeChat.groupMembers && activeChat.groupMembers.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activeChat.groupMembers.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {activeChat.isOnline ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
       
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}



   
            <div className="flex-grow overflow-y-auto p-4">
              {selectingParent ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading chat...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const showDateHeader = index === 0 || 
                      (index > 0 && !isSameDay(message.created_at || message.timestamp, messages[index - 1].created_at || messages[index - 1].timestamp));
                    
                    return (
                      <div key={message.id}>
                      
                        {showDateHeader && (
                          <div className="flex justify-center mb-4">
                            <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full">
                              {getDateLabel(message.created_at || message.timestamp)}
                            </div>
                          </div>
                        )}
                        
             
                        <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isOwn 
                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                : 'bg-muted rounded-bl-none'
                            }`}
                          >
                            {!message.isOwn && (
                              <div className="font-medium text-xs mb-1">
                                {message.senderName}
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <span>{formatTime(message.created_at || message.timestamp)}</span>
                              {message.isOwn && getStatusIcon(message.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
     
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={selectingParent ? "Loading chat..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-grow"
                  disabled={selectingParent}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || selectingParent}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              {selectingParent ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    Opening Chat...
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while we open the selected parent&apos;s chat
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    {loading ? 'Loading...' : 'Select a chat'}
                  </h3>
                  <p className="text-muted-foreground">
                    {loading ? 'Please wait while we load your chats...' : 'Choose a parent, principal, or group from the list to start messaging'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}