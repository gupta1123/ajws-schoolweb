'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import { getTeacherLinkedParents, TeacherLinkedParent } from '@/lib/api/messages';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';

interface StartNewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParentSelected: (parent: TeacherLinkedParent) => void;
}

export function StartNewChatModal({ open, onOpenChange, onParentSelected }: StartNewChatModalProps) {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [filteredParents, setFilteredParents] = useState<TeacherLinkedParent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParents = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getTeacherLinkedParents(token, user?.id);

      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError(t('messages.unexpectedFormat', 'Unexpected response format'));
        return;
      }

      if (response.status === 'success' && 'data' in response && response.data && 'linked_parents' in response.data) {
        const linkedParents = response.data.linked_parents as TeacherLinkedParent[];
        setFilteredParents(linkedParents);
      } else {
        console.error('Unexpected response format:', response);
        setError(t('messages.fetchParentsFailed', 'Failed to fetch parents'));
      }
    } catch (error) {
      console.error('Error fetching teacher-linked parents:', error);
      setError(t('messages.fetchParentsFailed', 'Failed to fetch parents'));
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, t]);

  // Fetch linked parents when modal opens
  useEffect(() => {
    if (open && token && user?.id) {
      fetchParents();
    }
  }, [open, token, user?.id, fetchParents]);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If no search term, refetch all parents
      if (token && user?.id) {
        fetchParents();
      }
    } else {
      const filtered = filteredParents.filter(parent => {
        const parentName = parent.full_name.toLowerCase();
        const studentNames = parent.linked_students
          .map(student => student.student_name.toLowerCase())
          .join(' ');
        const searchLower = searchTerm.toLowerCase();

        return parentName.includes(searchLower) || studentNames.includes(searchLower);
      });
      setFilteredParents(filtered);
    }
  }, [searchTerm, filteredParents, token, user?.id, fetchParents]);

  const handleParentSelect = (parent: TeacherLinkedParent) => {
    onParentSelected(parent);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('messages.startNew.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('messages.startNew.searchPlaceholder')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Parents List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">{t('messages.loadingParents', 'Loading parents...')}</p>
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {searchTerm ? t('messages.noMatches', 'No matches found') : t('messages.noParents', 'No parents available')}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('messages.adjustSearch', 'Try adjusting your search terms') : t('messages.noLinkedParents', "You don't have any linked parents yet.")}
                </p>
              </div>
            ) : (
              filteredParents.map((parent) => (
                <div
                  key={parent.parent_id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleParentSelect(parent)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {parent.full_name}
                      </h4>
                      <div className="space-y-1 mt-1">
                        {parent.linked_students.map((student, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            <span className="font-medium">{student.student_name}</span>
                            {student.teacher_assignments[0]?.class_name && (
                              <span className="ml-2 text-xs">
                                • {student.teacher_assignments[0].class_name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {parent.chat_info.has_thread && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Previous chat available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
