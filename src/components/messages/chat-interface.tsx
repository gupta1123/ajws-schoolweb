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
import { useI18n } from '@/lib/i18n/context';
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
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month}' ${year}`;
};

// Function to format time as "8:00 PM"
const formatTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Function to get date label (Today, Yesterday, or formatted date)
const getDateLabel = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
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
const isSameDay = (date1?: string | null, date2?: string | null): boolean => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
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

// Sort contacts by most recent activity (last message or thread updated)
const sortContactsWithPinned = (contacts: ChatContact[]): ChatContact[] => {
  const toTs = (c: ChatContact) => {
    const th: Record<string, unknown> = (c.threadData as unknown as Record<string, unknown>) || {};
    const last = Array.isArray(th.last_message)
      ? (th.last_message.length ? th.last_message[th.last_message.length - 1] : null)
      : th.last_message;
    const stamp = last?.created_at || th.updated_at || th.created_at;
    const d = stamp ? new Date(stamp) : null;
    return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
  };
  return [...contacts].sort((a, b) => toTs(b) - toTs(a));
};



// Function to transform chat threads to contacts
const transformThreadsToContacts = (threads: unknown[], user: { id: string } | null): ChatContact[] => {
  return threads.map((thread) => {
    const threadObj = thread as { [key: string]: unknown };
    // Normalize fields for different thread shapes (teacher vs principal/admin)
    const threadId: string = (threadObj.id as string) || (threadObj.thread_id as string);
    const isGroup: boolean = threadObj.thread_type === 'group';

    // Handle different last_message formats
    let lastMsg: { [key: string]: unknown } | null = null;
    if (Array.isArray(threadObj.last_message)) {
      lastMsg = threadObj.last_message.length > 0 ? threadObj.last_message[threadObj.last_message.length - 1] : null;
    } else if (threadObj.last_message && typeof threadObj.last_message === 'object') {
      lastMsg = threadObj.last_message as { [key: string]: unknown };
    }

    // Handle different participants formats
    let participantsArr: Array<{ [key: string]: unknown }> = [];
    if (Array.isArray(threadObj.participants)) {
      participantsArr = threadObj.participants as Array<{ [key: string]: unknown }>;
    } else if (threadObj.participants && typeof threadObj.participants === 'object') {
      const participants = threadObj.participants as { all?: Array<{ [key: string]: unknown }> };
      participantsArr = participants.all || [];
    }

    // Members excluding current user
    const groupMembers: string[] = participantsArr
      .filter((p) => {
        const participant = p as { user_id?: string; user?: { id?: string } };
        return (participant.user_id ?? participant.user?.id) !== user?.id;
      })
      .map((p) => {
        const participant = p as { user?: { full_name?: string } };
        return participant.user?.full_name ?? '';
      });


    // Extract a teacher participant if any
    const teacherParticipant = participantsArr.find((p) => {
      const participant = p as { user?: { role?: string }; role?: string };
      return (participant.user?.role ?? participant.role) === 'teacher';
    });
    const teacherData = teacherParticipant
      ? {
          teacher_id: (teacherParticipant as { user_id?: string; user?: { id?: string } }).user_id ?? (teacherParticipant as { user?: { id?: string } }).user?.id ?? '',
          full_name: (teacherParticipant as { user?: { full_name?: string } }).user?.full_name ?? '',
          role: (teacherParticipant as { user?: { role?: string }; role?: string }).user?.role ?? 'teacher',
        }
      : null;

    // Extract a parent participant if any
    const parentParticipant = participantsArr.find((p) => {
      const participant = p as { user?: { role?: string }; role?: string };
      return (participant.user?.role ?? participant.role) === 'parent';
    });
    const parentData = parentParticipant
      ? {
          parent_id: (parentParticipant as { user_id?: string; user?: { id?: string } }).user_id ?? (parentParticipant as { user?: { id?: string } }).user?.id ?? '',
          full_name: (parentParticipant as { user?: { full_name?: string } }).user?.full_name ?? '',
          role: (parentParticipant as { user?: { role?: string }; role?: string }).user?.role ?? 'parent',
        }
      : null;

    const dateSource: string | undefined = (lastMsg as { created_at?: string })?.created_at || (threadObj.updated_at as string) || (threadObj.created_at as string);

    return {
      id: threadId,
      name: threadObj.title as string,
      lastMessage: lastMsg ? (lastMsg.content as string) : 'No messages yet',
      lastMessageTime: formatDate(dateSource),
      unreadCount: 0,
      isOnline: false,
      type: isGroup ? 'group' : 'individual',
      isGroup,
      groupMembers,
      isPinned: false,
      teacherData,
      parentData,
      // Ensure threadData includes a normalized id for downstream consumers
      threadData: { ...threadObj, id: threadId } as ChatThread,
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
  chatsData?: { threads?: unknown[] };
  activeTab?: 'direct' | 'group';
}

export function ChatInterface({ selectedParentId, isAdminOrPrincipal, chatsData }: ChatInterfaceProps) {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [websocket, setWebsocket] = useState<ChatWebSocket | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectingParent, setSelectingParent] = useState(false);

  // Hooks for real API data
  const { messages: apiMessages } = useChatMessages(currentThreadId);


  // Ignore external tabs; unified list

  // Initialize WebSocket connection (non-blocking)
  useEffect(() => {
    if (token) {
      const ws = new ChatWebSocket(token);
      // Set immediately so we can queue subscriptions even before open
      setWebsocket(ws);
      ws.connect().catch((error) => {
        console.warn('WebSocket initial connect error (non-blocking):', error);
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


  // Do not auto-fetch parents on initial load to avoid extra calls

  // Fetch chat threads function
  const fetchThreads = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
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
          const sortedContacts = sortContactsWithPinned(threadContacts);
          setContacts(sortedContacts);
          // Auto-select the most recent chat if none selected
          if (sortedContacts.length > 0 && !activeChat) {
            const first = sortedContacts[0];
            setActiveChat(first);
            if (first.threadData) setCurrentThreadId(first.threadData.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chat threads:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, activeChat]);

  // Fetch chat threads on component mount
  useEffect(() => {
    if (token) {
      fetchThreads();
    }
    // Only run on token changes to avoid duplicate fetches when activeChat changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      const first = contacts[0];
      console.log('Auto-selecting most recent contact:', first.name);
      setActiveChat(first);
    }
  }, [contacts, activeChat, selectedParentId, selectingParent]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    
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
        // Accept both message_received and other server variants that include content + thread_id
        if ((message.type === 'message_received' || message.type === 'send_message' || message.type === 'thread_updated')
            && message.thread_id === currentThreadId && typeof message.content === 'string') {
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
        
        // Let the useChatMessages hook load messages for all roles
        if (isAdminOrPrincipal) {
          // For admin/principal users, let the useChatMessages hook load messages.
          // Only clear local messages if switching to a different thread.
          if (currentThreadId !== existingThread.id) {
            console.log('Thread changed for admin/principal, clearing messages to let hook load them');
            setMessages([]);
          }
        } else {
          // Teachers: also rely on hook, don't pre-populate from summary
          if (currentThreadId !== existingThread.id) {
            setMessages([]);
          }
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
  }, [activeChat, chatThreads, websocket, user, selectingParent, isAdminOrPrincipal, currentThreadId]);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !token) return;

    try {
      let threadId = currentThreadId;
      let sentInCreate = false;


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
                setNewMessage('');
                sentInCreate = true;
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
                setNewMessage('');
                sentInCreate = true;
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

 
      if (threadId && !sentInCreate) {
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
        {/* Unified chat list (no tabs) */}
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={'Search chats...'}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('messages.loading', 'Loading chats...')}
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No Chats Found
              </h3>
              <p className="text-muted-foreground">
                You don&apos;t have any chats yet.
              </p>
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
                          {/* Pinned indicator removed */}
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
                                  You&apos;re
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {contact.lastMessageTime}
                            </span>
                          </div>
                          {user?.role === 'teacher' ? (
                            // Teacher view: only show last message under the name
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.lastMessage}
                              </p>
                            </div>
                          ) : contact.parentData && 'linked_students' in contact.parentData ? (
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
                                {t('common.teacher', 'Teacher')} • {contact.teacherData.full_name}
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
                    <p className="text-sm text-muted-foreground truncate">
                      {activeChat.groupMembers && activeChat.groupMembers.length > 0
                        ? activeChat.groupMembers.join(', ')
                        : (() => {
                            if (activeChat.parentData && 'full_name' in activeChat.parentData) {
                              return activeChat.parentData.full_name;
                            }
                            return (activeChat.principalData as unknown as Record<string, unknown>)?.full_name as string || activeChat.name || '';
                          })()}
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
                    <p className="text-sm text-muted-foreground">{t('messages.loadingChat', 'Loading chat...')}</p>
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
                  placeholder={selectingParent ? t('messages.loadingChat', 'Loading chat...') : t('messages.typeMessage', 'Type a message...')}
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
