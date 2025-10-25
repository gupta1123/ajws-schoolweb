// src/components/messaging/principal-new-chat-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Search, Users, Phone, GraduationCap, MessageCircle, ArrowLeft, UserCheck, X } from 'lucide-react';
import { principalMessagingServices, PrincipalTeacher, PrincipalClassDivision } from '@/lib/api/principal-messaging';
import { messagingAPI, ChatThread } from '@/lib/api/messaging';
import { useI18n } from '@/lib/i18n/context';
import type { Parent } from '@/lib/api/messaging';

interface PrincipalNewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadCreated: (thread: ChatThread) => void;
  currentUser: { id: string; full_name: string };
}

export function PrincipalNewChatModal({
  isOpen,
  onClose,
  onThreadCreated,
  currentUser
}: PrincipalNewChatModalProps) {
  const { t } = useI18n();
  type Step = 'recipientType' | 'teachers' | 'parentsSelectClass' | 'parentsSelectParent';
  const [step, setStep] = useState<Step>('recipientType');
  const [teachers, setTeachers] = useState<PrincipalTeacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<PrincipalTeacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<PrincipalTeacher | null>(null);
  const [classDivisions, setClassDivisions] = useState<PrincipalClassDivision[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<PrincipalClassDivision[]>([]);
  const [divisionSearch, setDivisionSearch] = useState('');
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<PrincipalClassDivision | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  // Fetch initial data when modal opens or resets
  useEffect(() => {
    if (isOpen) {
      setStep('recipientType');
      setSearchQuery('');
      setDivisionSearch('');
      setParentSearch('');
      // Lazy-load; we will fetch when the user chooses a path
    }
  }, [isOpen]);

  // Filter teachers based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = teachers.filter(teacher =>
        teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.phone_number.includes(searchQuery)
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchQuery, teachers]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await principalMessagingServices.getTeachersWithAssignments(token);
      setTeachers(response.data.teachers);
      setFilteredTeachers(response.data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      setIsLoadingDivisions(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await principalMessagingServices.getClassDivisions(token);
      setClassDivisions(response.data.class_divisions);
      setFilteredDivisions(response.data.class_divisions);
    } catch (error) {
      console.error('Error fetching class divisions:', error);
    } finally {
      setIsLoadingDivisions(false);
    }
  };

  const fetchParentsForDivision = async (divisionId: string) => {
    try {
      setIsLoadingParents(true);
      const loadedParents = await messagingAPI.getParentsByDivision(divisionId);
      setParents(loadedParents);
      setFilteredParents(loadedParents);
    } catch (error) {
      console.error('Error fetching parents by division:', error);
      setParents([]);
      setFilteredParents([]);
    } finally {
      setIsLoadingParents(false);
    }
  };

  const handleTeacherSelect = async (teacher: PrincipalTeacher) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setSelectedTeacher(teacher);

      // First check if thread already exists
      const checkResult = await messagingAPI.checkExistingThread([teacher.teacher_id], 'direct');
      
      if (checkResult.exists && checkResult.thread) {
        // Thread exists, use it
        onThreadCreated(checkResult.thread);
        onClose();
        return;
      }

      // Create new thread
      const newThread = await messagingAPI.createThread(
        [teacher.teacher_id],
        'direct',
        `Chat with ${teacher.full_name}`,
        `Hello! I'm ${currentUser.full_name}. This is the start of our conversation.`
      );

      onThreadCreated(newThread);
      onClose();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setIsCreating(false);
      setSelectedTeacher(null);
    }
  };

  const handleParentSelect = async (parent: Parent) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      // Check if thread already exists
      const checkResult = await messagingAPI.checkExistingThread([parent.id], 'direct');
      if (checkResult.exists && checkResult.thread) {
        onThreadCreated(checkResult.thread);
        onClose();
        return;
      }

      const studentNames = parent.students.map(s => s.student.name).join(', ');
      const newThread = await messagingAPI.createThread(
        [parent.id],
        'direct',
        `Chat with ${parent.name}`,
        `Hello! I'm ${currentUser.full_name}. This is the start of our conversation.`
      );

      onThreadCreated(newThread);
      onClose();
    } catch (error) {
      console.error('Error creating thread with parent:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const divisionDisplayName = (division: PrincipalClassDivision) => {
    return `${division.class_level.name} - ${division.division}`;
  };

  // Filter divisions
  useEffect(() => {
    if (divisionSearch.trim()) {
      const q = divisionSearch.toLowerCase();
      setFilteredDivisions(
        classDivisions.filter(d =>
          divisionDisplayName(d).toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredDivisions(classDivisions);
    }
  }, [divisionSearch, classDivisions]);

  // Filter parents
  useEffect(() => {
    if (parentSearch.trim()) {
      const q = parentSearch.toLowerCase();
      setFilteredParents(
        parents.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.students.some(s => s.student.name.toLowerCase().includes(q) || s.student.roll_number.toLowerCase().includes(q))
        )
      );
    } else {
      setFilteredParents(parents);
    }
  }, [parentSearch, parents]);

  const getTeacherRole = (teacher: PrincipalTeacher) => {
    if (teacher.summary.primary_teacher_for > 0) return t('principalMessaging.classTeacher');
    if (teacher.summary.subject_teacher_for > 0) return t('principalMessaging.subjectTeacher');
    return t('principalMessaging.teacher');
  };

  const getTeacherClasses = (teacher: PrincipalTeacher) => {
    const classes = [];
    if (teacher.assignments.primary_classes.length > 0) {
      classes.push(...teacher.assignments.primary_classes.map(a => a.class_name));
    }
    if (teacher.assignments.subject_teacher_assignments.length > 0) {
      classes.push(...teacher.assignments.subject_teacher_assignments.map(a => a.class_name));
    }
    return [...new Set(classes)]; // Remove duplicates
  };

  const getTeacherSubjects = (teacher: PrincipalTeacher) => {
    return teacher.summary.subjects_taught;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {t('principalMessaging.startNewChat')}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label={t('common.close', 'Close')}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Step content */}
          {step === 'recipientType' && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={async () => {
                  setStep('teachers');
                  if (teachers.length === 0) await fetchTeachers();
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">{t('principalMessaging.teachers', 'Teachers')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t('principalMessaging.startChatWithTeacher', 'Find and chat with any teacher')}</p>
              </div>

              <div
                className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={async () => {
                  setStep('parentsSelectClass');
                  if (classDivisions.length === 0) await fetchDivisions();
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">{t('principalMessaging.parents', 'Parents')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t('principalMessaging.chooseClassToSeeParents', 'Choose a class to see parents')}</p>
              </div>
            </div>
          )}

          {step === 'teachers' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setStep('recipientType')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('principalMessaging.searchTeachers')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => (
                          <div
                            key={teacher.teacher_id}
                            className={cn(
                              'p-4 border rounded-lg cursor-pointer transition-colors',
                              selectedTeacher?.teacher_id === teacher.teacher_id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            )}
                            onClick={() => handleTeacherSelect(teacher)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium truncate">{teacher.full_name}</h4>
                                      <Badge variant={teacher.summary.primary_teacher_for > 0 ? 'default' : 'secondary'}>
                                        {getTeacherRole(teacher)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-13">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span className="text-xs text-muted-foreground">
                                      {teacher.phone_number}
                                    </span>
                                  </div>
                                </div>

                                <div className="ml-13 mt-2 space-y-1">
                                  {getTeacherClasses(teacher).length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    <span className="text-xs text-muted-foreground">
                                      {t('principalMessaging.classes')}: {getTeacherClasses(teacher).join(', ')}
                                    </span>
                                  </div>
                                  )}
                                  {getTeacherSubjects(teacher).length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span className="text-xs text-muted-foreground">
                                        {t('principalMessaging.subjects')}: {getTeacherSubjects(teacher).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="ml-13 mt-2 flex gap-2">
                                  {teacher.summary.primary_teacher_for > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {teacher.summary.primary_teacher_for} {t('principalMessaging.primary')}
                                    </Badge>
                                  )}
                                  {teacher.summary.subject_teacher_for > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {teacher.summary.subject_teacher_for} {t('principalMessaging.subject')}
                                    </Badge>
                                  )}
                                  {teacher.summary.total_classes === 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {t('principalMessaging.noAssignments')}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="ml-4">
                                <Button
                                  size="sm"
                                  disabled={isCreating}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTeacherSelect(teacher);
                                  }}
                                >
                                  {isCreating && selectedTeacher?.teacher_id === teacher.teacher_id ? (
                                    t('principalMessaging.creating')
                                  ) : (
                                    t('principalMessaging.startChat')
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {t('principalMessaging.noTeachersFound')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {searchQuery ? t('principalMessaging.tryAdjustingSearch') : t('principalMessaging.noTeachersAvailable')}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {step === 'parentsSelectClass' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setStep('recipientType')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('principalMessaging.searchClasses', 'Search classes')}
                    value={divisionSearch}
                    onChange={(e) => setDivisionSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoadingDivisions ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredDivisions.length > 0 ? (
                        filteredDivisions.map((division) => (
                          <div
                            key={division.id}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={async () => {
                              setSelectedDivision(division);
                              setStep('parentsSelectParent');
                              await fetchParentsForDivision(division.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{divisionDisplayName(division)}</h4>
                                <p className="text-xs text-muted-foreground">{division.academic_year.year_name}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-muted-foreground py-8">
                          {t('principalMessaging.noClassesFound', 'No classes found')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {step === 'parentsSelectParent' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setStep('parentsSelectClass')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('principalMessaging.searchParents', 'Search parents or students')}
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoadingParents ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {filteredParents.length > 0 ? (
                        filteredParents.map((parent) => (
                          <div
                            key={parent.id}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleParentSelect(parent)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{parent.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {t('principalMessaging.parentsOf', 'Parent of')}: {parent.students.map(s => s.student.name).join(', ')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <Button
                                  size="sm"
                                  disabled={isCreating}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleParentSelect(parent);
                                  }}
                                >
                                  {isCreating ? (
                                    t('principalMessaging.creating')
                                  ) : (
                                    t('principalMessaging.startChat')
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {t('principalMessaging.noParentsFound', 'No parents found')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t('principalMessaging.tryAdjustingSearch', 'Try adjusting your search')}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
