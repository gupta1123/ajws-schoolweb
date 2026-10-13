// src/components/students/student-fields.tsx
//
// Small pieces shared by the student profile (edit) and the add-student form.

'use client';

import { FieldShell } from '@/components/staff/staff-fields';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GENDERS = ['male', 'female', 'other'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

interface PickFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  optional?: boolean;
  error?: string;
}

/** A labelled shadcn Select (native selects are unreadable in dark mode). */
export function PickField({ id, label, value, onChange, options, placeholder, optional = true, error }: PickFieldProps) {
  return (
    <FieldShell label={label} optional={optional} error={error} htmlFor={id}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
