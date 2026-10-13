// src/app/(admin)/staff/[id]/page.tsx
//
// Staff profile. Opens read-only; "Edit" turns the same page into a form in
// place (Save / Cancel pinned to the bottom), so there is no separate edit
// screen. Teachers also get Teaching and Timetable tabs.

'use client';

import { Suspense, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Briefcase, Cake, CalendarDays, Clock, GraduationCap, HeartPulse, KeyRound, Loader2, Mail, MapPin, MoreHorizontal, Pencil, Phone, Plus, Power, Shield, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { staffServices } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState, IconChip, InlineError, ListRow, Panel, Pill, RowList } from '@/components/ui/page-kit';
import { DateField, parseISODate } from '@/components/calendar/event-pickers';
import { BirthDateField, FieldShell, TextField, draftFromStaff, usePhoneOwners, validateDraft, type StaffDraft } from '@/components/staff/staff-fields';
import { initialsOf, useRoleText } from '@/components/staff/staff-form';
import { StaffSubjectsDialog } from '@/components/staff/staff-subjects-dialog';
import { StaffPasswordDialog } from '@/components/staff/staff-password-dialog';
import { StaffTimetable } from '@/components/staff/staff-timetable';
import { surface, type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';
import type { Staff, UpdateStaffRequest } from '@/types/staff';

/* ------------------------------ helpers ------------------------------ */

const unique = <T,>(items: T[], key: (i: T) => string) => {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(key(i)) ? false : (seen.add(key(i)), true)));
};

/* ------------------------------- page -------------------------------- */

