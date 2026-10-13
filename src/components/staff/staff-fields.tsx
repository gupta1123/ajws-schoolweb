// src/components/staff/staff-fields.tsx
//
// Draft shape, validation and field helpers shared by the Add page and the
// in-page Edit mode on the staff profile, so both always ask for the same things.

'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateField } from '@/components/calendar/event-pickers';
import { staffServices } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import type { Staff } from '@/types/staff';

export interface StaffDraft {
  fullName: string;
  phone: string;
  email: string;
  dob: string; // yyyy-MM-dd
  joiningDate: string; // yyyy-MM-dd
  designation: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
}

export const emptyDraft: StaffDraft = {
  fullName: '',
  phone: '',
  email: '',
  dob: '',
  joiningDate: '',
  designation: '',
  address: '',
  emergencyName: '',
  emergencyPhone: '',
};

// the API returns dates as plain dates or ISO timestamps; keep the date part only
const dateOnly = (v?: string | null) => (v ? v.slice(0, 10) : '');

export function draftFromStaff(s: Staff): StaffDraft {
  return {
    fullName: s.full_name ?? '',
    phone: s.phone_number ?? '',
    email: s.email ?? '',
    dob: dateOnly(s.date_of_birth),
    joiningDate: dateOnly(s.joining_date),
    designation: s.designation ?? '',
    address: s.address ?? '',
    emergencyName: s.emergency_contact ?? '',
    emergencyPhone: s.emergency_contact_phone ?? '',
  };
}

export const digitsOf = (v: string) => v.replace(/\D/g, '');
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export type DraftErrors = Partial<Record<keyof StaffDraft, string>>;

type Translate = (key: string, fallback?: string) => string;

/** `phoneOwners` maps 10+ digit phone numbers to the name of the staff member who already uses them. */
export function validateDraft(d: StaffDraft, t: Translate, phoneOwners?: Map<string, string>): DraftErrors {
  const errors: DraftErrors = {};
  if (!d.fullName.trim()) errors.fullName = t('staff.form.errors.name', 'Enter the full name.');
  const digits = digitsOf(d.phone);
  if (digits.length < 10) errors.phone = t('staff.form.errors.phone', 'Enter a valid 10-digit phone number.');
  else {
    const owner = phoneOwners?.get(digits.slice(-10));
    if (owner) errors.phone = t('staff.form.errors.phoneUsed', 'This number already belongs to {name}.').replace('{name}', owner);
  }
  if (d.email.trim() && !emailOk(d.email.trim())) errors.email = t('staff.form.errors.email', 'Enter a valid email address.');
  if (d.emergencyPhone.trim() && digitsOf(d.emergencyPhone).length < 10) errors.emergencyPhone = t('staff.form.errors.phone', 'Enter a valid 10-digit phone number.');
  return errors;
}

/** Existing numbers, so a duplicate is caught before the request is sent. */
export function usePhoneOwners(excludeId?: string) {
  const { token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    staffServices
      .getStaff(token, { limit: 200 })
      .then((r) => {
        if (!cancelled && r.status === 'success') setStaff(r.data.staff);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  return useMemo(() => {
    const map = new Map<string, string>();
    for (const s of staff) {
      if (s.id === excludeId) continue;
      const d = digitsOf(s.phone_number ?? '');
      if (d.length >= 10) map.set(d.slice(-10), s.full_name);
    }
    return map;
  }, [staff, excludeId]);
}

/* ------------------------------ fields ------------------------------ */

export function FieldShell({ label, optional, error, hint, htmlFor, children, className }: { label: string; optional?: boolean; error?: string; hint?: string; htmlFor?: string; children: ReactNode; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="font-normal text-muted-foreground"> · {t('foodMenu.form.optional', 'optional')}</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-tone-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  hint?: string;
}

export function TextField({ id, label, value, onChange, error, optional, type = 'text', placeholder, className, autoFocus, hint }: TextFieldProps) {
  return (
    <FieldShell label={label} optional={optional} error={error} hint={hint} htmlFor={id} className={className}>
      <Input
        id={id}
        type={type}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  );
}

export function BirthDateField({ id, label, value, onChange, optional = true, clearable = true }: { id: string; label: string; value: string; onChange: (v: string) => void; optional?: boolean; clearable?: boolean }) {
  return (
    <FieldShell label={label} optional={optional} htmlFor={id}>
      <DateField id={id} value={value} onChange={onChange} onClear={clearable ? () => onChange('') : undefined} hideQuickPicks yearDropdown />
    </FieldShell>
  );
}
