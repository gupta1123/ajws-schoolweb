// src/app/(admin)/students/[id]/page.tsx
//
// Student profile. Opens read-only; "Edit" turns the same page into a form in
// place (Save / Cancel pinned to the bottom), so there is no separate edit
// screen. Mirrors the staff profile.

'use client';

import { Suspense, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Cake, CalendarDays, CalendarOff, Droplet, GraduationCap, Hash, HeartPulse, Loader2, MapPin, MoreHorizontal, Pencil, Phone, Plus, Power, UserRound, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { studentServices, type Student } from '@/lib/api/students';
import { leaveRequestServices } from '@/lib/api/leave-requests';
import type { LeaveRequest } from '@/types/leave-requests';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, IconChip, InlineError, ListRow, Panel, Pill, RowList } from '@/components/ui/page-kit';
import { parseISODate } from '@/components/calendar/event-pickers';
import { BirthDateField, TextField } from '@/components/staff/staff-fields';
import { initialsOf } from '@/components/staff/staff-form';
import { BLOOD_GROUPS, GENDERS, PickField } from '@/components/students/student-fields';
import { ParentLinking } from '@/components/students/parent-linking';
import { surface, type, type Tone } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

/* ------------------------------ helpers ------------------------------ */

const STATUSES = ['active', 'inactive', 'transferred'] as const;
type Status = (typeof STATUSES)[number];

interface Draft {
  fullName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
}

type StudentWithExtras = Student & { emergency_contact?: string | null };

const draftOf = (s: StudentWithExtras): Draft => ({
  fullName: s.full_name ?? '',
  dob: (s.date_of_birth ?? '').slice(0, 10),
  gender: s.gender ?? '',
  bloodGroup: s.blood_group ?? '',
  address: s.address ?? '',
  emergencyContact: s.emergency_contact ?? '',
});

