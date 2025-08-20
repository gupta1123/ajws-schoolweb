// src/components/messages/batch-notifications.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  BookOpen, 
  Building, 
  Users, 
  Send, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface NotificationGroup {
  id: string;
  name: string;
  type: 'class' | 'grade' | 'school' | 'custom';
  memberCount: number;
  description: string;
}

// Mock data
const mockNotificationGroups: NotificationGroup[] = [
  { 
    id: '1', 
    name: 'Grade 5A Parents', 
    type: 'class', 
    memberCount: 25, 
    description: 'All parents of students in Grade 5A' 
  },
  { 
    id: '2', 
    name: 'Grade 6B Parents', 
    type: 'class', 
    memberCount: 22, 
    description: 'All parents of students in Grade 6B' 
  },
  { 
    id: '3', 
    name: 'Grade 7C Parents', 
    type: 'class', 
    memberCount: 20, 
    description: 'All parents of students in Grade 7C' 
  },
  { 
    id: '4', 
    name: 'All Grade 5 Parents', 
    type: 'grade', 
    memberCount: 50, 
    description: 'Parents of all students in Grade 5' 
  },
  { 
    id: '5', 
    name: 'All Grade 6 Parents', 
    type: 'grade', 
    memberCount: 45, 
    description: 'Parents of all students in Grade 6' 
  },
  { 
    id: '6', 
    name: 'All Teachers', 
    type: 'custom', 
    memberCount: 15, 
    description: 'All teaching staff' 
  },
  { 
    id: '7', 
    name: 'All Staff', 
    type: 'custom', 
    memberCount: 25, 
    description: 'All school staff including admin and support' 
  },
  { 
    id: '8', 
    name: 'Entire School', 
    type: 'school', 
    memberCount: 600, 
    description: 'All parents, teachers, and staff' 
  }
];

export function BatchNotifications() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState('general');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    setSelectedGroups(mockNotificationGroups.map(group => group.id));
  };

  const handleClearAll = () => {
    setSelectedGroups([]);
  };

  const handleSend = () => {
    if (selectedGroups.length > 0 && message.trim() && title.trim()) {
      setIsSending(true);
      setSendStatus('sending');
      
      // Simulate API call
      setTimeout(() => {
        setIsSending(false);
        setSendStatus('success');
        
        // Reset after 3 seconds
        setTimeout(() => {
          setSendStatus('idle');
          setSelectedGroups([]);
          setTitle('');
          setMessage('');
        }, 3000);
      }, 1500);
    }
  };

  const getGroupIcon = (type: NotificationGroup['type']) => {
    switch (type) {
      case 'class':
        return <BookOpen className="h-4 w-4" />;
      case 'grade':
        return <Building className="h-4 w-4" />;
      case 'school':
        return <Bell className="h-4 w-4" />;
      case 'custom':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTotalRecipients = () => {
    return mockNotificationGroups
      .filter(group => selectedGroups.includes(group.id))
      .reduce((total, group) => total + group.memberCount, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Notifications</CardTitle>
          <CardDescription>
            Send announcements to groups of parents, teachers, or staff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-title">Notification Title</Label>
                <Input
                  id="notification-title"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="notification-type">Notification Type</Label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        General
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Urgent
                      </div>
                    </SelectItem>
                    <SelectItem value="academic">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        Academic
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        Event
                      </div>
                    </SelectItem>
                    <SelectItem value="holiday">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-500" />
                        Holiday
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  placeholder="Enter your notification message..."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Recipient Groups</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md max-h-96 overflow-y-auto">
                {mockNotificationGroups.map(group => (
                  <div 
                    key={group.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted ${
                      selectedGroups.includes(group.id) ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getGroupIcon(group.type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{group.name}</h4>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {group.memberCount}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      </div>
                      <div 
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${
                          selectedGroups.includes(group.id) 
                            ? 'bg-primary border-primary' 
                            : 'border-input'
                        }`}
                      >
                        {selectedGroups.includes(group.id) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    Selected groups: {selectedGroups.length}
                  </span>
                  <span className="text-sm font-medium">
                    Total recipients: {getTotalRecipients()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleSend}
              disabled={isSending || selectedGroups.length === 0 || !message.trim() || !title.trim()}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
          
          {sendStatus === 'success' && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Notification sent successfully to {getTotalRecipients()} recipients!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}