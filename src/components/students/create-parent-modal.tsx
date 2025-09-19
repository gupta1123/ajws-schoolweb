// src/components/students/create-parent-modal.tsx

'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Phone, Mail, Lock, X, Loader2, CheckCircle } from 'lucide-react';
import { parentServices, CreateParentRequest } from '@/lib/api/parents';
import { useAuth } from '@/lib/auth/context';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

interface CreateParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (parentId: string) => void;
  studentAdmissionNumber?: string;
  relationship?: string;
}

export function CreateParentModal({ isOpen, onClose, onSuccess, studentAdmissionNumber, relationship }: CreateParentModalProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    initial_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const parentData: CreateParentRequest = {
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        ...(formData.email.trim() && { email: formData.email.trim() }),
        initial_password: formData.initial_password.trim(),
        ...(studentAdmissionNumber && relationship && {
          student_details: [{
            admission_number: studentAdmissionNumber,
            relationship: relationship,
            is_primary_guardian: true
          }]
        })
      };

      const response = await parentServices.createParent(parentData, token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        throw new Error('Unexpected response format from API');
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        throw new Error(response.message || 'Failed to create parent');
      }

      // Handle successful response
      if ('status' in response && response.status === 'success') {
        toast({
          title: t('timetable.toasts.success'),
          description: t('parents.created'),
        });

        // Reset form
        setFormData({ full_name: '', phone_number: '', email: '', initial_password: '' });

        // Call success callback if provided
        if (onSuccess && response.data?.parent?.id) {
          onSuccess(response.data.parent.id);
        }

        onClose();
      } else {
        throw new Error('Failed to create parent');
      }
    } catch (err) {
      console.error('Error creating parent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create parent';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ full_name: '', phone_number: '', email: '', initial_password: '' });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('parents.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('parents.createSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              {t('settings.fullName')} *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder={t('parents.enterFullName')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-sm font-medium">
              {t('auth.phoneNumber')} *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder={t('parents.enterPhone')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t('parents.emailOptional')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('parents.enterEmail')}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_password" className="text-sm font-medium">
              {t('parents.initialPassword')} *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="initial_password"
                name="initial_password"
                type="password"
                value={formData.initial_password}
                onChange={handleInputChange}
                placeholder={t('parents.enterInitialPassword')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.full_name || !formData.phone_number || !formData.initial_password}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('parents.creating')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('parents.createParent')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
