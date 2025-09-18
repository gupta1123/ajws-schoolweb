// src/components/messages/create-group-modal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  User, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  getTeacherLinkedParents, 
  TeacherLinkedParent,
  startConversation,
  StartConversationPayload
} from '@/lib/api/messages';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (threadId: string) => void;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [parents, setParents] = useState<TeacherLinkedParent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedParents = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getTeacherLinkedParents(token);

      if (response instanceof Blob) {
        throw new Error('Unexpected response format');
      }

      if (response.status === 'success' && 'data' in response && response.data && 'linked_parents' in response.data) {
        const linkedParents = response.data.linked_parents as TeacherLinkedParent[];
        setParents(linkedParents);
      } else {
        throw new Error('Failed to fetch parents');
      }
    } catch (error) {
      console.error('Error fetching linked parents:', error);
      setError(t('messages.loadParentsFailed'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  // Fetch linked parents when modal opens
  useEffect(() => {
    if (open && token) {
      fetchLinkedParents();
    }
  }, [open, token, fetchLinkedParents]);

  const handleParentToggle = (parentId: string) => {
    setSelectedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId) 
        : [...prev, parentId]
    );
  };

  const handleCreateGroup = async () => {
    if (!token || selectedParents.length === 0 || !groupName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const payload: StartConversationPayload = {
        participants: selectedParents,
        message_content: initialMessage.trim() || 'Hello! Welcome to the group.',
        thread_type: 'group',
        title: groupName.trim()
      };

      const response = await startConversation(payload, token);
      
      if (response instanceof Blob) {
        throw new Error('Unexpected response format');
      }
      
      if (response.status === 'success' && 'data' in response && response.data && 'thread' in response.data) {
        const threadData = response.data as unknown as { thread: { id: string } };
        const threadId = threadData.thread.id;
        
        // Show success toast
        toast({
          title: t('messages.groupCreatedTitle'),
          description: t('messages.groupCreatedDesc'),
          variant: "success"
        });
        
        // Call the success callback
        onGroupCreated(threadId);
        
        // Reset form
        setGroupName('');
        setGroupDescription('');
        setInitialMessage('');
        setSelectedParents([]);
        setSearchTerm('');
        
        // Close modal
        onOpenChange(false);
      } else {
        throw new Error(response.message || t('messages.createGroupFailed'));
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError(t('messages.createGroupFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setGroupName('');
      setGroupDescription('');
      setInitialMessage('');
      setSelectedParents([]);
      setSearchTerm('');
      setError(null);
      onOpenChange(false);
    }
  };

  const filteredParents = parents.filter(parent => 
    parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.linked_students.some(student => 
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStudentInfo = (parent: TeacherLinkedParent) => {
    if (parent.linked_students.length === 0) return t('messages.createGroup.noStudentsLinked');
    
    const studentNames = parent.linked_students.map(student => student.student_name).join(', ');
    const className = parent.linked_students[0]?.teacher_assignments[0]?.class_name || t('messages.createGroup.unknownClass');
    
    return `${studentNames} (${className})`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('messages.createGroup.title')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('messages.createGroup.subtitle')}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-hidden flex flex-col gap-4 py-4">
          {/* Group Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">{t('messages.createGroup.groupName')}</Label>
              <Input
                id="groupName"
                placeholder={t('messages.createGroup.groupNamePlaceholder')}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupDescription">{t('messages.createGroup.groupDesc')}</Label>
              <Textarea
                id="groupDescription"
                placeholder={t('messages.createGroup.groupDescPlaceholder')}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                disabled={creating}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialMessage">{t('messages.createGroup.initialMessage')}</Label>
              <Textarea
                id="initialMessage"
                placeholder={t('messages.createGroup.initialMessagePlaceholder')}
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                disabled={creating}
                rows={2}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Parent Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('messages.createGroup.selectParents')} ({selectedParents.length} {t('messages.createGroup.selected')})</Label>
              {selectedParents.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedParents([])}
                  disabled={creating}
                >
                  {t('messages.createGroup.clearAll')}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('messages.createGroup.searchParentsPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={creating}
              />
            </div>

            {/* Parents List */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('messages.createGroup.loadingParents')}</p>
                </div>
              ) : filteredParents.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? t('messages.createGroup.noParentsMatch') : t('messages.createGroup.noParents')}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredParents.map(parent => (
                    <div 
                      key={parent.parent_id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedParents.includes(parent.parent_id) ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleParentToggle(parent.parent_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          {selectedParents.includes(parent.parent_id) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium truncate">{parent.full_name}</h4>
                            <span className="text-xs text-muted-foreground">
                              {parent.phone_number}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {getStudentInfo(parent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            {t('messages.createGroup.cancel')}
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={creating || selectedParents.length === 0 || !groupName.trim()}
            className="min-w-[100px]"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('messages.createGroup.creating')}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {t('messages.createGroup.createGroup')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
