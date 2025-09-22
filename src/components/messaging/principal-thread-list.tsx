// src/components/messaging/principal-thread-list.tsx

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, MessageCircle, Users, GraduationCap, Phone, Mail, MessageSquare } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { 
  principalMessagingServices, 
  PrincipalClassDivision, 
  PrincipalDivisionTeacher,
  PrincipalDivisionMessage
} from '@/lib/api/principal-messaging';
import { messagingAPI, ChatThread, getThreadTitle, getLastMessagePreview, formatMessageTime } from '@/lib/api/messaging';

interface PrincipalThreadListProps {
  selectedThread: ChatThread | null;
  onThreadSelect: (thread: ChatThread) => void;
  currentUserId: string;
  isConnected: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
}

export function PrincipalThreadList({
  selectedThread,
  onThreadSelect,
  currentUserId,
  isConnected,
  connectionStatus
}: PrincipalThreadListProps) {
  const { t } = useI18n();
  const [classDivisions, setClassDivisions] = useState<PrincipalClassDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<PrincipalClassDivision | null>(null);
  const [divisionTeachers, setDivisionTeachers] = useState<PrincipalDivisionTeacher[]>([]);
  const [divisionMessages, setDivisionMessages] = useState<PrincipalDivisionMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  // Fetch class divisions on component mount
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
    
    try {
      setIsLoadingTeachers(true);
      setIsLoadingThreads(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await principalMessagingServices.getDivisionMessages(divisionId, token);
      setDivisionTeachers(response.data.teachers);
      setDivisionMessages(response.data.messages || []);
      
      // Create threads for each teacher
      const teacherThreads: ChatThread[] = [];
      for (const teacher of response.data.teachers) {
        try {
          // Check if thread exists with this teacher
          const checkResult = await messagingAPI.checkExistingThread([teacher.teacher_id], 'direct');
          
          if (checkResult.exists && checkResult.thread) {
            teacherThreads.push(checkResult.thread);
          }
        } catch (error) {
          console.error('Error checking thread for teacher:', teacher.full_name, error);
        }
      }
      
      setThreads(teacherThreads);
    } catch (error) {
      console.error('Error fetching division data:', error);
    } finally {
      setIsLoadingTeachers(false);
      setIsLoadingThreads(false);
    }
  };

  const handleTeacherClick = async (teacher: PrincipalDivisionTeacher) => {
    try {
      // Check if thread exists with this teacher
      const checkResult = await messagingAPI.checkExistingThread([teacher.teacher_id], 'direct');
      
      if (checkResult.exists && checkResult.thread) {
        onThreadSelect(checkResult.thread);
      } else {
        // Create new thread
        const newThread = await messagingAPI.createThread(
          [teacher.teacher_id],
          'direct',
          `Chat with ${teacher.full_name}`,
          `Hello! This is the start of our conversation.`
        );
        onThreadSelect(newThread);
        
        // Add to threads list
        setThreads(prev => [newThread, ...prev]);
      }
    } catch (error) {
      console.error('Error creating/finding thread:', error);
    }
  };

  const formatDivisionName = (division: PrincipalClassDivision) => {
    return `${division.class_level.name} ${division.division}`;
  };

  const getTeacherRole = (teacher: PrincipalDivisionTeacher) => {
    if (teacher.is_primary) return t('principalMessaging.classTeacher');
    return teacher.subject ? `${teacher.subject} ${t('principalMessaging.teacher')}` : t('principalMessaging.subjectTeacher');
  };

  const refreshThreads = async () => {
    if (selectedDivision) {
      await handleDivisionSelect(selectedDivision.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Class Division Filter */}
      <div className="p-4 border-b">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{t('principalMessaging.classDivisions')}</h2>
            </div>
          
          {isLoadingDivisions ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select onValueChange={handleDivisionSelect}>
              <SelectTrigger>
                <SelectValue placeholder={t('principalMessaging.chooseDivision')} />
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
        </div>
      </div>

      {/* Teachers and Groups Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="teachers" className="h-full flex flex-col">
          <div className="p-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('principalMessaging.teachers')} ({divisionTeachers.length})
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('principalMessaging.groups')} ({divisionMessages.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="teachers" className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('principalMessaging.teachers')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshThreads}
                  disabled={!selectedDivision || isLoadingTeachers}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoadingTeachers && "animate-spin")} />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoadingTeachers ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : selectedDivision ? (
                <div className="p-4 space-y-2">
                  {divisionTeachers.map((teacher) => {
                    const thread = threads.find(t => 
                      t.participants.some(p => p.user_id === teacher.teacher_id)
                    );
                    
                    return (
                      <div
                        key={teacher.teacher_id}
                        className={cn(
                          'p-3 border rounded-lg cursor-pointer transition-colors',
                          selectedThread?.id === thread?.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => handleTeacherClick(teacher)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{teacher.full_name}</h4>
                              <Badge variant={teacher.is_primary ? 'default' : 'secondary'} className="text-xs">
                                {teacher.is_primary ? t('principalMessaging.primary') : t('principalMessaging.subject')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getTeacherRole(teacher)}
                            </p>
                            
                            {/* Contact Info */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">
                                  {teacher.phone_number}
                                </span>
                              </div>
                              {teacher.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {teacher.email}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Last Message Preview */}
                            {thread && thread.last_message && thread.last_message.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground truncate">
                                  {getLastMessagePreview(thread)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatMessageTime(thread.last_message[0].created_at)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('principalMessaging.selectDivisionToViewTeachers')}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="groups" className="flex-1 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-md font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('principalMessaging.groupsCreated')}
              </h3>
            </div>
            
            <ScrollArea className="flex-1">
              {selectedDivision ? (
                <div className="p-4 space-y-2">
                  {divisionMessages.length > 0 ? (
                    divisionMessages.map((message, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{message.sender?.full_name || t('principalMessaging.unknown')}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {message.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t('principalMessaging.noGroupMessagesFound')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('principalMessaging.selectDivisionToViewGroups')}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connection Status */}
    </div>
  );
}
