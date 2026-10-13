// src/app/(admin)/staff/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { staffServices } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { StaffForm, type StaffFormValues } from '@/components/staff/staff-form';
import type { CreateStaffWithUserRequest, UpdateStaffRequest } from '@/types/staff';

export default function CreateStaffPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
        </div>
      </div>
    );
  }

  const submit = async ({ draft, role: rawRole, password }: StaffFormValues) => {
    if (!token) return;
    setSaving(true);
    setError(null);
    const role = rawRole.toLowerCase();
    const defaultDesignation: Record<string, string> = { teacher: 'Teacher', attendance_staff: 'Attendance Staff', principal: 'Principal', admin: 'Admin' };
    try {
      const data: CreateStaffWithUserRequest = {
        full_name: draft.fullName,
        phone_number: draft.phone,
        role,
        department: rawRole,
        designation: draft.designation.trim() || defaultDesignation[role] || 'Teacher',
        password,
        user_role: role,
      };
      const response = await staffServices.createStaffWithUser(data, token);
      if (response.status !== 'success') throw new Error(response.message || t('staff.create.failed', 'Failed to create staff member'));
      const created = response.data.staff;

      // the create endpoint only takes the basics, so the optional details go in a follow-up update
      const extras: UpdateStaffRequest = {};
      if (draft.email.trim()) extras.email = draft.email.trim();
      if (draft.joiningDate) extras.joining_date = draft.joiningDate;
      if (draft.address.trim()) extras.address = draft.address.trim();
      if (draft.emergencyName.trim()) extras.emergency_contact = draft.emergencyName.trim();
      if (draft.emergencyPhone.trim()) extras.emergency_contact_phone = draft.emergencyPhone.trim();
      let extrasFailed = false;
      try {
        if (Object.keys(extras).length > 0) {
          const r = await staffServices.updateStaff(created.id, extras, token);
          if (r.status !== 'success') extrasFailed = true;
        }
        if (draft.dob) {
          const r = await staffServices.updateStaffDateOfBirth(created.id, draft.dob, token);
          if ('status' in r && r.status !== 'success') extrasFailed = true;
        }
      } catch {
        extrasFailed = true;
      }

      if (extrasFailed) {
        toast({
          title: t('staff.created', 'Staff member added'),
          description: t('staff.createdExtrasFailed', 'Some optional details could not be saved. Add them from the profile.'),
          variant: 'error',
        });
      } else {
        toast({ title: t('staff.created', 'Staff member added'), variant: 'success' });
      }
      router.push(`/staff/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staff.create.failed', 'Failed to create staff member'));
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <StaffForm submitting={saving} error={error} onSubmit={submit} onCancel={() => router.push('/staff')} />
    </ProtectedRoute>
  );
}