const statusTone = (s: string): Tone => (s === 'active' ? 'success' : s === 'transferred' ? 'warning' : 'neutral');
const leaveTone = (s: string): Tone => (s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning');

const classLabelOf = (r?: Student['student_academic_records'][number]) => {
  const cd = r?.class_division as ({ level?: { name: string } } & Student['student_academic_records'][number]['class_division']) | undefined;
  const level = cd?.class_level?.name ?? cd?.level?.name;
  return cd ? `${level ?? ''} ${cd.division ?? ''}`.trim() : '';
};

/* ------------------------------- page -------------------------------- */

function StudentProfile({ id }: { id: string }) {
  const { user, token } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [student, setStudent] = useState<StudentWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [leaves, setLeaves] = useState<LeaveRequest[] | null>(null);

  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const [confirm, setConfirm] = useState<null | { kind: 'status'; to: Status } | { kind: 'discard' }>(null);
  const [busy, setBusy] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'principal';

  const refresh = useCallback(async () => {
    if (!token) return null;
    const r = await studentServices.getStudentById(id, token);
    if (r instanceof Blob || !('status' in r) || r.status !== 'success' || !r.data) throw new Error(('message' in r && r.message) || t('students.detail.loadFailed', 'Could not load this student'));
    return r.data.student as StudentWithExtras;
  }, [token, id, t]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    refresh()
      .then((s) => !cancelled && s && setStudent(s))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : t('students.detail.loadFailed', 'Could not load this student')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, attempt]);

  // leave history loads alongside the student, it doesn't need to wait for them
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    leaveRequestServices
      .getByStudent(id, {}, token)
      .then((r) => {
        if (cancelled) return;
        setLeaves(!(r instanceof Blob) && 'status' in r && r.status === 'success' && r.data ? r.data.leave_requests ?? [] : []);
      })
      .catch(() => !cancelled && setLeaves([]));
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  useEffect(() => {
    if (student && editing && !draft) setDraft(draftOf(student));
  }, [student, editing, draft]);

  const original = useMemo(() => (student ? draftOf(student) : null), [student]);
  const dirty = Boolean(editing && draft && original && (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== original[k]));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const startEdit = useCallback(() => {
    if (!student) return;
    setDraft(draftOf(student));
    setSaveError(null);
    setTouched(false);
    setEditing(true);
  }, [student]);

  const stopEdit = () => {
    if (searchParams.get('edit')) window.history.replaceState(null, '', window.location.pathname);
    setEditing(false);
    setDraft(null);
    setSaveError(null);
    setConfirm(null);
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const nameError = draft && !draft.fullName.trim() ? t('students.detail.errors.name', 'Enter the student’s name.') : undefined;
  const show = (m?: string) => (touched ? m : undefined);

  const save = async () => {
    if (!token || !student || !draft || !original) return;
    setTouched(true);
    if (nameError) return;
    setSaving(true);
    setSaveError(null);

    // only send what changed; gender / blood group can't be unset once chosen
    const body: Record<string, string> = {};
    if (draft.fullName.trim() !== original.fullName.trim()) body.full_name = draft.fullName.trim();
    if (draft.dob !== original.dob && draft.dob) body.date_of_birth = draft.dob;
    if (draft.gender !== original.gender && draft.gender) body.gender = draft.gender;
    if (draft.bloodGroup !== original.bloodGroup && draft.bloodGroup) body.blood_group = draft.bloodGroup;
    if (draft.address.trim() !== original.address.trim()) body.address = draft.address.trim();
    if (draft.emergencyContact.trim() !== original.emergencyContact.trim()) body.emergency_contact = draft.emergencyContact.trim();

    try {
      if (Object.keys(body).length > 0) {
        const r = await studentServices.updateStudent(student.id, body, token);
        if (!('status' in r) || r.status !== 'success') throw new Error();
        setStudent({ ...student, ...body } as StudentWithExtras);
      }
      toast({ title: t('students.detail.saved', 'Student updated'), variant: 'success' });
      stopEdit();
    } catch {
      setSaveError(t('students.detail.saveFailed', 'Could not save the changes. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (to: Status) => {
    if (!token || !student) return;
    setBusy(true);
    try {
      const r = await studentServices.updateStudent(student.id, { status: to }, token);
      if (!('status' in r) || r.status !== 'success') throw new Error();
      setStudent({ ...student, status: to });
      toast({ title: t('students.detail.statusChanged', 'Status updated'), variant: 'success' });
      setConfirm(null);
    } catch {
      toast({ title: t('students.detail.statusFailed', 'Could not change the status'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const linkParent = async (parentId: string, relationship: string, isPrimary: boolean, accessLevel: string) => {
    if (!token || !student) return;
    try {
      const r = await studentServices.linkStudentToParent(
        student.id,
        { parent_id: parentId, relationship: relationship as 'father' | 'mother' | 'guardian', is_primary_guardian: isPrimary, access_level: accessLevel as 'full' | 'restricted' | 'readonly' },
        token
      );
      if (r instanceof Blob || !('status' in r) || r.status !== 'success') throw new Error();
      const fresh = await refresh();
      if (fresh) setStudent(fresh);
      toast({ title: t('students.detail.linked', 'Parent linked'), variant: 'success' });
    } catch {
      toast({ title: t('students.detail.linkFailed', 'Could not link the parent'), variant: 'error' });
    }
    setLinkOpen(false);
  };

  /* ------------------------------ render ------------------------------ */

  if (user && !canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (loadError || !student) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <InlineError title={t('students.detail.errorTitle', 'Error loading student')} detail={loadError ?? undefined} onRetry={() => setAttempt((a) => a + 1)} retryLabel={t('actions.refresh', 'Refresh')} />
      </div>
    );
  }

  const records = student.student_academic_records ?? [];
  const current = records.find((r) => r.status === 'ongoing') ?? records[0];
  const classLabel = classLabelOf(current);
  const guardians = student.parent_mappings ?? [];
  const hasPrimary = guardians.some((g) => g.is_primary_guardian);
  const status = student.status as Status;
  const statusLabel = t(`students.status.${student.status}`, student.status.charAt(0).toUpperCase() + student.status.slice(1));

  const fmtDate = (iso?: string | null) => {
    const d = iso ? parseISODate(iso.slice(0, 10)) : undefined;
    return d ? d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  };

  const age = (() => {
    const d = student.date_of_birth ? parseISODate(student.date_of_birth.slice(0, 10)) : undefined;
    if (!d) return '';
    const now = new Date();
    let y = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) y -= 1;
    return y >= 0 ? t('students.detail.years', '{n} yrs').replace('{n}', String(y)) : '';
  })();
  const birthdayHint = (() => {
    const d = student.date_of_birth ? parseISODate(student.date_of_birth.slice(0, 10)) : undefined;
    if (!d) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    const days = Math.round((next.getTime() - today.getTime()) / 86400000);
    if (days === 0) return t('staff.detail.birthdayToday', 'Birthday today');
    return days <= 30 ? t('staff.detail.birthdayIn', 'Birthday in {n} days').replace('{n}', String(days)) : '';
  })();
  const tenure = (() => {
    const j = student.admission_date ? parseISODate(student.admission_date.slice(0, 10)) : undefined;
    if (!j) return '';
    const now = new Date();
    const months = Math.max(0, (now.getFullYear() - j.getFullYear()) * 12 + now.getMonth() - j.getMonth());
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0 && m === 0) return t('staff.detail.justJoined', 'Joined this month');
    return [y > 0 && t('staff.detail.years', '{n} yr').replace('{n}', String(y)), m > 0 && t('staff.detail.months', '{n} mo').replace('{n}', String(m))].filter(Boolean).join(' ');
  })();

  const shownName = editing && draft ? draft.fullName.trim() || student.full_name : student.full_name;

  const actions =
    canManage && !editing ? (
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="outline" onClick={startEdit}>
          <Pencil />
          {t('actions.edit', 'Edit')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label={t('staff.detail.more', 'More actions')} title={t('staff.detail.more', 'More actions')}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t('students.detail.setStatus', 'Set status')}</DropdownMenuLabel>
            {STATUSES.filter((s) => s !== status).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setConfirm({ kind: 'status', to: s })}>
                <Power />
                {t(`students.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLinkOpen(true)} disabled={hasPrimary}>
              <Users />
              {t('students.detail.linkParent', 'Link parent')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null;

  const stats: { label: string; value: string; icon: ReactNode; tone: Tone }[] = [
    { label: t('students.form.labels.classDivision', 'Class'), value: classLabel || '—', icon: <GraduationCap />, tone: 'primary' },
    { label: t('students.cols.rollNo', 'Roll No.'), value: current?.roll_number || '—', icon: <Hash />, tone: 'violet' },
    { label: t('students.form.labels.admissionNumber', 'Admission Number'), value: student.admission_number || '—', icon: <BookOpen />, tone: 'success' },
    { label: t('students.detail.atSchool', 'At the school'), value: tenure || '—', icon: <CalendarDays />, tone: 'warning' },
  ];

  const hero = (
    <div className={cn(surface.panel, 'overflow-hidden')}>
      <div className="flex items-center gap-3 bg-gradient-to-br from-tone-primary-soft to-transparent px-4 py-3">
        {student.profile_photo_url ? (
          <Image src={student.profile_photo_url} alt="" width={48} height={48} className="size-12 rounded-full object-cover ring-2 ring-background" />
        ) : (
          <IconChip className="size-12 rounded-full text-base font-semibold ring-2 ring-background" tone={status === 'active' ? 'primary' : 'neutral'}>
            {initialsOf(shownName) || '?'}
          </IconChip>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold leading-tight">{shownName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {classLabel && <Pill tone="primary">{classLabel}</Pill>}
            <Pill tone={statusTone(student.status)}>{statusLabel}</Pill>
            {age && <span className="text-xs text-muted-foreground">{age}</span>}
            {birthdayHint && <Pill tone="rose">{birthdayHint}</Pill>}
          </div>
        </div>
        {actions}
      </div>
      <dl className="grid grid-cols-2 divide-x border-t sm:grid-cols-4 [&>div:nth-child(n+3)]:border-t sm:[&>div:nth-child(n+3)]:border-t-0">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 px-4 py-2">
            <IconChip tone={s.tone} className="size-8">
              {s.icon}
            </IconChip>
            <div className="min-w-0">
              <dt className={type.caption}>{s.label}</dt>
              <dd className="truncate text-sm font-semibold leading-tight">{s.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );

  /* right rail */
  type Row = { icon: ReactNode; label: string; value?: string | null };
  const rows: Row[] = [
    { icon: <Cake />, label: t('students.form.labels.dateOfBirth', 'Date of Birth'), value: fmtDate(student.date_of_birth) },
    { icon: <UserRound />, label: t('students.detail.gender', 'Gender'), value: student.gender ? t(`students.gender.${student.gender}`, student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : '' },
    { icon: <Droplet />, label: t('students.detail.bloodGroup', 'Blood group'), value: student.blood_group },
    { icon: <MapPin />, label: t('students.detail.address', 'Address'), value: student.address },
    { icon: <HeartPulse />, label: t('students.detail.emergency', 'Emergency contact'), value: student.emergency_contact },
    { icon: <CalendarDays />, label: t('students.form.labels.admissionDate', 'Admission Date'), value: fmtDate(student.admission_date) },
  ];
  const filled = rows.filter((r) => r.value);
  const missing = rows.length - filled.length;

  const rail = (
    <aside className="space-y-4">
      <Panel title={t('students.detail.about', 'About')} flush>
        <ul className="divide-y">
          {filled.map((r) => (
            <li key={r.label} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{r.icon}</span>
              <div className="min-w-0">
                <p className={type.caption}>{r.label}</p>
                <p className="break-words text-sm font-medium">{r.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      {missing > 0 && canManage && (
        <button
          type="button"
          onClick={startEdit}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <IconChip tone="neutral">
            <Plus />
          </IconChip>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{t('staff.detail.addMissing', 'Add missing details')}</span>
            <span className={type.caption}>{t('staff.detail.missingCount', '{n} not filled in yet').replace('{n}', String(missing))}</span>
          </span>
        </button>
      )}
    </aside>
  );

  /* main column */
  const guardiansPanel = (
    <Panel
      title={t('students.detail.guardians', 'Guardians')}
      count={guardians.length}
      icon={<Users />}
      flush
      action={
        canManage ? (
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setLinkOpen(true)} disabled={hasPrimary} title={hasPrimary ? t('students.detail.primaryLinked', 'A primary guardian is already linked') : undefined}>
            <Plus />
            {t('students.detail.linkParent', 'Link parent')}
          </Button>
        ) : undefined
      }
    >
      {guardians.length > 0 ? (
        <RowList>
          {guardians.map((g) => (
            <ListRow
              key={g.id}
              icon={<IconChip tone={g.is_primary_guardian ? 'primary' : 'neutral'}>{initialsOf(g.parent.full_name)}</IconChip>}
              title={g.parent.full_name}
              subtitle={[g.parent.phone_number, g.parent.email].filter(Boolean).join(' · ')}
              trailing={
                <div className="flex items-center gap-1.5">
                  <Pill tone="neutral">{t(`students.relationship.${g.relationship}`, g.relationship.charAt(0).toUpperCase() + g.relationship.slice(1))}</Pill>
                  {g.is_primary_guardian && <Pill tone="primary">{t('students.detail.primary', 'Primary')}</Pill>}
                  {g.parent.phone_number && (
                    <Button asChild size="icon" variant="ghost" className="size-8 text-muted-foreground">
                      <a href={`tel:${g.parent.phone_number}`} aria-label={t('actions.call', 'Call')}>
                        <Phone />
                      </a>
                    </Button>
                  )}
                </div>
              }
            />
          ))}
        </RowList>
      ) : (
        <EmptyState icon={<Users />} title={t('students.detail.noGuardians', 'No guardians linked yet')} help={t('students.detail.noGuardiansHelp', 'Link a parent so they can follow this student in the app.')} />
      )}
    </Panel>
  );

  const leavePanel = (
    <Panel title={t('students.detail.leaveHistory', 'Leave history')} count={leaves?.length} icon={<CalendarOff />} flush>
      {leaves === null ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : leaves.length === 0 ? (
        <EmptyState icon={<CalendarOff />} title={t('students.detail.noLeaves', 'No leave requests')} />
      ) : (
        <RowList>
          {leaves.map((l) => {
            const start = parseISODate(l.start_date.slice(0, 10));
            const end = parseISODate(l.end_date.slice(0, 10));
            const days = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1 : 0;
            return (
              <ListRow
                key={l.id}
                icon={
                  <IconChip tone={leaveTone(l.status)}>
                    <CalendarOff />
                  </IconChip>
                }
                title={l.start_date.slice(0, 10) === l.end_date.slice(0, 10) ? fmtDate(l.start_date) : `${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`}
                subtitle={[days > 0 && t('students.detail.days', '{n} day(s)').replace('{n}', String(days)), l.reason].filter(Boolean).join(' · ')}
                trailing={
                  <div className="flex items-center gap-1.5">
                    <Pill tone={leaveTone(l.status)}>{t(`leave.status.${l.status}`, l.status)}</Pill>
                    <Button asChild size="sm" variant="ghost" className="h-7">
                      <Link href={`/leave-requests/${l.id}`}>{t('actions.view', 'View')}</Link>
                    </Button>
                  </div>
                }
              />
            );
          })}
        </RowList>
      )}
    </Panel>
  );

  const historyPanel =
    records.length > 1 ? (
      <Panel title={t('students.detail.academicHistory', 'Academic history')} count={records.length} icon={<GraduationCap />} flush>
        <RowList>
          {records.map((r) => (
            <ListRow
              key={r.id}
              icon={
                <IconChip>
                  <GraduationCap />
                </IconChip>
              }
              title={classLabelOf(r) || '—'}
              subtitle={`${t('students.cols.rollNo', 'Roll No.')} ${r.roll_number}`}
              trailing={<Pill tone={r.status === 'ongoing' ? 'success' : 'neutral'}>{t(`students.record.${r.status}`, r.status.charAt(0).toUpperCase() + r.status.slice(1))}</Pill>}
            />
          ))}
        </RowList>
      </Panel>
    ) : null;

  const editForm = draft && (
    <div className="space-y-4">
      <Panel title={t('students.detail.about', 'About')} icon={<UserRound />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="s-name" label={t('students.form.labels.fullName', 'Full Name')} value={draft.fullName} onChange={(v) => set('fullName', v)} error={show(nameError)} className="sm:col-span-2" />
          <BirthDateField id="s-dob" label={t('students.form.labels.dateOfBirth', 'Date of Birth')} value={draft.dob} onChange={(v) => set('dob', v)} optional={false} clearable={false} />
          <PickField
            id="s-gender"
            label={t('students.detail.gender', 'Gender')}
            value={draft.gender}
            onChange={(v) => set('gender', v)}
            placeholder={t('students.detail.choose', 'Choose')}
            options={GENDERS.map((g) => ({ value: g, label: t(`students.gender.${g}`, g.charAt(0).toUpperCase() + g.slice(1)) }))}
          />
          <PickField id="s-blood" label={t('students.detail.bloodGroup', 'Blood group')} value={draft.bloodGroup} onChange={(v) => set('bloodGroup', v)} placeholder={t('students.detail.choose', 'Choose')} options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))} />
          <TextField id="s-emergency" optional label={t('students.detail.emergency', 'Emergency contact')} value={draft.emergencyContact} onChange={(v) => set('emergencyContact', v)} />
          <TextField id="s-address" optional label={t('students.detail.address', 'Address')} value={draft.address} onChange={(v) => set('address', v)} className="sm:col-span-2" />
        </div>
      </Panel>
      <Panel title={t('students.detail.fixed', 'Fixed details')} icon={<Hash />}>
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            [t('students.form.labels.admissionNumber', 'Admission Number'), student.admission_number],
            [t('students.form.labels.classDivision', 'Class'), classLabel],
            [t('students.cols.rollNo', 'Roll No.'), current?.roll_number],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className={type.caption}>{label}</dt>
              <dd className="text-sm font-medium">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className={cn(type.caption, 'mt-3')}>{t('students.detail.fixedHint', 'Admission number, class and roll number cannot be changed here.')}</p>
      </Panel>
    </div>
  );

  const main = editing ? (
    editForm
  ) : (
    <div className="space-y-4">
      {guardiansPanel}
      {leavePanel}
      {historyPanel}
    </div>
  );

  const confirmStatus = confirm?.kind === 'status' ? confirm.to : null;

  return (
    <div className={cn('mx-auto w-full max-w-6xl space-y-4', editing && 'pb-24')}>
      {hero}
      <div className={cn('grid gap-4', !editing && 'lg:grid-cols-[minmax(0,1fr)_20rem]')}>
        <div className="min-w-0">{main}</div>
        {!editing && rail}
      </div>

      {saveError && editing && (
        <p role="alert" className="text-sm text-tone-danger">
          {saveError}
        </p>
      )}

      {editing && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:left-56">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 p-3 md:px-6">
            {dirty && <p className="mr-auto text-xs text-muted-foreground">{t('staff.detail.unsaved', 'Unsaved changes')}</p>}
            <Button variant="ghost" onClick={() => (dirty ? setConfirm({ kind: 'discard' }) : stopEdit())} disabled={saving}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? t('actions.updating', 'Updating...') : t('actions.saveChanges', 'Save changes')}
            </Button>
          </div>
        </div>
      )}

      {/* confirmations */}
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmStatus ? t('students.detail.changeStatusTitle', 'Change status') : t('staff.detail.discardTitle', 'Discard changes?')}</DialogTitle>
            <DialogDescription>
              {confirmStatus
                ? t('students.detail.changeStatusHelp', '{name} will be marked as {status}.')
                    .replace('{name}', student.full_name)
                    .replace('{status}', t(`students.status.${confirmStatus}`, confirmStatus).toLowerCase())
                : t('staff.detail.discardHelp', 'Your edits to this profile have not been saved.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              {confirmStatus ? t('actions.cancel', 'Cancel') : t('staff.detail.keepEditing', 'Keep editing')}
            </Button>
            {confirmStatus ? (
              <Button onClick={() => changeStatus(confirmStatus)} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {t('actions.confirm', 'Confirm')}
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopEdit}>
                {t('staff.detail.discard', 'Discard')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={linkOpen} onOpenChange={setLinkOpen}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="space-y-0 border-b p-5 pr-12">
            <div className="flex items-center gap-3">
              <IconChip className="size-10">
                <Users />
              </IconChip>
              <div className="min-w-0">
                <SheetTitle className="text-base">{t('students.detail.linkParent', 'Link parent')}</SheetTitle>
                <SheetDescription className="truncate">{t('students.detail.linkParentHelp', 'Link an existing parent to this student.')}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ParentLinking
            onLinkParent={linkParent}
            onCancel={() => setLinkOpen(false)}
            existingParentMappings={guardians.map((g) => ({ relationship: g.relationship, parent: { id: g.parent.id, full_name: g.parent.full_name } }))}
            studentAdmissionNumber={student.admission_number}
            relationship="father"
            onParentCreated={async () => {
              const fresh = await refresh();
              if (fresh) setStudent(fresh);
              setLinkOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <StudentProfile id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
