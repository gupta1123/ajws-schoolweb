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

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (threadId: string) => void;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
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
      setError('Failed to load parents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

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
          title: "Group Created Successfully!",
          description: `"${groupName.trim()}" group has been created with ${selectedParents.length} parent(s).`,
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
        throw new Error(response.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
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
    if (parent.linked_students.length === 0) return 'No students linked';
    
    const studentNames = parent.linked_students.map(student => student.student_name).join(', ');
    const className = parent.linked_students[0]?.teacher_assignments[0]?.class_name || 'Unknown Class';
    
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
                Create New Group
              </DialogTitle>
              <DialogDescription className="mt-1">
                Create a group chat with selected parents
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
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                placeholder="Enter group name (e.g., Grade 5A Parents)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Group Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                placeholder="Describe the purpose of this group"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                disabled={creating}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialMessage">Initial Message (Optional)</Label>
              <Textarea
                id="initialMessage"
                placeholder="Send a welcome message to the group"
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
              <Label>Select Parents ({selectedParents.length} selected)</Label>
              {selectedParents.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedParents([])}
                  disabled={creating}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents or students..."
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
                  <p className="text-sm text-muted-foreground">Loading parents...</p>
                </div>
              ) : filteredParents.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No parents found matching your search' : 'No parents available'}
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
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={creating || selectedParents.length === 0 || !groupName.trim()}
            className="min-w-[100px]"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Create Group
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
