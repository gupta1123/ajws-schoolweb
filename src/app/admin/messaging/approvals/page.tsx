'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { messagingAPI, Message, ChatThread } from '@/lib/api/messaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrincipalMessagePanel } from '@/components/messaging/principal-message-panel';
import { useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { principalMessagingServices, type PrincipalClassDivision, type PrincipalDivisionParentsResponse } from '@/lib/api/principal-messaging';

interface ThreadWithPending extends ChatThread {
  pendingCount: number;
  targetAudience?: 'teacher' | 'parent';
  participants: Array<{
    user_id: string;
    user: {
      id: string;
      full_name: string;
      role?: string;
    };
  }>;
}

const cleanTitle = (title: string | undefined): string => {
  if (!title) return 'Conversation';
  return title
    .replace(/^chat\s*-\s*/i, '')
    .replace(/^chat\s+with\s+/i, '')
    .trim();
};

interface ParentStudentContext {
  parentId: string;
  parentName: string;
  studentName: string;
  classLabel: string;
}

export default function MessagingApprovalsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { subscribeToThread, unsubscribeFromThread, startPolling, stopPolling } = useWebSocketChat();
  const [pending, setPending] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ThreadWithPending[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadWithPending | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentUser] = useState({ id: '', full_name: 'Principal' });

  const [audienceFilter, setAudienceFilter] = useState<'all' | 'parent' | 'teacher'>('all');
  const [classDivisions, setClassDivisions] = useState<PrincipalClassDivision[] | null>(null);
  const [parentContextByThread, setParentContextByThread] = useState<Record<string, ParentStudentContext | null>>({});
  const [parentContextLoadingByThread, setParentContextLoadingByThread] = useState<Record<string, boolean>>({});

  const filteredThreads = useMemo(() => {
    const byQuery = (q: string, list: ThreadWithPending[]) =>
      q.trim()
        ? list.filter(t => cleanTitle(t.title).toLowerCase().includes(q.toLowerCase()))
        : list;

    const byAudience =
      audienceFilter === 'all'
        ? threads
        : threads.filter(t => t.targetAudience === audienceFilter);

    return byQuery(query, byAudience);
  }, [threads, query, audienceFilter]);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const { messages } = await messagingAPI.fetchPendingMessages();
      setPending(messages);

      const deriveTargetAudience = (participants: ThreadWithPending['participants']): 'teacher' | 'parent' | undefined => {
        const roles = participants.map(p => p.user.role).filter(Boolean);
        if (roles.includes('parent')) return 'parent';
        if (roles.includes('teacher')) return 'teacher';
        return undefined;
      };
      
      // Group by thread and count pending messages
      const threadMap = new Map<string, ThreadWithPending>();
      for (const m of messages) {
        const threadId = m.thread_id ?? 'unknown';
        if (threadId === 'unknown' || !m.thread) continue;
        
        const participants = (m.thread.participants ?? [])
          .filter((p): p is { user_id: string; user: { id: string; full_name: string; role?: string } } => p.user !== undefined)
          .map(p => ({
            user_id: p.user_id,
            user: {
              id: p.user.id,
              full_name: p.user.full_name,
              role: p.user.role
            }
          }));

        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, {
            id: m.thread.id,
            title: m.thread.title,
            thread_type: m.thread.thread_type,
            participants,
            created_at: m.created_at,
            updated_at: m.created_at,
            pendingCount: 1,
            targetAudience: deriveTargetAudience(participants)
          });
        } else {
          const existing = threadMap.get(threadId)!;
          existing.pendingCount += 1;
          // If we didn't have a target audience yet, derive it now
          if (!existing.targetAudience) {
            existing.targetAudience = deriveTargetAudience(participants);
          }
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

  // Load class divisions once for parent-student mapping
  useEffect(() => {
    const loadDivisions = async () => {
      if (!token || classDivisions) return;
      try {
        const response = await principalMessagingServices.getClassDivisions(token);
        setClassDivisions(response.data.class_divisions);
      } catch (error) {
        console.error('Error fetching class divisions for approvals context:', error);
      }
    };
    loadDivisions();
  }, [token, classDivisions]);

  // For selected parent DM thread, derive "parent of X - Class Y" context
  useEffect(() => {
    const loadParentContextForSelected = async () => {
      if (!selectedThread || !token) return;
      // Only for direct parent DMs
      if (selectedThread.thread_type !== 'direct' || selectedThread.targetAudience !== 'parent') return;
      if (parentContextByThread[selectedThread.id] !== undefined) return;

      const parentParticipant = (selectedThread.participants ?? []).find(
        (p) => p.user?.role === 'parent'
      );
      if (!parentParticipant) {
        setParentContextByThread((prev) => ({ ...prev, [selectedThread.id]: null }));
        return;
      }

      try {
        setParentContextLoadingByThread(prev => ({ ...prev, [selectedThread.id]: true }));
        // Ensure class divisions are loaded
        let divisions = classDivisions;
        if (!divisions) {
          const divResponse = await principalMessagingServices.getClassDivisions(token);
          divisions = divResponse.data.class_divisions;
          setClassDivisions(divisions);
        }
        if (!divisions || divisions.length === 0) {
          setParentContextByThread((prev) => ({ ...prev, [selectedThread.id]: null }));
          return;
        }

        // Search across divisions until we find this parent
        let foundContext: ParentStudentContext | null = null;
        for (const division of divisions) {
          const parentsResponse = await principalMessagingServices.getDivisionParents(division.id, token);
          const data = parentsResponse.data as PrincipalDivisionParentsResponse['data'];

          for (const student of data.students) {
            const matchParent = student.parents.find((p) => p.id === parentParticipant.user_id);
            if (matchParent) {
              // Build class label in the format "grad 3 A"
              const rawLevel = division.class_level.name || '';
              const cleanedLevel = rawLevel.replace(/grade\s*/i, '').trim() || rawLevel;
              const classLabel = `grad ${cleanedLevel} ${division.division}`;

              foundContext = {
                parentId: matchParent.id,
                parentName: matchParent.name,
                studentName: student.student.name,
                classLabel,
              };
              break;
            }
          }

          if (foundContext) break;
        }

        setParentContextByThread((prev) => ({ ...prev, [selectedThread.id]: foundContext }));
      } catch (error) {
        console.error('Error resolving parent student/class context:', error);
        setParentContextByThread((prev) => ({ ...prev, [selectedThread.id]: null }));
      } finally {
        setParentContextLoadingByThread(prev => ({ ...prev, [selectedThread.id]: false }));
      }
    };

    loadParentContextForSelected();
  }, [selectedThread, token, classDivisions, parentContextByThread]);

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
      {/* Header with Tabs & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-transparent"
              onClick={() => router.push('/admin/messaging')}
            >
              DM
            </Button>
            <Button
              variant="default"
              size="sm"
              className="rounded-none border-b-2 border-primary"
            >
              Approvals
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={loadPending}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-0">
        {/* Left: Threads with pending */}
        <Card className="col-span-4 flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Threads ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search threads" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <select
                className="border rounded-md px-2 py-2 text-xs text-muted-foreground bg-background"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value as 'all' | 'parent' | 'teacher')}
              >
                <option value="all">All</option>
                <option value="parent">Parent DMs</option>
                <option value="teacher">Teacher DMs</option>
              </select>
            </div>
            <ScrollArea className="flex-1 max-h-full">
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
                          {cleanTitle(t.title).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">{cleanTitle(t.title)}</span>
                              {t.targetAudience === 'parent' && (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 text-[11px] font-semibold border border-emerald-100">
                                  Parent DM
                                </span>
                              )}
                              {t.targetAudience === 'teacher' && (
                                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 text-[11px] font-semibold border border-blue-100">
                                  Teacher DM
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="inline-flex items-center h-5 px-2 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                              {t.pendingCount} pending
                            </span>
                          </div>
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
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {cleanTitle(selectedThread.title).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{cleanTitle(selectedThread.title)}</h2>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedThread.pendingCount} pending message{selectedThread.pendingCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Updated {new Date(selectedThread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
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
                  canSend={false}
                  parentContext={parentContextByThread[selectedThread.id] || undefined}
                  parentContextLoading={!!parentContextLoadingByThread[selectedThread.id]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


