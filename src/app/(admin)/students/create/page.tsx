// src/app/(admin)/students/create/page.tsx
//
// Add a student. Same shape as "Add staff": a centred column with the required
// fields up front, optional details tucked away, and Cancel / Add pinned to
// the bottom.

'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { studentServices, type CreateStudentRequest } from '@/lib/api/students';
import { academicServices } from '@/lib/api/academic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconChip } from '@/components/ui/page-kit';
import { DateField, toISODate } from '@/components/calendar/event-pickers';
import { BirthDateField, FieldShell, TextField } from '@/components/staff/staff-fields';
import { initialsOf } from '@/components/staff/staff-form';
import { BLOOD_GROUPS, GENDERS, PickField } from '@/components/students/student-fields';
import { type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

interface Division {
  id: string;
  label: string;
  order: number;
}

const emptyDraft = () => ({
  fullName: '',
  admissionNumber: '',
  rollNumber: '',
  classDivisionId: '',
  dob: '',
  admissionDate: toISODate(new Date()),
  gender: '',
  bloodGroup: '',
  address: '',
  emergencyContact: '',
});

function AddStudentForm() {
  const { token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();

  const [draft, setDraft] = useState(emptyDraft);
  const [divisions, setDivisions] = useState<Division[] | null>(null);
  const [classError, setClassError] = useState(false);
  const [more, setMore] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ReturnType<typeof emptyDraft>>(key: K, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    academicServices
      .getClassDivisionsSummary(token)
      .then((r) => {
        if (cancelled) return;
        if (r.status !== 'success' || !r.data) throw new Error();
        const all = r.data.divisions;
        // new students belong in the running academic year
        const current = all.filter((d) => d.academic_year?.is_active);
        const list = (current.length > 0 ? current : all)
          .map((d) => ({ id: d.id, label: `${d.level?.name ?? ''} ${d.division}`.trim(), order: d.level?.sequence_number ?? 0 }))
          .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, undefined, { numeric: true }));
        setDivisions(list);
      })
      .catch(() => {
        if (!cancelled) {
          setClassError(true);
          setDivisions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const classLabel = useMemo(() => divisions?.find((d) => d.id === draft.classDivisionId)?.label ?? '', [divisions, draft.classDivisionId]);

  const today = toISODate(new Date());
  const errors: Partial<Record<'fullName' | 'admissionNumber' | 'rollNumber' | 'classDivisionId' | 'dob' | 'admissionDate', string>> = {};
  if (!draft.fullName.trim()) errors.fullName = t('students.create.errors.name', 'Enter the student’s name.');
  if (!draft.admissionNumber.trim()) errors.admissionNumber = t('students.create.errors.admission', 'Enter the admission number.');
  if (!draft.rollNumber.trim()) errors.rollNumber = t('students.create.errors.roll', 'Enter the roll number.');
  if (!draft.classDivisionId) errors.classDivisionId = t('students.create.errors.class', 'Choose a class.');
  if (!draft.dob) errors.dob = t('students.create.errors.dob', 'Pick the date of birth.');
  else if (draft.dob > today) errors.dob = t('students.create.errors.dobFuture', 'Date of birth cannot be in the future.');
  if (!draft.admissionDate) errors.admissionDate = t('students.create.errors.admissionDate', 'Pick the admission date.');
  const show = (m?: string) => (touched ? m : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setError(null);
    try {
      const body: CreateStudentRequest & { gender?: string; blood_group?: string } = {
        admission_number: draft.admissionNumber.trim(),
        full_name: draft.fullName.trim(),
        date_of_birth: draft.dob,
        admission_date: draft.admissionDate,
        class_division_id: draft.classDivisionId,
        roll_number: draft.rollNumber.trim(),
        ...(draft.gender && { gender: draft.gender }),
        ...(draft.bloodGroup && { blood_group: draft.bloodGroup }),
      };
      const r = await studentServices.createStudent(body, token);
      if (r instanceof Blob || !('status' in r) || r.status !== 'success') {
        throw new Error(('message' in r && r.message) || t('students.create.failed', 'Could not add the student'));
      }
      const created = (r.data as unknown as { student?: { id: string } }).student ?? (r.data as unknown as { id: string });

      // address and emergency contact are not part of the create call
      let extrasFailed = false;
      if (draft.address.trim() || draft.emergencyContact.trim()) {
        try {
          const u = await studentServices.updateStudent(
            created.id,
            { ...(draft.address.trim() && { address: draft.address.trim() }), ...(draft.emergencyContact.trim() && { emergency_contact: draft.emergencyContact.trim() }) },
            token
          );
          extrasFailed = !('status' in u) || u.status !== 'success';
        } catch {
          extrasFailed = true;
        }
      }

      toast(
        extrasFailed
          ? { title: t('students.create.added', 'Student added'), description: t('students.create.extrasFailed', 'The address could not be saved. Add it from the profile.'), variant: 'error' }
          : { title: t('students.create.added', 'Student added'), variant: 'success' }
      );
      router.push(`/students/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('students.create.failed', 'Could not add the student'));
      setSaving(false);
    }
  };

  const classOptions = divisions ?? [];

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-xl pb-24">
      {/* identity */}
      <div className="flex items-center gap-4 pb-6">
        <IconChip className="size-16 rounded-full text-xl font-semibold" tone="primary">
          {initialsOf(draft.fullName) || <GraduationCap className="!size-6" />}
        </IconChip>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight">{draft.fullName.trim() || t('students.create.newStudent', 'New student')}</p>
          <p className={type.caption}>{classLabel || t('students.create.noClass', 'No class chosen yet')}</p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <TextField id="stu-name" className="sm:col-span-2" label={t('students.form.labels.fullName', 'Full Name')} value={draft.fullName} onChange={(v) => set('fullName', v)} error={show(errors.fullName)} autoFocus placeholder={t('students.form.placeholders.fullName', "Enter student's full name")} />
          <TextField id="stu-admission" label={t('students.form.labels.admissionNumber', 'Admission Number')} value={draft.admissionNumber} onChange={(v) => set('admissionNumber', v)} error={show(errors.admissionNumber)} placeholder={t('students.form.placeholders.admissionNumber', 'e.g., 2025001')} />
          <TextField id="stu-roll" label={t('students.form.labels.rollNumber', 'Roll Number')} value={draft.rollNumber} onChange={(v) => set('rollNumber', v)} error={show(errors.rollNumber)} placeholder={t('students.form.placeholders.rollNumber', 'e.g., 501')} />
        </section>

        <section className="space-y-4">
          {divisions === null ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <PickField
              id="stu-class"
              optional={false}
              label={t('students.form.labels.classDivision', 'Class Division')}
              value={draft.classDivisionId}
              onChange={(v) => set('classDivisionId', v)}
              placeholder={t('students.form.placeholders.selectClass', 'Select a class')}
              options={classOptions.map((d) => ({ value: d.id, label: d.label }))}
              error={show(errors.classDivisionId) ?? (classError ? t('students.create.classesFailed', 'Could not load the classes. Refresh to try again.') : undefined)}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label={t('students.form.labels.dateOfBirth', 'Date of Birth')} htmlFor="stu-dob" error={show(errors.dob)}>
              <DateField id="stu-dob" value={draft.dob} onChange={(v) => set('dob', v)} invalid={touched && Boolean(errors.dob)} hideQuickPicks yearDropdown />
            </FieldShell>
            <FieldShell label={t('students.form.labels.admissionDate', 'Admission Date')} htmlFor="stu-adm-date" error={show(errors.admissionDate)}>
              <DateField id="stu-adm-date" value={draft.admissionDate} onChange={(v) => set('admissionDate', v)} invalid={touched && Boolean(errors.admissionDate)} hideQuickPicks />
            </FieldShell>
          </div>
        </section>

        {/* optional details */}
        <section className="space-y-4 border-t pt-4">
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex w-full items-center justify-between text-left">
            <span>
              <span className={cn(type.sectionTitle, 'block')}>{t('staff.form.moreDetails', 'More details')}</span>
              <span className={type.caption}>{t('students.create.moreHint', 'Gender, blood group, address and emergency contact.')}</span>
            </span>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', more && 'rotate-180')} />
          </button>
          {more && (
            <div className="grid gap-4 sm:grid-cols-2">
              <PickField id="stu-gender" label={t('students.detail.gender', 'Gender')} value={draft.gender} onChange={(v) => set('gender', v)} placeholder={t('students.detail.choose', 'Choose')} options={GENDERS.map((g) => ({ value: g, label: t(`students.gender.${g}`, g.charAt(0).toUpperCase() + g.slice(1)) }))} />
              <PickField id="stu-blood" label={t('students.detail.bloodGroup', 'Blood group')} value={draft.bloodGroup} onChange={(v) => set('bloodGroup', v)} placeholder={t('students.detail.choose', 'Choose')} options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))} />
              <TextField id="stu-address" optional className="sm:col-span-2" label={t('students.detail.address', 'Address')} value={draft.address} onChange={(v) => set('address', v)} />
              <TextField id="stu-emergency" optional className="sm:col-span-2" label={t('students.detail.emergency', 'Emergency contact')} value={draft.emergencyContact} onChange={(v) => set('emergencyContact', v)} />
            </div>
          )}
        </section>

        <p className={type.caption}>{t('students.create.parentsHint', 'You can link parents from the student’s profile after adding them.')}</p>

        {error && (
          <p role="alert" className="text-sm text-tone-danger">
            {error}
          </p>
        )}
      </div>

      {/* actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-xl justify-end gap-2 p-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/students')} disabled={saving}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={saving || divisions === null}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? t('actions.adding', 'Adding...') : t('students.addStudent', 'Add Student')}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function CreateStudentPage() {
  const { user } = useAuth();
  const { t } = useI18n();

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

  return (
    <ProtectedRoute>
      <AddStudentForm />
    </ProtectedRoute>
  );
}
