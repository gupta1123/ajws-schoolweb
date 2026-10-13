// src/components/staff/staff-form.tsx
//
// Add-staff form. A person record rather than a document: a centered column
// that opens with a live avatar, then plain labeled fields, a role picker made
// of descriptive cards, the login password, and an optional "more details"
// section. Actions sit in a bar pinned to the bottom edge. Editing an existing
// person happens in place on their profile page, using the same field helpers.

'use client';

import { useState, type FormEvent } from 'react';
import { BookOpen, Check, ChevronDown, ClipboardCheck, Eye, EyeOff, Loader2, Settings2, Shield, Shuffle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/calendar/event-pickers';
import { IconChip } from '@/components/ui/page-kit';
import { BirthDateField, FieldShell, TextField, emptyDraft, usePhoneOwners, validateDraft, type StaffDraft } from '@/components/staff/staff-fields';
import { useI18n } from '@/lib/i18n/context';
import { type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

export interface StaffFormValues {
  draft: StaffDraft;
  role: string;
  password: string;
}

interface StaffFormProps {
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: StaffFormValues) => void;
  onCancel: () => void;
}

const ROLES: { value: string; icon: LucideIcon }[] = [
  { value: 'teacher', icon: BookOpen },
  { value: 'attendance_staff', icon: ClipboardCheck },
  { value: 'principal', icon: Shield },
  { value: 'admin', icon: Settings2 },
];

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function useRoleText() {
  const { t } = useI18n();
  const label = (role: string) => {
    switch (role) {
      case 'teacher':
        return t('common.teacher', 'Teacher');
      case 'attendance_staff':
        return t('common.attendanceStaff', 'Attendance Staff');
      case 'principal':
        return t('common.principal', 'Principal');
      case 'admin':
        return t('common.admin', 'Admin');
      default:
        return role;
    }
  };
  const help = (role: string) =>
    ({
      teacher: t('staff.form.roleHelp.teacher', 'Marks attendance, assigns homework and manages their own classes.'),
      attendance_staff: t('staff.form.roleHelp.attendance_staff', 'Can mark attendance for all classes.'),
      principal: t('staff.form.roleHelp.principal', 'Full access to students, staff, approvals and reports.'),
      admin: t('staff.form.roleHelp.admin', 'Full access, including school setup and settings.'),
    })[role] ?? '';
  return { label, help };
}

export function StaffForm({ submitting, error, onSubmit, onCancel }: StaffFormProps) {
  const { t } = useI18n();
  const roleText = useRoleText();
  const phoneOwners = usePhoneOwners();
  const [draft, setDraft] = useState<StaffDraft>(emptyDraft);
  const [role, setRole] = useState('teacher');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [more, setMore] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof StaffDraft>(key: K, value: StaffDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const errors = validateDraft(draft, t, phoneOwners);
  const passwordError = password.length < 6 ? t('staff.form.errors.password', 'Use at least 6 characters.') : '';
  const invalid = Object.keys(errors).length > 0 || Boolean(passwordError);
  const show = (msg?: string) => (touched ? msg : undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) {
      // make sure a hidden problem is visible
      if (errors.email || errors.emergencyPhone) setMore(true);
      return;
    }
    if (submitting) return;
    onSubmit({ draft: { ...draft, fullName: draft.fullName.trim(), phone: draft.phone.trim() }, role, password });
  };

  const initials = initialsOf(draft.fullName);

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-xl pb-24">
      {/* identity */}
      <div className="flex items-center gap-4 pb-6">
        <IconChip className="size-16 rounded-full text-xl font-semibold" tone="primary">
          {initials || <Shield className="!size-6" />}
        </IconChip>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight">{draft.fullName.trim() || t('staff.form.newMember', 'New staff member')}</p>
          <p className={type.caption}>{draft.designation.trim() || roleText.label(role)}</p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <TextField id="staff-name" label={t('staff.form.labels.fullName', 'Full Name')} value={draft.fullName} onChange={(v) => set('fullName', v)} error={show(errors.fullName)} autoFocus placeholder={t('staff.form.placeholders.fullNameStaff', "Enter staff member's full name")} />
          <TextField id="staff-phone" type="tel" label={t('staff.form.labels.phoneNumber', 'Phone Number')} value={draft.phone} onChange={(v) => set('phone', v)} error={show(errors.phone)} placeholder={t('staff.form.placeholders.phoneNumber', 'e.g., 9876543210')} />
        </section>

        {/* role */}
        <section className="space-y-3">
          <h2 className={type.sectionTitle}>{t('staff.form.labels.role', 'Role')}</h2>
          <div role="radiogroup" aria-label={t('staff.form.labels.role', 'Role')} className="grid gap-2 sm:grid-cols-2">
            {ROLES.map(({ value, icon: Icon }) => {
              const selected = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(value)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-tone-primary bg-tone-primary-soft' : 'hover:bg-muted/50'
                  )}
                >
                  <IconChip tone={selected ? 'primary' : 'neutral'}>
                    <Icon />
                  </IconChip>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{roleText.label(value)}</span>
                    <span className={cn(type.caption, 'block')}>{roleText.help(value)}</span>
                  </span>
                  {selected && <Check className="mt-1 size-4 shrink-0 text-tone-primary" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* login */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className={type.sectionTitle}>{t('staff.form.accountSecurity', 'Account Security')}</h2>
            <p className={type.caption}>{t('staff.create.passwordHint', "This will be the initial password for the staff member's user account")}</p>
          </div>
          <FieldShell label={t('staff.form.labels.initialPassword', 'Initial Password')} htmlFor="staff-password" error={show(passwordError)}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('staff.form.placeholders.setInitialPassword', 'Set initial password')}
                  aria-invalid={touched && Boolean(passwordError)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-9 text-muted-foreground"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('staff.form.hidePassword', 'Hide password') : t('staff.form.showPassword', 'Show password')}
                  title={showPassword ? t('staff.form.hidePassword', 'Hide password') : t('staff.form.showPassword', 'Show password')}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPassword(generatePassword());
                  setShowPassword(true);
                }}
              >
                <Shuffle />
                {t('staff.form.generate', 'Generate')}
              </Button>
            </div>
          </FieldShell>
        </section>

        {/* optional details */}
        <section className="space-y-4 border-t pt-4">
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex w-full items-center justify-between text-left">
            <span>
              <span className={cn(type.sectionTitle, 'block')}>{t('staff.form.moreDetails', 'More details')}</span>
              <span className={type.caption}>{t('staff.form.moreDetailsHint', 'Designation, email, birthday, joining date, address and emergency contact.')}</span>
            </span>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', more && 'rotate-180')} />
          </button>
          {more && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="staff-designation" optional label={t('staff.form.labels.designation', 'Designation')} value={draft.designation} onChange={(v) => set('designation', v)} placeholder={roleText.label(role)} />
              <TextField id="staff-email" optional type="email" label={t('staff.form.labels.email', 'Email')} value={draft.email} onChange={(v) => set('email', v)} error={show(errors.email)} />
              <BirthDateField id="staff-dob" label={t('staff.form.labels.dob', 'Date of birth')} value={draft.dob} onChange={(v) => set('dob', v)} />
              <FieldShell label={t('staff.form.labels.joiningDate', 'Joining date')} optional htmlFor="staff-joining">
                <DateField id="staff-joining" value={draft.joiningDate} onChange={(v) => set('joiningDate', v)} onClear={() => set('joiningDate', '')} hideQuickPicks yearDropdown />
              </FieldShell>
              <TextField id="staff-address" optional className="sm:col-span-2" label={t('staff.form.labels.address', 'Address')} value={draft.address} onChange={(v) => set('address', v)} />
              <TextField id="staff-emergency-name" optional label={t('staff.form.labels.emergencyName', 'Emergency contact')} value={draft.emergencyName} onChange={(v) => set('emergencyName', v)} />
              <TextField id="staff-emergency-phone" optional type="tel" label={t('staff.form.labels.emergencyPhone', 'Emergency phone')} value={draft.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} error={show(errors.emergencyPhone)} />
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="text-sm text-tone-danger">
            {error}
          </p>
        )}
      </div>

      {/* actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-xl justify-end gap-2 p-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? t('actions.adding', 'Adding...') : t('staff.addStaff', 'Add Staff')}
          </Button>
        </div>
      </div>
    </form>
  );
}
