// src/app/messages/[id]/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Reply, Trash2, Check, X, Send, User, Users, Bell, AlertCircle } from 'lucide-react';
import { useState } from 'react';

// Mock data for a specific message
const mockMessage = {
  id: '1',
  sender: 'Dr. Priya Sharma',
  recipient: 'All Teachers',
  subject: 'School Assembly Notice',
  content: `Dear Teachers,

This is to inform you that the school assembly will be held tomorrow at 9:00 AM in the main auditorium. The agenda for the assembly includes:

1. Monthly performance review
2. Upcoming events and holidays
3. Important announcements

Please ensure that your classes are present on time. Teachers are requested to accompany their respective classes.

Thank you.

Best regards,
Dr. Priya Sharma
Principal`,
  timestamp: '2025-08-15 09:30',
  priority: 'normal',
  status: 'approved',
  type: 'announcement',
  category: 'school'
};

// Message type configuration
const messageTypeConfig = {
  announcement: { icon: Bell, label: 'Announcement', color: 'bg-blue-100 text-blue-800' },
  group: { icon: Users, label: 'Group', color: 'bg-green-100 text-green-800' },
  individual: { icon: User, label: 'Individual', color: 'bg-purple-100 text-purple-800' }
};

// Category configuration
const categoryConfig = {
  school: { label: 'School', color: 'bg-blue-500' },
  class: { label: 'Class', color: 'bg-green-500' },
  parent: { label: 'Parent', color: 'bg-yellow-500' }
};

export default function MessageDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [replyContent, setReplyContent] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleApproveMessage = (messageId: string) => {
    // Here you would typically send the approval to your API
    console.log(`Approved message ${messageId}`);
    // Update the UI to reflect the approval
  };

  const handleRejectMessage = (messageId: string) => {
    // Here you would typically send the rejection to your API
    console.log(`Rejected message ${messageId}`);
    // Update the UI to reflect the rejection
  };

  const handleDeleteMessage = (messageId: string) => {
    // Here you would typically send the deletion to your API
    console.log(`Deleted message ${messageId}`);
    // Redirect back to messages list
    router.push('/messages');
  };

  const handleSendReply = () => {
    // Here you would typically send the reply to your API
    console.log('Sending reply:', replyContent);
    setReplyContent('');
    setShowReply(false);
  };

  const typeConfig = messageTypeConfig[mockMessage.type as keyof typeof messageTypeConfig];
  const TypeIcon = typeConfig.icon;
  
  const catConfig = categoryConfig[mockMessage.category as keyof typeof categoryConfig];

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-4xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Back to Messages
            </Button>
            <h1 className="text-3xl font-bold mb-2">Message Details</h1>
            <p className="text-gray-600 dark:text-gray-300">
              View message content and details
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{mockMessage.subject}</CardTitle>
                    {mockMessage.priority === 'high' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        High Priority
                      </span>
                    )}
                    <span className={`px-2 py-1 text-sm rounded-full flex items-center gap-1 ${typeConfig.color}`}>
                      <TypeIcon className="h-4 w-4" />
                      {typeConfig.label}
                    </span>
                  </div>
                  <CardDescription>
                    {mockMessage.sender} • {mockMessage.timestamp}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(user?.role === 'admin' || user?.role === 'principal') && mockMessage.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApproveMessage(mockMessage.id)}
                      >
                        <Check className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Approve</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRejectMessage(mockMessage.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Reject</span>
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowReply(!showReply)}>
                    <Reply className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Reply</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteMessage(mockMessage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                    <p className="font-medium">{mockMessage.sender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                    <p className="font-medium">{mockMessage.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-medium">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${catConfig.color}`}></span>
                      {catConfig.label}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="prose max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 bg-transparent p-0">
                      {mockMessage.content}
                    </pre>
                  </div>
                </div>
              </div>
              
              {showReply && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Reply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="reply" className="block text-sm font-medium mb-2">
                          Your Reply
                        </label>
                        <textarea
                          id="reply"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={4}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="Write your reply here..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowReply(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSendReply}
                          disabled={!replyContent.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}