function StaffProfile({ id }: { id: string }) {
  const { user, token } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const roleText = useRoleText();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState('teaching');

  const [confirm, setConfirm] = useState<null | 'delete' | 'status' | 'discard'>(null);
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);

  const phoneOwners = usePhoneOwners(id);
  const canManage = user?.role === 'admin' || user?.role === 'principal';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    // there is no single-staff endpoint, so find the member in the full list
    staffServices
      .getStaff(token, { limit: 200 })
      .then((r) => {
        if (cancelled) return;
        const found = r.status === 'success' ? r.data.staff.find((s) => s.id === id) : undefined;
        if (!found) throw new Error(t('staff.detail.notFound', 'Staff member not found'));
        setStaff(found);
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : t('staff.detail.errorTitle', 'Failed to fetch staff details')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, attempt]);

  // opened with ?edit=1 (the old edit route redirects here)
  useEffect(() => {
    if (staff && editing && !draft) setDraft(draftFromStaff(staff));
  }, [staff, editing, draft]);

  const original = useMemo(() => (staff ? draftFromStaff(staff) : null), [staff]);
  const dirty = Boolean(editing && draft && original && (Object.keys(draft) as (keyof StaffDraft)[]).some((k) => draft[k] !== original[k]));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const startEdit = useCallback(() => {
    if (!staff) return;
    setDraft(draftFromStaff(staff));
    setSaveError(null);
    setTab('teaching');
    setEditing(true);
  }, [staff]);

  const stopEdit = () => {
    // drop ?edit=1 so a refresh opens the read-only view
    if (searchParams.get('edit')) window.history.replaceState(null, '', window.location.pathname);
    setEditing(false);
    setDraft(null);
    setSaveError(null);
    setConfirm(null);
  };

  const isTeacher = staff?.role === 'teacher';
  const active = staff?.is_active !== false;
  const teacherId = staff?.user_id;

  // Edit + overflow menu, top right of the profile
  const actions =
    staff && canManage && !editing ? (
      <div className="flex shrink-0 items-center gap-1 self-start">
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
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
              <KeyRound />
              {t('staff.password.title', 'Reset password')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setConfirm('status')}>
              <Power />
              {active ? t('staff.detail.markInactive', 'Mark as inactive') : t('staff.detail.markActive', 'Mark as active')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-tone-danger focus:text-tone-danger" onSelect={() => setConfirm('delete')}>
              <Trash2 />
              {t('actions.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null;

  const set = <K extends keyof StaffDraft>(key: K, value: StaffDraft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const errors = draft ? validateDraft(draft, t, phoneOwners) : {};
  const [touched, setTouched] = useState(false);
  const show = (m?: string) => (touched ? m : undefined);

  const save = async () => {
    if (!token || !staff || !draft || !original) return;
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setSaveError(null);

    const clean = (v: string) => v.trim();
    const changed = (k: keyof StaffDraft) => clean(draft[k]) !== clean(original[k]);
    let next: Staff = staff;
    const failures: string[] = [];

    // 1) staff record
    const body: UpdateStaffRequest = {};
    if (changed('fullName')) body.full_name = clean(draft.fullName);
    if (changed('phone')) body.phone_number = clean(draft.phone);
    if (changed('email')) body.email = clean(draft.email) || null;
    if (changed('designation')) body.designation = clean(draft.designation);
    if (changed('joiningDate')) body.joining_date = draft.joiningDate || null;
    if (changed('address')) body.address = clean(draft.address) || null;
    if (changed('emergencyName')) body.emergency_contact = clean(draft.emergencyName) || null;
    if (changed('emergencyPhone')) body.emergency_contact_phone = clean(draft.emergencyPhone) || null;
    if (Object.keys(body).length > 0) {
      try {
        const r = await staffServices.updateStaff(staff.id, body, token);
        if (r.status !== 'success') throw new Error();
        next = { ...next, ...body } as Staff;
      } catch {
        failures.push(t('staff.detail.saveParts.details', 'details'));
      }
    }

    // 2) the login account: it signs in by phone, so name / phone / email must follow
    if (staff.user_id && failures.length === 0 && (body.full_name || body.phone_number || body.email)) {
      try {
        const r = await staffServices.updateUserAccount(
          staff.user_id,
          { ...(body.full_name && { full_name: body.full_name }), ...(body.phone_number && { phone_number: body.phone_number }), ...(body.email && { email: body.email }) },
          token
        );
        if ('status' in r && r.status !== 'success') throw new Error();
      } catch {
        failures.push(t('staff.detail.saveParts.login', 'login account'));
      }
    }

    // 3) date of birth has its own endpoint (it cannot be cleared once set)
    if (changed('dob') && draft.dob) {
      try {
        const r = await staffServices.updateStaffDateOfBirth(staff.id, draft.dob, token);
        if ('status' in r && r.status !== 'success') throw new Error();
        next = { ...next, date_of_birth: draft.dob };
      } catch {
        failures.push(t('staff.detail.saveParts.dob', 'date of birth'));
      }
    }

    setStaff(next);
    setSaving(false);
    if (failures.length === 0) {
      toast({ title: t('staff.updated', 'Staff member updated'), variant: 'success' });
      setTouched(false);
      stopEdit();
    } else {
      setSaveError(t('staff.detail.saveFailed', 'Could not save: {parts}. Everything else was saved.').replace('{parts}', failures.join(', ')));
    }
  };

  const toggleStatus = async () => {
    if (!token || !staff) return;
    setBusy(true);
    try {
      const r = await staffServices.updateStaff(staff.id, { is_active: !active }, token);
      if (r.status !== 'success') throw new Error();
      setStaff({ ...staff, is_active: !active });
      toast({ title: active ? t('staff.detail.nowInactive', 'Marked as inactive') : t('staff.detail.nowActive', 'Marked as active'), variant: 'success' });
      setConfirm(null);
    } catch {
      toast({ title: t('staff.detail.statusFailed', 'Could not change the status'), variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!token || !staff) return;
    setBusy(true);
    try {
      const r = await staffServices.deleteStaff(staff.id, token);
      if (r.status !== 'success') throw new Error();
      toast({ title: t('staff.deleted', 'Staff member deleted'), variant: 'success' });
      router.push('/staff');
    } catch {
      toast({ title: t('staff.delete.failed', 'Could not delete the staff member'), variant: 'error' });
      setBusy(false);
    }
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

  if (loadError || !staff) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <InlineError title={t('staff.detail.errorTitle', 'Error Loading Staff Details')} detail={loadError ?? undefined} onRetry={() => setAttempt((a) => a + 1)} retryLabel={t('actions.refresh', 'Refresh')} />
      </div>
    );
  }

  const fmtDate = (iso?: string | null) => {
    const d = iso ? parseISODate(iso.slice(0, 10)) : undefined;
    return d ? d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  };

  // "Birthday in 12 days" and "2 yr 3 mo with the school"
  const birthdayHint = (() => {
    const d = staff.date_of_birth ? parseISODate(staff.date_of_birth.slice(0, 10)) : undefined;
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
    const j = staff.joining_date ? parseISODate(staff.joining_date.slice(0, 10)) : undefined;
    if (!j) return '';
    const now = new Date();
    const months = Math.max(0, (now.getFullYear() - j.getFullYear()) * 12 + now.getMonth() - j.getMonth());
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0 && m === 0) return t('staff.detail.justJoined', 'Joined this month');
    return [y > 0 && t('staff.detail.years', '{n} yr').replace('{n}', String(y)), m > 0 && t('staff.detail.months', '{n} mo').replace('{n}', String(m))].filter(Boolean).join(' ');
  })();

  const shownName = editing && draft ? draft.fullName.trim() : staff.full_name;
  const shownDesignation = (editing && draft ? draft.designation.trim() : staff.designation) || roleText.label(staff.role);

  const classTeacher = unique(staff.teaching_details?.class_teacher_of ?? [], (c) => c.class_division_id);
  const subjectClasses = unique(staff.teaching_details?.subject_teacher_of ?? [], (c) => `${c.class_division_id}|${c.subject}`);
  const subjectsTaught = staff.teaching_details?.subjects_taught ?? [];
  // one row per class, listing the subjects taught there
  const byClass = Array.from(subjectClasses.reduce((m, c) => m.set(c.class_name, [...(m.get(c.class_name) ?? []), c.subject]), new Map<string, string[]>())).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true })
  );

  const activeLabel = active ? t('academicSetup.status.active', 'Active') : t('academicSetup.status.inactive', 'Inactive');
  const stats: { label: string; value: string; icon: ReactNode; tone: 'primary' | 'violet' | 'success' | 'warning' | 'neutral' }[] = isTeacher
    ? [
        { label: t('staff.detail.stats.classTeacher', 'Class teacher of'), value: String(classTeacher.length), icon: <Users />, tone: 'primary' },
        { label: t('staff.detail.stats.classesTaught', 'Classes taught'), value: String(byClass.length), icon: <GraduationCap />, tone: 'violet' },
        { label: t('staff.detail.stats.subjects', 'Subjects'), value: String(subjectsTaught.length), icon: <BookOpen />, tone: 'success' },
        { label: t('staff.detail.stats.withSchool', 'With the school'), value: tenure || '—', icon: <CalendarDays />, tone: 'warning' },
      ]
    : [
        { label: t('staff.form.labels.role', 'Role'), value: roleText.label(staff.role), icon: <Shield />, tone: 'primary' },
        { label: t('staff.form.labels.accountStatus', 'Account Status'), value: activeLabel, icon: <Power />, tone: active ? 'success' : 'neutral' },
        { label: t('staff.detail.stats.withSchool', 'With the school'), value: tenure || '—', icon: <CalendarDays />, tone: 'warning' },
        { label: t('staff.detail.addedOn', 'Added on'), value: fmtDate(staff.created_at) || '—', icon: <Clock />, tone: 'neutral' },
      ];

  // the designation often just repeats the role ("Teacher"), so only show it when it adds something
  const extraTitle = shownDesignation !== roleText.label(staff.role) ? shownDesignation : '';

  const hero = (
    <div className={cn(surface.panel, 'overflow-hidden')}>
      <div className="flex items-center gap-3 bg-gradient-to-br from-tone-primary-soft to-transparent px-4 py-3">
        <IconChip className="size-12 rounded-full text-base font-semibold ring-2 ring-background" tone={active ? 'primary' : 'neutral'}>
          {initialsOf(shownName) || '?'}
        </IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold leading-tight">{shownName || staff.full_name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill tone="primary">{roleText.label(staff.role)}</Pill>
            <Pill tone={active ? 'success' : 'neutral'}>{activeLabel}</Pill>
            {birthdayHint && <Pill tone="rose">{birthdayHint}</Pill>}
            {extraTitle && <span className="text-xs text-muted-foreground">{extraTitle}</span>}
          </div>
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            {staff.phone_number && (
              <Button asChild size="icon" variant="ghost" className="size-8 text-muted-foreground" title={staff.phone_number}>
                <a href={`tel:${staff.phone_number}`} aria-label={t('actions.call', 'Call')}>
                  <Phone />
                </a>
              </Button>
            )}
            {staff.email && (
              <Button asChild size="icon" variant="ghost" className="size-8 text-muted-foreground" title={staff.email}>
                <a href={`mailto:${staff.email}`} aria-label={t('actions.email', 'Email')}>
                  <Mail />
                </a>
              </Button>
            )}
          </div>
        )}
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

  type DetailRow = { icon: ReactNode; label: string; value?: string | null };
  const rows: Record<'contact' | 'personal' | 'work', DetailRow[]> = {
    contact: [
      { icon: <Phone />, label: t('staff.form.labels.phoneNumber', 'Phone Number'), value: staff.phone_number },
      { icon: <Mail />, label: t('staff.form.labels.email', 'Email'), value: staff.email },
      { icon: <MapPin />, label: t('staff.form.labels.address', 'Address'), value: staff.address },
    ],
    personal: [
      { icon: <Cake />, label: t('staff.form.labels.dob', 'Date of birth'), value: fmtDate(staff.date_of_birth) },
      { icon: <HeartPulse />, label: t('staff.form.labels.emergencyName', 'Emergency contact'), value: [staff.emergency_contact, staff.emergency_contact_phone].filter(Boolean).join(' · ') },
    ],
    work: [
      { icon: <Briefcase />, label: t('staff.form.labels.designation', 'Designation'), value: extraTitle },
      { icon: <CalendarDays />, label: t('staff.form.labels.joiningDate', 'Joining date'), value: fmtDate(staff.joining_date) },
    ],
  };
  const missing = Object.values(rows)
    .flat()
    .filter((r) => !r.value).length;

  const detailPanel = (title: string, items: DetailRow[]) => {
    const filled = items.filter((r) => r.value);
    if (filled.length === 0) return null;
    return (
      <Panel title={title} flush>
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
    );
  };

  const rail = (
    <aside className="space-y-4">
      {detailPanel(t('staff.detail.contact', 'Contact'), rows.contact)}
      {detailPanel(t('staff.detail.personal', 'Personal'), rows.personal)}
      {detailPanel(t('staff.detail.work', 'Work'), rows.work)}
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

  const teaching = (
    <div className="space-y-4">
      <Panel title={t('teacherRoles.classTeacher', 'Class Teacher')} count={classTeacher.length} icon={<Users />} flush>
        {classTeacher.length > 0 ? (
          <RowList>
            {classTeacher.map((c) => (
              <ListRow
                key={c.class_division_id}
                icon={
                  <IconChip>
                    <Users />
                  </IconChip>
                }
                title={c.class_name}
                subtitle={c.academic_year}
              />
            ))}
          </RowList>
        ) : (
          <EmptyState icon={<Users />} title={t('staff.detail.noClassTeacher', 'No class teacher assignments')} />
        )}
      </Panel>

      <Panel title={t('staff.detail.subjectTeaching', 'Subject Teaching')} count={byClass.length} icon={<GraduationCap />} flush>
        {byClass.length > 0 ? (
          <ul className="divide-y">
            {byClass.map(([className, subjects]) => (
              <li key={className} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5">
                <p className="w-28 shrink-0 text-sm font-medium">{className}</p>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {subjects.map((sub) => (
                    <Pill key={sub} tone="violet">
                      {sub}
                    </Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<GraduationCap />} title={t('staff.detail.noSubjectTeaching', 'No subject teaching assignments')} />
        )}
      </Panel>

      <Panel
        title={t('staff.detail.teachingSubjects', 'Teaching Subjects')}
        count={subjectsTaught.length}
        icon={<BookOpen />}
        action={
          teacherId ? (
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setSubjectsOpen(true)}>
              {subjectsTaught.length > 0 ? <Pencil /> : <Plus />}
              {subjectsTaught.length > 0 ? t('staff.detail.manageSubjects', 'Manage Subjects') : t('staff.assignSubjects', 'Assign Subjects')}
            </Button>
          ) : undefined
        }
      >
        {subjectsTaught.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {subjectsTaught.map((sub) => (
              <Pill key={sub} tone="primary">
                {sub}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('staff.detail.noSubjects', 'No subjects assigned')}</p>
        )}
      </Panel>
    </div>
  );

  const roleCard = (
    <Panel title={t('staff.detail.roleAccess', 'Role & access')} icon={<Shield />}>
      <div className="flex items-start gap-3">
        <IconChip className="size-10">
          <Shield />
        </IconChip>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{roleText.label(staff.role)}</p>
          <p className="text-sm text-muted-foreground">{roleText.help(staff.role)}</p>
        </div>
      </div>
    </Panel>
  );

  const editForm = draft && (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title={t('staff.detail.contact', 'Contact')} icon={<Phone />} className="md:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="e-name" label={t('staff.form.labels.fullName', 'Full Name')} value={draft.fullName} onChange={(v) => set('fullName', v)} error={show(errors.fullName)} />
          <TextField id="e-phone" type="tel" label={t('staff.form.labels.phoneNumber', 'Phone Number')} value={draft.phone} onChange={(v) => set('phone', v)} error={show(errors.phone)} />
          <TextField id="e-email" type="email" optional label={t('staff.form.labels.email', 'Email')} value={draft.email} onChange={(v) => set('email', v)} error={show(errors.email)} />
          <TextField id="e-address" optional label={t('staff.form.labels.address', 'Address')} value={draft.address} onChange={(v) => set('address', v)} />
        </div>
        <p className={cn(type.caption, 'mt-3')}>{t('staff.detail.phoneLoginHint', 'The phone number is also their sign-in number.')}</p>
      </Panel>
      <Panel title={t('staff.detail.personal', 'Personal')} icon={<Cake />}>
        <div className="space-y-4">
          <BirthDateField id="e-dob" label={t('staff.form.labels.dob', 'Date of birth')} value={draft.dob} onChange={(v) => set('dob', v)} clearable={!original?.dob} />
          <TextField id="e-em-name" optional label={t('staff.form.labels.emergencyName', 'Emergency contact')} value={draft.emergencyName} onChange={(v) => set('emergencyName', v)} />
          <TextField id="e-em-phone" type="tel" optional label={t('staff.form.labels.emergencyPhone', 'Emergency phone')} value={draft.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} error={show(errors.emergencyPhone)} />
        </div>
      </Panel>
      <Panel title={t('staff.detail.work', 'Work')} icon={<Briefcase />}>
        <div className="space-y-4">
          <TextField id="e-designation" optional label={t('staff.form.labels.designation', 'Designation')} value={draft.designation} onChange={(v) => set('designation', v)} placeholder={roleText.label(staff.role)} />
          <FieldShell label={t('staff.form.labels.joiningDate', 'Joining date')} optional htmlFor="e-joining">
            <DateField id="e-joining" value={draft.joiningDate} onChange={(v) => set('joiningDate', v)} onClear={() => set('joiningDate', '')} hideQuickPicks yearDropdown />
          </FieldShell>
          <p className={type.caption}>{t('staff.form.lockedHint', 'Role and status cannot be changed here.')}</p>
        </div>
      </Panel>
    </div>
  );

  const main = editing ? (
    editForm
  ) : isTeacher ? (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="teaching">{t('staff.detail.tabs.teaching', 'Teaching')}</TabsTrigger>
        <TabsTrigger value="timetable">{t('staff.detail.tabs.timetable', 'Timetable')}</TabsTrigger>
      </TabsList>
      <TabsContent value="teaching">{teaching}</TabsContent>
      <TabsContent value="timetable">{teacherId ? <StaffTimetable teacherId={teacherId} /> : <EmptyState title={t('staff.timetable.noAccount', 'No linked teacher account')} />}</TabsContent>
    </Tabs>
  ) : (
    roleCard
  );

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
            <Button variant="ghost" onClick={() => (dirty ? setConfirm('discard') : stopEdit())} disabled={saving}>
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
            <DialogTitle>
              {confirm === 'delete' && t('staff.delete.title', 'Delete Staff Member')}
              {confirm === 'status' && (active ? t('staff.detail.markInactive', 'Mark as inactive') : t('staff.detail.markActive', 'Mark as active'))}
              {confirm === 'discard' && t('staff.detail.discardTitle', 'Discard changes?')}
            </DialogTitle>
            <DialogDescription>
              {confirm === 'delete' && `${t('staff.delete.confirm', 'Are you sure you want to delete')} “${staff.full_name}”? ${t('staff.delete.warningDesc', 'Deleting this staff member will also remove all their assignments and cannot be recovered.')}`}
              {confirm === 'status' &&
                (active
                  ? t('staff.detail.inactiveHelp', '{name} will be shown as inactive. You can switch this back at any time.').replace('{name}', staff.full_name)
                  : t('staff.detail.activeHelp', '{name} will be shown as active again.').replace('{name}', staff.full_name))}
              {confirm === 'discard' && t('staff.detail.discardHelp', 'Your edits to this profile have not been saved.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              {confirm === 'discard' ? t('staff.detail.keepEditing', 'Keep editing') : t('actions.cancel', 'Cancel')}
            </Button>
            {confirm === 'delete' && (
              <Button variant="destructive" onClick={remove} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {t('actions.delete', 'Delete')}
              </Button>
            )}
            {confirm === 'status' && (
              <Button onClick={toggleStatus} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {t('actions.confirm', 'Confirm')}
              </Button>
            )}
            {confirm === 'discard' && (
              <Button variant="destructive" onClick={stopEdit}>
                {t('staff.detail.discard', 'Discard')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StaffPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} userId={staff.user_id} staffName={staff.full_name} />
      {teacherId && (
        <StaffSubjectsDialog
          open={subjectsOpen}
          onOpenChange={setSubjectsOpen}
          staffName={staff.full_name}
          teacherId={teacherId}
          current={subjectsTaught}
          onSaved={(subjects) => setStaff((s) => (s ? { ...s, teaching_details: { ...s.teaching_details, subjects_taught: subjects } } : s))}
        />
      )}
    </div>
  );
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <StaffProfile id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
