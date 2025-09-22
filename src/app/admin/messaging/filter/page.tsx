// src/app/admin/messaging/filter/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, Users, GraduationCap, Phone, MessageSquare, RefreshCw, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { useRouter } from 'next/navigation';
import { 
  principalMessagingServices, 
  PrincipalClassDivision, 
  PrincipalDivisionTeacher,
  PrincipalDivisionMessage,
  PrincipalDivisionThread,
  PrincipalDivisionStudent,
  PrincipalDivisionParent
} from '@/lib/api/principal-messaging';
import { messagingAPI, ChatThread } from '@/lib/api/messaging';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { MessagePanel } from '@/components/messaging/message-panel';

export default function PrincipalMessagingFilterPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [classDivisions, setClassDivisions] = useState<PrincipalClassDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<PrincipalClassDivision | null>(null);
  const [divisionTeachers, setDivisionTeachers] = useState<PrincipalDivisionTeacher[]>([]);
  const [divisionThreads, setDivisionThreads] = useState<PrincipalDivisionThread[]>([]);
  const [divisionStudents, setDivisionStudents] = useState<PrincipalDivisionStudent[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [viewType, setViewType] = useState<'teachers' | 'groups' | 'parents'>('teachers');
  const [selectedGroup, setSelectedGroup] = useState<PrincipalDivisionThread | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  
 
  const { isConnected, connectionStatus } = useWebSocketChat();

 
  useEffect(() => {
    fetchClassDivisions();
  }, []);

  const fetchClassDivisions = async () => {
    try {
      setIsLoadingDivisions(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await principalMessagingServices.getClassDivisions(token);
      setClassDivisions(response.data.class_divisions);
    } catch (error) {
      console.error('Error fetching class divisions:', error);
    } finally {
      setIsLoadingDivisions(false);
    }
  };

  const handleDivisionSelect = async (divisionId: string) => {
    const division = classDivisions.find(d => d.id === divisionId);
    if (!division) return;

    setSelectedDivision(division);
    setSelectedThread(null);
    
    try {
      setIsLoadingTeachers(true);
      setIsLoadingMessages(true);
      setIsLoadingParents(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
     
      const response = await principalMessagingServices.getDivisionMessages(divisionId, token);
      setDivisionTeachers(response.data.teachers);
      setDivisionThreads(response.data.threads || []);
      

      const parentsResponse = await principalMessagingServices.getDivisionParents(divisionId, token);
      setDivisionStudents(parentsResponse.data.students);
    } catch (error) {
      console.error('Error fetching division data:', error);
    } finally {
      setIsLoadingTeachers(false);
      setIsLoadingMessages(false);
      setIsLoadingParents(false);
    }
  };

  const handleTeacherClick = async (teacher: PrincipalDivisionTeacher) => {
    try {
      setIsOpeningChat(true);
      
      // Check if thread exists with this teacher
      const checkResult = await messagingAPI.checkExistingThread([teacher.teacher_id], 'direct');
      
      if (checkResult.exists && checkResult.thread) {
        setSelectedThread(checkResult.thread);
      } else {
        // Create new thread
        const newThread = await messagingAPI.createThread(
          [teacher.teacher_id],
          'direct',
          `Chat with ${teacher.full_name}`,
          `Hello! I'm ${user?.full_name}. This is the start of our conversation.`
        );
        setSelectedThread(newThread);
      }
    } catch (error) {
      console.error('Error creating/finding thread:', error);
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleThreadClick = (thread: PrincipalDivisionThread) => {
    // Convert the thread format to match ChatThread interface
    const chatThread: ChatThread = {
      id: thread.thread_id,
      title: thread.thread_title,
      thread_type: thread.thread_type as 'direct' | 'group',
      participants: thread.participants?.map((p) => ({
        user_id: p.user_id,
        user: {
          id: p.user_id,
          full_name: p.full_name
        }
      })) || [],
      last_message: thread.messages && thread.messages.length > 0 ? [{
        id: thread.messages[0].message_id,
        content: thread.messages[0].content,
        created_at: thread.messages[0].created_at,
        sender_id: thread.messages[0].sender?.id || ''
      }] : undefined,
      created_at: thread.created_at,
      updated_at: thread.updated_at
    };
    setSelectedThread(chatThread);
  };

  const handleGroupClick = (thread: PrincipalDivisionThread) => {
    setSelectedGroup(thread);
    setIsGroupModalOpen(true);
  };

  const handleParentClick = async (parent: PrincipalDivisionParent) => {
    try {
      setIsOpeningChat(true);
      
      // Check if thread exists with this parent
      const checkResult = await messagingAPI.checkExistingThread([parent.id], 'direct');
      
      if (checkResult.exists && checkResult.thread) {
        setSelectedThread(checkResult.thread);
      } else {
        // Create new thread
        const newThread = await messagingAPI.createThread(
          [parent.id],
          'direct',
          `Chat with ${parent.name}`,
          `Hello! I'm ${user?.full_name}. This is the start of our conversation.`
        );
        setSelectedThread(newThread);
      }
    } catch (error) {
      console.error('Error creating/finding thread with parent:', error);
    } finally {
      setIsOpeningChat(false);
    }
  };

  const formatDivisionName = (division: PrincipalClassDivision) => {
    return `${division.class_level.name} ${division.division}`;
  };

  const getTeacherRole = (teacher: PrincipalDivisionTeacher) => {
    if (teacher.is_primary) return t('filterByDivision.classTeacher');
    return teacher.subject ? `${teacher.subject} ${t('filterByDivision.subjectTeacher')}` : t('filterByDivision.subjectTeacher');
  };

  const refreshData = async () => {
    if (selectedDivision) {
      await handleDivisionSelect(selectedDivision.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('filterByDivision.back')}
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  {t('filterByDivision.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('filterByDivision.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Class Division Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {t('filterByDivision.selectDivision')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDivisions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Select onValueChange={handleDivisionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filterByDivision.chooseClassDivision')} />
                </SelectTrigger>
                <SelectContent>
                  {classDivisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{formatDivisionName(division)}</span>
                        <Badge variant="secondary" className="ml-2">
                          {division.academic_year.year_name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex h-[calc(100vh-300px)] border rounded-lg overflow-hidden bg-card">
          {/* Left Panel - Teachers and Groups Tabs */}
          <div className="w-1/3 border-r flex flex-col bg-card">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {selectedDivision ? (
                    <>
                      <Users className="h-5 w-5" />
                      {formatDivisionName(selectedDivision)}
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      {t('filterByDivision.selectADivision')}
                    </>
                  )}
                </h2>
                {selectedDivision && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={isLoadingTeachers}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoadingTeachers && "animate-spin")} />
                  </Button>
                )}
              </div>
            </div>
            
            {selectedDivision ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{formatDivisionName(selectedDivision)}</h3>
                    <div className="flex items-center gap-2">
                      <RefreshCw 
                        className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => selectedDivision && handleDivisionSelect(selectedDivision.id)}
                      />
                      <Select value={viewType} onValueChange={(value: 'teachers' | 'groups' | 'parents') => setViewType(value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teachers">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {t('filterByDivision.teachers')} ({divisionTeachers?.length || 0})
                            </div>
                          </SelectItem>
                          <SelectItem value="groups">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              {t('filterByDivision.groups')} ({divisionThreads?.length || 0})
                            </div>
                          </SelectItem>
                          <SelectItem value="parents">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              {t('filterByDivision.parents')} ({divisionStudents?.reduce((total, student) => total + student.parents.length, 0) || 0})
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Teachers View */}
                {viewType === 'teachers' && (
                  <div className="flex-1 overflow-hidden">
                  {isLoadingTeachers ? (
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2 max-h-[calc(100vh-400px)]">
                        {divisionTeachers.map((teacher) => (
                          <div
                            key={teacher.teacher_id}
                            className={cn(
                              'p-3 border rounded-lg cursor-pointer transition-colors',
                              selectedThread?.participants?.some(p => p.user_id === teacher.teacher_id)
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50',
                              isOpeningChat && selectedThread?.participants?.some(p => p.user_id === teacher.teacher_id)
                                ? 'opacity-50 pointer-events-none'
                                : ''
                            )}
                            onClick={() => !isOpeningChat && handleTeacherClick(teacher)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{teacher.full_name}</h4>
                                  <Badge variant={teacher.is_primary ? 'default' : 'secondary'} className="text-xs">
                                    {teacher.is_primary ? t('filterByDivision.primary') : t('filterByDivision.subject')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {getTeacherRole(teacher)}
                                </p>
                                
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-xs text-muted-foreground">
                                    {teacher.phone_number}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  </div>
                )}
                
                {/* Groups View */}
                {viewType === 'groups' && (
                  <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2 max-h-[calc(100vh-400px)]">
                      {divisionThreads && divisionThreads.length > 0 ? (
                        divisionThreads.map((thread, index) => (
                          <div 
                            key={thread.thread_id || index} 
                            className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => handleGroupClick(thread)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{thread.thread_title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {thread.participants?.length || 0} {(thread.participants?.length || 0) !== 1 ? t('filterByDivision.participants') : t('filterByDivision.participant')}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {thread.thread_type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            {t('filterByDivision.noGroupThreads')}
                          </h3>
                          <p className="text-xs text-muted-foreground text-center">
                            {t('filterByDivision.noGroupThreadsFound')}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  </div>
                )}
                
                {/* Parents View */}
                {viewType === 'parents' && (
                  <div className="flex-1 overflow-hidden">
                  {isLoadingParents ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4 max-h-[calc(100vh-400px)]">
                        {divisionStudents && divisionStudents.length > 0 ? (
                          divisionStudents.map((student) => (
                            <div key={student.student.id} className="space-y-3">
                              {/* Student Header */}
                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg sticky top-0 z-10">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{student.student.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {t('filterByDivision.rollNo')}: {student.student.roll_number}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {student.parents.length} {student.parents.length !== 1 ? t('filterByDivision.parents') : t('filterByDivision.parent')}
                                </Badge>
                              </div>
                              
                              {/* Parents List - Scrollable */}
                              <div className="ml-4 space-y-2 max-h-96 overflow-y-auto">
                                {student.parents.map((parent) => (
                                  <div 
                                    key={parent.id}
                                    className={cn(
                                      "p-3 border rounded-lg cursor-pointer transition-colors hover:shadow-sm",
                                      selectedThread?.participants?.some(p => p.user_id === parent.id)
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'hover:bg-muted/50',
                                      isOpeningChat && selectedThread?.participants?.some(p => p.user_id === parent.id)
                                        ? 'opacity-50 pointer-events-none'
                                        : ''
                                    )}
                                    onClick={() => !isOpeningChat && handleParentClick(parent)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <UserCheck className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h4 className="font-medium text-sm truncate">{parent.name}</h4>
                                          <Badge variant={parent.is_primary_guardian ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                            {parent.relationship}
                                            {parent.is_primary_guardian && ` (${t('filterByDivision.primaryGuardian')})`}
                                          </Badge>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 flex-shrink-0" />
                                            <span className="text-xs text-muted-foreground truncate">
                                              {parent.phone_number}
                                            </span>
                                          </div>
                                          {parent.email && (
                                            <div className="flex items-center gap-2">
                                              <MessageCircle className="h-3 w-3 flex-shrink-0" />
                                              <span className="text-xs text-muted-foreground truncate">
                                                {parent.email}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <UserCheck className="h-8 w-8 text-muted-foreground mb-2" />
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              {t('filterByDivision.noParentsFound')}
                            </h3>
                            <p className="text-xs text-muted-foreground text-center">
                              {t('filterByDivision.noParentsLinked')}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('filterByDivision.selectDivisionToView')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Chat Detail */}
          <div className="flex-1 flex flex-col">
            {isOpeningChat ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="relative">
                    <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('filterByDivision.openingChat')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('filterByDivision.pleaseWait')}
                  </p>
                </div>
              </div>
            ) : selectedThread && user ? (
              <MessagePanel
                thread={selectedThread}
                currentUser={{ id: user.id, full_name: user.full_name }}
                onMessageSent={(message) => {
                  // Update the thread with the new message
                  setSelectedThread(prev => prev ? {
                    ...prev,
                    last_message: prev.last_message ? [...prev.last_message, message] : [message]
                  } : null);
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('filterByDivision.selectTeacherParentGroup')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('filterByDivision.chooseFromLeftPanel')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Group Details Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedGroup?.thread_title || t('filterByDivision.groupDetails')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-6">
              {/* Group Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedGroup.thread_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {t('filterByDivision.created')} {new Date(selectedGroup.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('filterByDivision.totalMessages')}:</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedGroup.messages?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t('filterByDivision.participants')}:</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedGroup.participants?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">{t('filterByDivision.participants')}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup.participants?.map((participant, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{participant.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {participant.user_role} • {participant.role}
                        </p>
                      </div>
                      {participant.role === 'admin' && (
                        <Badge variant="default" className="text-xs">{t('filterByDivision.admin')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Messages */}
              {selectedGroup.messages && selectedGroup.messages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">{t('filterByDivision.recentMessages')}</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGroup.messages.slice(0, 5).map((message, index) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">
                            {message.sender?.full_name || t('filterByDivision.unknown')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsGroupModalOpen(false)}
                >
                  {t('filterByDivision.close')}
                </Button>
                <Button
                  onClick={() => {
                    handleThreadClick(selectedGroup);
                    setIsGroupModalOpen(false);
                  }}
                >
                  {t('filterByDivision.openChat')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
