"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  rejectionReason?: string | null;
  onConfirm: (content: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function EditMessageModal({ isOpen, onClose, originalContent, rejectionReason, onConfirm, isLoading }: EditMessageModalProps) {
  const [content, setContent] = useState(originalContent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(originalContent);
      setError(null);
    }
  }, [isOpen, originalContent]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }
    await onConfirm(content.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">Edit and Resend</h2>
          {rejectionReason && (
            <p className="mt-1 text-xs text-red-600">Rejected reason: {rejectionReason}</p>
          )}
        </div>
        <div className="p-4 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Update your message"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={submit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save & Resend'}</Button>
        </div>
      </div>
    </div>
  );
}


