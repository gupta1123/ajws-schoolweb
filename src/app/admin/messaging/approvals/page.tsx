'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { messagingAPI, Message, ChatThread } from '@/lib/api/messaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrincipalMessagePanel } from '@/components/messaging/principal-message-panel';
import { useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';

interface ThreadWithPending extends ChatThread {
  pendingCount: number;
}

export default function MessagingApprovalsPage() {
  const router = useRouter();
  const { subscribeToThread, unsubscribeFromThread, startPolling, stopPolling } = useWebSocketChat();
  const [pending, setPending] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ThreadWithPending[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadWithPending | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentUser] = useState({ id: '', full_name: 'Principal' });

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter(t => t.title.toLowerCase().includes(q));
  }, [threads, query]);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const { messages } = await messagingAPI.fetchPendingMessages();
      setPending(messages);
      
      // Group by thread and count pending messages
      const threadMap = new Map<string, ThreadWithPending>();
      for (const m of messages) {
        const threadId = m.thread_id ?? 'unknown';
        if (threadId === 'unknown' || !m.thread) continue;
        
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, {
            id: m.thread.id,
            title: m.thread.title,
            thread_type: m.thread.thread_type,
            participants: (m.thread.participants ?? [])
              .filter((p): p is { user_id: string; user: { id: string; full_name: string } } => p.user !== undefined)
              .map(p => ({ user_id: p.user_id, user: { id: p.user.id, full_name: p.user.full_name } })),
            created_at: m.created_at,
            updated_at: m.created_at,
            pendingCount: 1
          });
        } else {
          const existing = threadMap.get(threadId)!;
          existing.pendingCount += 1;
        }
      }
      
      const threadsArray = Array.from(threadMap.values()).sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setThreads(threadsArray);
      
      // Auto-select first thread
      if (threadsArray.length > 0 && !selectedThread) {
        setSelectedThread(threadsArray[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedThread]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleMessageSent = useCallback(() => {
    // Reload pending list when a message is sent
    loadPending();
  }, [loadPending]);

  // Live updates: poll thread messages periodically to reflect new approvals/rejections
  // Live updates: subscribe to the selected thread; fallback to polling when socket is unavailable
  useEffect(() => {
    if (!selectedThread) return;
    const threadId = selectedThread.id;
    const handler = () => {
      // When a new message arrives in the context thread, refresh the pending list
      loadPending();
    };
    subscribeToThread(threadId, () => handler());
    startPolling(threadId, () => handler());
    return () => {
      unsubscribeFromThread(threadId);
      stopPolling(threadId);
    };
  }, [selectedThread?.id, subscribeToThread, unsubscribeFromThread, startPolling, stopPolling, loadPending]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="px-2" onClick={() => router.push('/admin/messaging')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-semibold">Message Approvals</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadPending}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Left: Threads with pending */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Threads ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search threads" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="space-y-3 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 flex flex-col items-center gap-2">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                  <p>No pending messages</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredThreads.map(t => (
                    <button
                      key={t.id}
                      className={cn(
                        'w-full text-left p-3 rounded border hover:bg-muted transition-colors',
                        selectedThread?.id === t.id && 'bg-muted border-primary'
                      )}
                      onClick={() => setSelectedThread(t)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {t.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{t.title}</span>
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-100 text-yellow-800 px-2 text-[10px] font-medium">
                              {t.pendingCount}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.pendingCount} pending message{t.pendingCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Message panel using PrincipalMessagePanel */}
        <div className="col-span-8 flex flex-col min-h-0">
          {!selectedThread ? (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a thread to view conversation</p>
              </div>
            </Card>
          ) : (
            <PrincipalMessagePanel
              teacher={{
                assignment_id: '',
                teacher_id: '',
                full_name: '',
                email: null,
                phone_number: '',
                assignment_type: '',
                subject: null,
                is_primary: false,
                assigned_date: ''
              }}
              thread={selectedThread}
              currentUser={currentUser}
              onMessageSent={handleMessageSent}
              teacherPerspective={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}


