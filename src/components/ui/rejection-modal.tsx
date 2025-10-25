'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Reject message',
  description = 'Please provide a reason for rejecting this message.'
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = reason.trim().length > 2;

  const handleConfirm = async () => {
    setTouched(true);
    if (!valid) return;
    await onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setReason('');
      setTouched(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Enter rejection reason..."
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !valid}
          />
          {touched && !valid && (
            <p className="text-xs text-destructive">Reason must be at least 3 characters.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!valid || isLoading}>Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


