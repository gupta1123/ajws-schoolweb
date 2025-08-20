// src/components/messages/chat-interface.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Search, 
  User, 
  Users, 
  Bell,
  Check,
  CheckCheck,
  Phone,
  Video,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
}

interface ChatContact {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  type: 'individual' | 'group' | 'announcement';
  avatar?: string;
}

// Mock data
const mockContacts: ChatContact[] = [
  {
    id: '1',
    name: 'Grade 5A Parents',
    lastMessage: 'Thanks for the update!',
    lastMessageTime: '10:30 AM',
    unreadCount: 2,
    isOnline: true,
    type: 'group'
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    lastMessage: 'I\'ll check on that',
    lastMessageTime: '9:15 AM',
    unreadCount: 0,
    isOnline: false,
    type: 'individual'
  },
  {
    id: '3',
    name: 'School Announcements',
    lastMessage: 'Holiday schedule updated',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    isOnline: false,
    type: 'announcement'
  },
  {
    id: '4',
    name: 'Sunita Reddy',
    lastMessage: 'See you tomorrow',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: true,
    type: 'individual'
  },
  {
    id: '5',
    name: 'Grade 6B Parents',
    lastMessage: 'Meeting reminder',
    lastMessageTime: 'Wed',
    unreadCount: 0,
    isOnline: false,
    type: 'group'
  }
];

const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: '1',
      senderId: 'me',
      senderName: 'You',
      content: 'Hi everyone, just wanted to remind about tomorrow\'s parent-teacher meeting.',
      timestamp: '10:25 AM',
      status: 'read',
      isOwn: true
    },
    {
      id: '2',
      senderId: 'parent1',
      senderName: 'Aarav\'s Mom',
      content: 'Thanks for the reminder!',
      timestamp: '10:27 AM',
      status: 'read',
      isOwn: false
    },
    {
      id: '3',
      senderId: 'parent2',
      senderName: 'Diya\'s Dad',
      content: 'Will be there for sure.',
      timestamp: '10:30 AM',
      status: 'delivered',
      isOwn: false
    },
    {
      id: '4',
      senderId: 'me',
      senderName: 'You',
      content: 'Great! Looking forward to seeing you all.',
      timestamp: '10:32 AM',
      status: 'sent',
      isOwn: true
    }
  ],
  '2': [
    {
      id: '1',
      senderId: 'teacher1',
      senderName: 'Rajesh Kumar',
      content: 'I noticed Aarav has been doing well in math lately.',
      timestamp: '9:10 AM',
      status: 'read',
      isOwn: false
    },
    {
      id: '2',
      senderId: 'me',
      senderName: 'You',
      content: 'Yes, he\'s been putting in extra effort at home too.',
      timestamp: '9:15 AM',
      status: 'read',
      isOwn: true
    }
  ]
};

export function ChatInterface() {
  const [contacts] = useState<ChatContact[]>(mockContacts);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(contacts[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages['1'] || []);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      setMessages(mockMessages[activeChat.id] || []);
    }
  }, [activeChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && activeChat) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'You',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        isOwn: true
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update last message in contact
      contacts.map(contact => 
        contact.id === activeChat.id 
          ? { ...contact, lastMessage: newMessage, lastMessageTime: 'now' } 
          : contact
      );
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
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card">
      {/* Contacts List */}
      <div className="w-1/3 border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          <div className="divide-y">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id}
                className={`p-4 cursor-pointer hover:bg-muted ${activeChat?.id === contact.id ? 'bg-muted' : ''}`}
                onClick={() => setActiveChat(contact)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      {getTypeIcon(contact.type)}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{contact.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {contact.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.lastMessage}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chat Window */}
      <div className="flex-grow flex flex-col bg-card">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    {getTypeIcon(activeChat.type)}
                  </div>
                  {activeChat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-background"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-medium">{activeChat.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeChat.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
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
                        <span>{message.timestamp}</span>
                        {message.isOwn && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-grow"
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Select a chat
              </h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}