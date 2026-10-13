// src/components/staff/staff-password-dialog.tsx
//
// Admin reset of a staff member's login password. The new password is shown
// (and copyable) so it can be handed over.

'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { passwordServices } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { generatePassword } from '@/components/staff/staff-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  staffName: string;
}

export function StaffPasswordDialog({ open, onOpenChange, userId, staffName }: Props) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword(generatePassword());
      setDone(false);
      setCopied(false);
    }
  }, [open]);

  const tooShort = password.length < 6;

  const save = async () => {
    if (!token || !userId || tooShort) return;
    setSaving(true);
    const ok = await passwordServices.resetPassword(token, userId, password);
    setSaving(false);
    if (ok) {
      setDone(true);
      toast({ title: t('staff.password.updated', 'Password updated'), variant: 'success' });
    } else {
      toast({ title: t('staff.password.failed', 'Could not update the password'), variant: 'error' });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('staff.password.title', 'Reset password')}</DialogTitle>
          <DialogDescription>
            {done
              ? t('staff.password.doneHelp', 'Share this password with {name}. It will not be shown again.').replace('{name}', staffName)
              : t('staff.password.help', 'Set a new sign-in password for {name}.').replace('{name}', staffName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password">{t('staff.password.new', 'New password')}</Label>
          <div className="flex gap-2">
            <Input id="reset-password" value={password} onChange={(e) => setPassword(e.target.value)} readOnly={done} autoComplete="off" className="font-mono" aria-invalid={tooShort} />
            {done ? (
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? t('staff.password.copied', 'Copied') : t('staff.password.copy', 'Copy')}
              </Button>
            ) : (
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())} aria-label={t('staff.form.generate', 'Generate')} title={t('staff.form.generate', 'Generate')}>
                <Shuffle />
              </Button>
            )}
          </div>
          {tooShort && !done && <p className="text-xs text-tone-danger">{t('staff.form.errors.password', 'Use at least 6 characters.')}</p>}
          {!userId && <p className="text-xs text-tone-danger">{t('staff.password.noAccount', 'This staff member has no login account.')}</p>}
        </div>

        <DialogFooter>
          {done ? (
            <Button onClick={() => onOpenChange(false)}>{t('actions.done', 'Done')}</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button onClick={save} disabled={saving || tooShort || !userId}>
                {saving && <Loader2 className="animate-spin" />}
                {t('staff.password.set', 'Set password')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
