// src/app/messages/compose/page.tsx

'use client';

import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdvancedChatModal } from '@/components/messages/advanced-chat-modal';

export default function ComposeMessagePage() {
  const router = useRouter();
  const [showNewChat] = useState(true);

  const handleCreateChat = (recipientIds: string[], messageType: 'individual' | 'group' | 'announcement') => {
    // Handle creating a new chat
    console.log('Creating chat with:', recipientIds, messageType);
    router.push('/messages');
  };

  const handleSendNotification = (recipientIds: string[], notificationType: string) => {
    // Handle sending notification
    console.log('Sending notification to:', recipientIds, notificationType);
    router.push('/messages');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-6xl mx-auto pt-16">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/messages')}
              className="mb-4"
            >
              <X className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </div>
        </main>
      </div>
      
      {showNewChat && (
        <AdvancedChatModal 
          open={showNewChat}
          onOpenChange={() => router.push('/messages')}
          onCreateChat={handleCreateChat}
          onSendNotification={handleSendNotification}
        />
      )}
    </ProtectedRoute>
  );
}