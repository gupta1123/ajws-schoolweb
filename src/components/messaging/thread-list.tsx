// src/components/messaging/thread-list.tsx

'use client';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Users } from 'lucide-react';
import { ChatThread, formatMessageTime, getThreadTitle, getLastMessagePreview } from '@/lib/api/messaging';


interface ThreadListProps {
  threads: ChatThread[];
  selectedThread: ChatThread | null;
  onThreadSelect: (thread: ChatThread) => void;
  isLoading: boolean;
  onRefresh: () => void;
  currentUserId: string;
  isConnected?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
}

export function ThreadList({
  threads,
  selectedThread,
  onThreadSelect,
  isLoading,
  onRefresh,
  currentUserId,
  isConnected = false,
  connectionStatus = 'disconnected'
}: ThreadListProps) {


  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-xs text-muted-foreground">
                Start a new chat to begin messaging
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onThreadSelect(thread)}
                  className={cn(
                    "flex items-start space-x-3 p-3 cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    selectedThread?.id === thread.id && "bg-primary/10"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {thread.thread_type === 'group' ? (
                        <Users className="h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-sm font-medium text-primary">
                          {getThreadTitle(thread, currentUserId).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium truncate">
                          {getThreadTitle(thread, currentUserId)}
                        </h3>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          thread.thread_type === 'direct' 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                        )}>
                          {thread.thread_type}
                        </span>
                      </div>
                      {thread.last_message && thread.last_message.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatMessageTime(thread.last_message[0].created_at)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate">
                      {getLastMessagePreview(thread)}
                    </p>
                    
                    {thread.thread_type === 'group' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {thread.participants?.length || 0} participants
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
