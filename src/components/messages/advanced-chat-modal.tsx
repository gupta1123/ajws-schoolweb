// src/components/messages/advanced-chat-modal.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Users, 
  Bell, 
  X, 
  Search,
  Check,
  BookOpen,
  Building,
  Send
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface Contact {
  id: string;
  name: string;
  type: 'parent' | 'teacher' | 'staff' | 'student' | 'group' | 'class' | 'grade' | 'school';
  avatar?: string;
  className?: string;
  studentCount?: number;
}

// Mock data
const mockContacts: Contact[] = [
  { id: '1', name: 'Rajesh Kumar', type: 'teacher', className: 'Grade 5A' },
  { id: '2', name: 'Sunita Reddy', type: 'teacher', className: 'Grade 6B' },
  { id: '3', name: 'Priya Sharma', type: 'teacher', className: 'Grade 7C' },
  { id: '4', name: 'Manoj Nair', type: 'staff', className: 'Admin' },
  { id: '5', name: 'Aarav Patel (Parent)', type: 'parent', className: 'Grade 5A' },
  { id: '6', name: 'Diya Nair (Parent)', type: 'parent', className: 'Grade 6B' },
  { id: '7', name: 'Vikram Sharma (Parent)', type: 'parent', className: 'Grade 7C' },
  { id: '8', name: 'Sunita Reddy (Parent)', type: 'parent', className: 'Grade 5A' },
  { id: '9', name: 'Grade 5A Parents', type: 'group', studentCount: 25 },
  { id: '10', name: 'Grade 6B Parents', type: 'group', studentCount: 22 },
  { id: '11', name: 'Grade 7C Parents', type: 'group', studentCount: 24 },
  { id: '12', name: 'Grade 5A', type: 'class', studentCount: 25 },
  { id: '13', name: 'Grade 6B', type: 'class', studentCount: 22 },
  { id: '14', name: 'Grade 7C', type: 'class', studentCount: 24 },
  { id: '15', name: 'Grade 5', type: 'grade', studentCount: 75 },
  { id: '16', name: 'Grade 6', type: 'grade', studentCount: 68 },
  { id: '17', name: 'All Parents', type: 'school', studentCount: 500 },
  { id: '18', name: 'All Teachers', type: 'school', studentCount: 35 },
  { id: '19', name: 'All Staff', type: 'school', studentCount: 45 }
];

const uniqueClasses = Array.from(new Set(mockContacts.map(c => c.className).filter(Boolean)));

interface AdvancedChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChat: (recipientIds: string[], messageType: 'individual' | 'group' | 'announcement') => void;
  onSendNotification: (recipientIds: string[], notificationType: string) => void;
}

export function AdvancedChatModal({ open, onOpenChange, onCreateChat, onSendNotification }: AdvancedChatModalProps) {
  const [messageType, setMessageType] = useState<'chat' | 'notification'>('chat');
  const [chatType, setChatType] = useState<'individual' | 'group' | 'announcement'>('individual');
  const [notificationType, setNotificationType] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    class: 'all'
  });

  const getTypeIcon = (type: Contact['type']) => {
    switch (type) {
      case 'parent': return <User className="h-4 w-4" />;
      case 'teacher': return <BookOpen className="h-4 w-4" />;
      case 'staff': return <Building className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      case 'class': return <BookOpen className="h-4 w-4" />;
      case 'grade': return <BookOpen className="h-4 w-4" />;
      case 'school': return <Building className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Contact['type']) => {
    switch (type) {
      case 'parent': return 'Parent';
      case 'teacher': return 'Teacher';
      case 'staff': return 'Staff';
      case 'group': return 'Group';
      case 'class': return 'Class';
      case 'grade': return 'Grade';
      case 'school': return 'School';
      default: return 'Contact';
    }
  };

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === 'all' || contact.type === filters.type;
    const matchesClass = filters.class === 'all' || contact.className === filters.class;
    
    return matchesSearch && matchesType && matchesClass;
  });

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    );
  };

  const handleCreate = () => {
    if (selectedContacts.length === 0) return;
    
    if (messageType === 'chat') {
      onCreateChat(selectedContacts, chatType);
    } else {
      onSendNotification(selectedContacts, notificationType);
    }
    
    // Reset form
    setSelectedContacts([]);
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {messageType === 'chat' ? 'New Message' : 'Send Notification'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {messageType === 'chat' 
                  ? 'Start a conversation with individuals or groups' 
                  : 'Broadcast important information to recipients'}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden flex flex-col gap-4 py-2">
          {/* Message Type Tabs */}
          <div className="flex rounded-lg bg-muted p-1">
            <Button
              variant={messageType === 'chat' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-9"
              onClick={() => setMessageType('chat')}
            >
              <Users className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              variant={messageType === 'notification' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-9"
              onClick={() => setMessageType('notification')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notify
            </Button>
          </div>
          
          {/* Chat Type Selection */}
          {messageType === 'chat' && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={chatType === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatType('individual')}
              >
                <User className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Individual</span>
              </Button>
              <Button
                variant={chatType === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatType('group')}
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Group</span>
              </Button>
              <Button
                variant={chatType === 'announcement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatType('announcement')}
              >
                <Bell className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Broadcast</span>
              </Button>
            </div>
          )}
          
          {/* Notification Type */}
          {messageType === 'notification' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts, classes, groups..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="group">Groups</SelectItem>
                    <SelectItem value="class">Classes</SelectItem>
                    <SelectItem value="grade">Grades</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Class</Label>
                <Select 
                  value={filters.class} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, class: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map(cls => (
                      <SelectItem key={cls} value={cls || ''}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Selected Contacts */}
          {selectedContacts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {selectedContacts.length} selected
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map(contactId => {
                  const contact = mockContacts.find(c => c.id === contactId);
                  return contact ? (
                    <div 
                      key={contactId} 
                      className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground px-2 py-1 rounded-full text-xs"
                    >
                      <span className="max-w-[120px] truncate">{contact.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContact(contactId);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          
          {/* Contact List */}
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="text-sm text-muted-foreground mb-2">
              {filteredContacts.length} contacts available
            </div>
            
            <div className="flex-grow overflow-y-auto border rounded-md">
              {filteredContacts.length > 0 ? (
                <div className="divide-y">
                  {filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        if (messageType === 'chat' && chatType === 'individual') {
                          toggleContact(contact.id);
                        } else if (messageType === 'notification') {
                          toggleContact(contact.id);
                        } else {
                          // For group chats and announcements, just select one
                          setSelectedContacts([contact.id]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(contact.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{contact.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                            <span className="truncate">{getTypeLabel(contact.type)}</span>
                            {contact.className && (
                              <span className="truncate">• {contact.className}</span>
                            )}
                            {contact.studentCount && (
                              <span className="truncate">• {contact.studentCount} members</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {messageType === 'chat' && chatType === 'individual' ? (
                        <div 
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            selectedContacts.includes(contact.id) 
                              ? 'bg-primary border-primary' 
                              : 'border-input'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContact(contact.id);
                          }}
                        >
                          {selectedContacts.includes(contact.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant={selectedContacts.includes(contact.id) ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (messageType === 'chat' && chatType !== 'individual') {
                              setSelectedContacts([contact.id]);
                            } else if (messageType === 'notification') {
                              toggleContact(contact.id);
                            }
                          }}
                        >
                          {selectedContacts.includes(contact.id) ? 'Added' : 'Add'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No contacts found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleCreate}
            disabled={selectedContacts.length === 0}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {messageType === 'chat' ? 'Start Chat' : 'Send Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}