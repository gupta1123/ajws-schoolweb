// src/components/messages/new-chat-modal.tsx

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
  Check
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Contact {
  id: string;
  name: string;
  type: 'parent' | 'teacher' | 'staff' | 'group';
  avatar?: string;
}

// Mock data
const mockContacts: Contact[] = [
  { id: '1', name: 'Rajesh Kumar', type: 'teacher' },
  { id: '2', name: 'Sunita Reddy', type: 'teacher' },
  { id: '3', name: 'Aarav Patel (Parent)', type: 'parent' },
  { id: '4', name: 'Diya Nair (Parent)', type: 'parent' },
  { id: '5', name: 'Grade 5A Parents', type: 'group' },
  { id: '6', name: 'Grade 6B Parents', type: 'group' },
  { id: '7', name: 'All Staff', type: 'group' }
];

interface NewChatModalProps {
  onClose: () => void;
  onCreateChat: (recipientIds: string[], chatType: 'individual' | 'group' | 'announcement') => void;
}

export function NewChatModal({ onClose, onCreateChat }: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [chatType, setChatType] = useState<'individual' | 'group' | 'announcement'>('individual');
  const [groupName, setGroupName] = useState('');

  // Filter contacts based on search and chat type
  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = chatType === 'individual' 
      ? contact.type === 'parent' || contact.type === 'teacher' || contact.type === 'staff'
      : contact.type === 'group';
    return matchesSearch && matchesType;
  });

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    );
  };

  const handleCreate = () => {
    if (selectedContacts.length > 0) {
      onCreateChat(selectedContacts, chatType);
      onClose();
    }
  };

  const getTypeIcon = (type: Contact['type']) => {
    switch (type) {
      case 'parent':
        return <User className="h-4 w-4" />;
      case 'teacher':
      case 'staff':
        return <User className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">New Chat</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <Label>Chat Type</Label>
              <Select value={chatType} onValueChange={(value: 'individual' | 'group' | 'announcement') => setChatType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Individual
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group
                    </div>
                  </SelectItem>
                  <SelectItem value="announcement">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Announcement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {chatType === 'group' && (
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <Label>Recipients</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredContacts.length > 0 ? (
                <div className="divide-y">
                  {filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => chatType === 'individual' ? toggleContact(contact.id) : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {getTypeIcon(contact.type)}
                        </div>
                        <span>{contact.name}</span>
                      </div>
                      {chatType === 'individual' ? (
                        <div 
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selectedContacts.includes(contact.id) 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContact(contact.id);
                          }}
                        >
                          {selectedContacts.includes(contact.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => onCreateChat([contact.id], 'group')}
                        >
                          Chat
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No contacts found
                </div>
              )}
            </div>
          </div>
        </div>
        
        {chatType === 'individual' && (
          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={selectedContacts.length === 0}
            >
              Create Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}