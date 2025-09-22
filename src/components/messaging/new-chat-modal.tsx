// src/components/messaging/new-chat-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Users, MessageCircle, Plus } from 'lucide-react';
import { messagingAPI, ChatThread, Parent, ClassDivision } from '@/lib/api/messaging';
import { useI18n } from '@/lib/i18n/context';


interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadCreated: (thread: ChatThread) => void;
  currentUser: { id: string; full_name: string };
}

export function NewChatModal({
  isOpen,
  onClose,
  onThreadCreated,
  currentUser
}: NewChatModalProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<ClassDivision[]>([]);
  const [linkedParents, setLinkedParents] = useState<Parent[]>([]);
  const [divisionParents, setDivisionParents] = useState<Parent[]>([]);
  const [principal, setPrincipal] = useState<{ id: string; full_name: string } | null>(null);
  const [classes, setClasses] = useState<ClassDivision[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'classes' | 'contacts'>('classes');

  // Fetch teacher's assigned classes
  useEffect(() => {
    if (isOpen) {
      fetchAssignedClasses();
      setCurrentStep('classes');
    }
  }, [isOpen]);

  // Fetch parents when classes are selected and user proceeds to contacts
  useEffect(() => {
    if (currentStep === 'contacts' && selectedClasses.length > 0) {
      fetchAvailableUsers();
    }
  }, [currentStep, selectedClasses]);

  const fetchAssignedClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const classes = await messagingAPI.getAssignedClasses();
      setClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setIsLoadingParents(true);
      
      // Step 1: Fetch linked parents and principal for each selected class
      const allLinkedParents: Parent[] = [];
      const parentMap = new Map<string, Parent>();
      
      for (const selectedClass of selectedClasses) {
        try {
          const linkedData = await messagingAPI.getLinkedParents(selectedClass.class_division_id);
          
          // Add linked parents for this class, avoiding duplicates
          linkedData.linked_parents.forEach(parent => {
            if (!parentMap.has(parent.id)) {
              parentMap.set(parent.id, parent);
              allLinkedParents.push(parent);
            }
          });
          
          // Set principal (only need to do this once)
          if (!principal) {
            setPrincipal(linkedData.principal);
          }
        } catch (error) {
          console.error(`Error fetching linked parents for division ${selectedClass.class_division_id}:`, error);
        }
      }
      
      setLinkedParents(allLinkedParents);
      
      // Step 2: Fetch parents from selected class divisions
      const allDivisionParents: Parent[] = [];
      for (const selectedClass of selectedClasses) {
        try {
          const divisionParents = await messagingAPI.getParentsByDivision(selectedClass.class_division_id);
          allDivisionParents.push(...divisionParents);
        } catch (error) {
          console.error(`Error fetching parents for division ${selectedClass.class_division_id}:`, error);
        }
      }
      
      // Remove duplicates based on parent ID
      const uniqueDivisionParents = allDivisionParents.filter((parent, index, self) => 
        index === self.findIndex(p => p.id === parent.id)
      );
      
      setDivisionParents(uniqueDivisionParents);
    } catch (error) {
      console.error('Error fetching available users:', error);
    } finally {
      setIsLoadingParents(false);
    }
  };

  const handleCreateThread = async (parent: Parent) => {
    if (isCreating) return;

    try {
      setIsCreating(true);

      // First check if thread already exists
      const checkResult = await messagingAPI.checkExistingThread([parent.id], 'direct');
      
      if (checkResult.exists && checkResult.thread) {
        // Thread exists, use it
        onThreadCreated(checkResult.thread);
        onClose();
        return;
      }

      // Create new thread
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
      console.error('Error creating thread:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClassToggle = (classItem: ClassDivision) => {
    setSelectedClasses(prev => {
      const isSelected = prev.some(c => c.class_division_id === classItem.class_division_id);
      if (isSelected) {
        return prev.filter(c => c.class_division_id !== classItem.class_division_id);
      } else {
        return [...prev, classItem];
      }
    });
  };

  const handleProceedToContacts = () => {
    if (selectedClasses.length > 0) {
      setCurrentStep('contacts');
    }
  };

  const handleBackToClasses = () => {
    setCurrentStep('classes');
  };

  // Combine all available contacts
  const allContacts = [
    ...linkedParents.map(p => ({ ...p, type: 'linked' as const })),
    ...divisionParents.map(p => ({ ...p, type: 'division' as const })),
    ...(principal ? [{ 
      id: principal.id, 
      name: principal.full_name, 
      students: [], 
      type: 'principal' as const 
    }] : [])
  ];

  const filteredContacts = allContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.students?.some(s => 
      s.student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const resetModal = () => {
    setSearchQuery('');
    setSelectedClasses([]);
    setLinkedParents([]);
    setDivisionParents([]);
    setPrincipal(null);
    setIsCreating(false);
    setCurrentStep('classes');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
{t('messaging.startNewChat')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "px-2 py-1 rounded-full text-xs",
              currentStep === 'classes' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              1. {t('messaging.selectClasses')}
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs",
              currentStep === 'contacts' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2. {t('messaging.selectContacts')}
            </div>
          </div>

          {/* Step 1: Class Selection */}
          {currentStep === 'classes' && (
            <div>
              <label className="text-sm font-medium mb-2 block">{t('messaging.selectClassesDesc')}</label>
              {isLoadingClasses ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.class_division_id}
                      onClick={() => handleClassToggle(classItem)}
                      className={cn(
                        "p-3 text-left rounded-lg border transition-colors",
                        "hover:bg-muted/50",
                        selectedClasses.some(c => c.class_division_id === classItem.class_division_id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="font-medium">{classItem.class_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {classItem.subject} {classItem.is_primary && '(Primary)'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
{t('messaging.cancel')}
                </Button>
                <Button 
                  onClick={handleProceedToContacts} 
                  disabled={selectedClasses.length === 0}
                >
{t('messaging.continue')} ({selectedClasses.length} selected)
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Selection */}
          {currentStep === 'contacts' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{t('messaging.selectContacts')}</label>
                <Button variant="ghost" size="sm" onClick={handleBackToClasses}>
{t('messaging.backToClasses')}
                </Button>
              </div>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('messaging.searchContacts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoadingParents ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {/* Linked Parents Section */}
                    {linkedParents.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
{t('messaging.linkedParents')} ({linkedParents.length})
                        </div>
                        {filteredContacts.filter(c => c.type === 'linked').map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => handleCreateThread(contact as Parent)}
                            disabled={isCreating}
                            className={cn(
                              "w-full p-3 text-left rounded-lg border transition-colors",
                              "hover:bg-muted/50",
                              isCreating && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700">
                                  {contact.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {contact.students?.map(s => s.student.name).join(', ') || 'Linked Parent'}
                                </div>
                              </div>
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Principal Section */}
                    {principal && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
{t('messaging.principal')}
                        </div>
                        <button
                          onClick={() => handleCreateThread({ id: principal.id, name: principal.full_name, students: [] })}
                          disabled={isCreating}
                          className={cn(
                            "w-full p-3 text-left rounded-lg border transition-colors",
                            "hover:bg-muted/50",
                            isCreating && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-700">
                                {principal.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{principal.full_name}</div>
                              <div className="text-sm text-muted-foreground">Principal</div>
                            </div>
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Division Parents Section */}
                    {divisionParents.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                          Parents from Selected Classes ({divisionParents.length})
                        </div>
                        {filteredContacts.filter(c => c.type === 'division').map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => handleCreateThread(contact as Parent)}
                            disabled={isCreating}
                            className={cn(
                              "w-full p-3 text-left rounded-lg border transition-colors",
                              "hover:bg-muted/50",
                              isCreating && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-700">
                                  {contact.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {contact.students?.map(s => s.student.name).join(', ') || 'Class Parent'}
                                </div>
                              </div>
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {filteredContacts.length === 0 && !isLoadingParents && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? t('messaging.noContactsFound') : t('messaging.noContacts')}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
