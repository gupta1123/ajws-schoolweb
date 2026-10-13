// src/components/students/create-parent-modal.tsx
//
// Quick "new parent" form, opened from the Link parent panel. When an
// admission number is passed the new parent is linked to that student at once.

'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldShell, TextField } from '@/components/staff/staff-fields';
import { generatePassword } from '@/components/staff/staff-form';
import { parentServices, type CreateParentRequest } from '@/lib/api/parents';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

interface CreateParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (parentId: string) => void;
  studentAdmissionNumber?: string;
  relationship?: string;
}

const empty = { full_name: '', phone_number: '', email: '', initial_password: '' };

export function CreateParentModal({ isOpen, onClose, onSuccess, studentAdmissionNumber, relationship }: CreateParentModalProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof empty, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const errors = {
    full_name: form.full_name.trim() ? '' : t('parents.errors.name', 'Enter the parent’s name.'),
    phone_number: form.phone_number.replace(/\D/g, '').length >= 10 ? '' : t('parents.errors.phone', 'Enter a 10-digit phone number.'),
    email: form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? t('staff.form.errors.email', 'Enter a valid email address.') : '',
    initial_password: form.initial_password.length >= 6 ? '' : t('staff.form.errors.password', 'Use at least 6 characters.'),
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (m: string) => (touched && m ? m : undefined);

  const close = () => {
    if (saving) return;
    setForm(empty);
    setTouched(false);
    setError(null);
    setShowPassword(false);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    setError(null);
    try {
      const body: CreateParentRequest = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        initial_password: form.initial_password,
        ...(studentAdmissionNumber && relationship && { student_details: [{ admission_number: studentAdmissionNumber, relationship, is_primary_guardian: true }] }),
      };
      const r = await parentServices.createParent(body, token);
      if (r instanceof Blob) throw new Error();
      if ('status' in r && r.status === 'error') throw new Error(r.message);
      if (!('status' in r) || r.status !== 'success') throw new Error();
      toast({ title: t('parents.created', 'Parent created successfully'), variant: 'success' });
      const id = r.data?.parent?.id;
      setForm(empty);
      setTouched(false);
      setShowPassword(false);
      onClose();
      if (id) onSuccess?.(id);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('parents.createFailed', 'Could not create the parent'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('parents.createTitle', 'Create Parent')}</DialogTitle>
          <DialogDescription>{t('parents.createSubtitle', 'Add a parent account. They sign in with their phone number.')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField id="np-name" label={t('settings.fullName', 'Full Name')} value={form.full_name} onChange={(v) => set('full_name', v)} error={show(errors.full_name)} autoFocus placeholder={t('parents.enterFullName', 'Enter full name')} />
          <TextField id="np-phone" type="tel" label={t('auth.phoneNumber', 'Phone Number')} value={form.phone_number} onChange={(v) => set('phone_number', v)} error={show(errors.phone_number)} placeholder={t('parents.enterPhone', 'Enter phone number')} />
          <TextField id="np-email" type="email" optional label={t('staff.form.labels.email', 'Email')} value={form.email} onChange={(v) => set('email', v)} error={show(errors.email)} />
          <FieldShell label={t('parents.initialPassword', 'Initial Password')} htmlFor="np-password" error={show(errors.initial_password)}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="np-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.initial_password}
                  onChange={(e) => set('initial_password', e.target.value)}
                  className="pr-10"
                  aria-invalid={touched && Boolean(errors.initial_password)}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-9 text-muted-foreground" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? t('staff.form.hidePassword', 'Hide password') : t('staff.form.showPassword', 'Show password')}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  set('initial_password', generatePassword());
                  setShowPassword(true);
                }}
              >
                <Shuffle />
                {t('staff.form.generate', 'Generate')}
              </Button>
            </div>
          </FieldShell>

          {error && (
            <p role="alert" className="text-sm text-tone-danger">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close} disabled={saving}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? t('parents.creating', 'Creating...') : t('parents.createParent', 'Create Parent')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
