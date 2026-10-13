// src/app/(admin)/staff/page.tsx

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Plus, Search, UserCog, Users } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useStaff } from '@/hooks/use-staff';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, IconChip, InlineError, Pill } from '@/components/ui/page-kit';
import { cn } from '@/lib/utils';
import { surface, type } from '@/lib/design/tokens';
import type { Staff } from '@/types/staff';

type Filter = 'all' | 'classTeacher' | 'subjectTeacher' | 'unassigned';

const MAX_SUBJECTS = 3;

const initialsOf = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

// the API repeats a class once per academic year / assignment
const classesOf = (s: Staff) => Array.from(new Set((s.teaching_details?.class_teacher_of ?? []).map((c) => c.class_name).filter(Boolean)));
const subjectsOf = (s: Staff) => Array.from(new Set(s.teaching_details?.subjects_taught ?? []));

const rowGrid = 'grid items-center gap-x-4 px-4 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_4.5rem]';

export default function StaffPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { staff, loading, error, clearError, refreshStaff } = useStaff();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const canAccess = user?.role === 'admin' || user?.role === 'principal';

  const kindOf = (s: Staff): Filter =>
    classesOf(s).length > 0 ? 'classTeacher' : subjectsOf(s).length > 0 ? 'subjectTeacher' : 'unassigned';

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: staff.length, classTeacher: 0, subjectTeacher: 0, unassigned: 0 };
    staff.forEach((s) => {
      c[kindOf(s)] += 1;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((s) => filter === 'all' || kindOf(s) === filter)
      .filter(
        (s) =>
          !q ||
          s.full_name.toLowerCase().includes(q) ||
          s.phone_number?.toLowerCase().includes(q) ||
          s.designation?.toLowerCase().includes(q) ||
          subjectsOf(s).some((x) => x.toLowerCase().includes(q)) ||
          classesOf(s).some((x) => x.toLowerCase().includes(q))
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, query, filter]);

  if (!canAccess) {
    return (
      <EmptyState title={t('access.deniedTitle', 'Access Denied')} help={t('access.adminsOnly', 'Only admins and principals can access this page.')} />
    );
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: t('staff.tabs.all', 'All') },
    { key: 'classTeacher', label: t('staff.tabs.classTeachers', 'Class teachers') },
    { key: 'subjectTeacher', label: t('staff.tabs.subjectTeachers', 'Subject teachers') },
    { key: 'unassigned', label: t('staff.tabs.unassigned', 'No assignments') },
  ];
  const initialLoad = loading && staff.length === 0;

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('staff.searchPlaceholder', 'Search by name, phone, subject or class...')}
              aria-label={t('staff.searchPlaceholder', 'Search staff')}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/staff/assign-subjects">
                <UserCog />
                {t('staff.assignSubjects', 'Assign Subjects')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/staff/create">
                <Plus />
                {t('staff.addStaff', 'Add Staff')}
              </Link>
            </Button>
          </div>
        </div>

        {error && <InlineError title={error} onRetry={() => { clearError(); void refreshStaff(); }} retryLabel={t('actions.refresh', 'Refresh')} />}

        <section className={cn(surface.panel, 'overflow-hidden')}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
            <div role="tablist" className="flex flex-wrap items-center gap-1">
              {tabs.map((tab) => {
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'bg-tone-primary-soft font-medium text-tone-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {tab.label}
                    <span className="text-xs tabular-nums">{counts[tab.key]}</span>
                  </button>
                );
              })}
            </div>
            <span className={cn(type.caption, 'tabular-nums')}>
              {t('staff.countLabel', '{n} staff').replace('{n}', String(rows.length))}
            </span>
          </header>

          <div className={cn(rowGrid, 'hidden border-b bg-muted/30 py-2 md:grid')}>
            <span className={type.label}>{t('staff.cols.name', 'Name')}</span>
            <span className={type.label}>{t('staff.cols.classTeacherOf', 'Class Teacher Of')}</span>
            <span className={type.label}>{t('staff.cols.subjectsTaught', 'Subjects Taught')}</span>
            <span />
          </div>

          {initialLoad ? (
            <ul className="divide-y" aria-busy>
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className={cn(rowGrid, 'py-3')}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
                  <Skeleton className="hidden h-5 w-44 rounded-full md:block" />
                  <Skeleton className="h-8 w-16" />
                </li>
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={query || filter !== 'all' ? t('staff.empty.noMatch', 'No staff found matching the search term') : t('staff.empty.noStaff', 'No staff members found')}
            />
          ) : (
            <ul className={cn('divide-y transition-opacity', loading && 'opacity-60')}>
              {rows.map((s) => {
                const classes = classesOf(s);
                const subjects = subjectsOf(s);
                return (
                  <li key={s.id} className={cn(rowGrid, 'relative gap-y-1.5 py-2.5', surface.rowHover)}>
                    {/* whole row opens the profile; the action buttons sit above this link */}
                    <Link href={`/staff/${s.id}`} className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={s.full_name} />

                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip className="size-9 rounded-full text-xs font-semibold">{initialsOf(s.full_name)}</IconChip>
                      <div className="min-w-0">
                        <p className={cn(type.rowTitle, 'flex items-center gap-2 truncate')}>
                          <span className="truncate">{s.full_name}</span>
                          {s.is_active === false && <Pill>{t('staff.inactive', 'Inactive')}</Pill>}
                        </p>
                        <p className={cn(type.caption, 'truncate tabular-nums')}>
                          {[s.phone_number, s.designation].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 col-start-1 flex min-w-0 flex-wrap items-center gap-1 pl-12 md:col-span-1 md:col-start-auto md:pl-0">
                      {classes.length > 0 ? (
                        classes.map((c) => (
                          <Pill key={c} tone="primary">
                            {c}
                          </Pill>
                        ))
                      ) : (
                        <span className="hidden text-sm text-muted-foreground md:inline">—</span>
                      )}
                    </div>

                    <div className="col-span-2 col-start-1 flex min-w-0 flex-wrap items-center gap-1 pl-12 md:col-span-1 md:col-start-auto md:pl-0">
                      {subjects.length > 0 ? (
                        <>
                          {subjects.slice(0, MAX_SUBJECTS).map((x) => (
                            <Pill key={x} className="max-w-full truncate">
                              {x}
                            </Pill>
                          ))}
                          {subjects.length > MAX_SUBJECTS && (
                            <span title={subjects.slice(MAX_SUBJECTS).join(', ')} className="text-xs text-muted-foreground">
                              +{subjects.length - MAX_SUBJECTS}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="hidden text-sm text-muted-foreground md:inline">—</span>
                      )}
                    </div>

                    <div className="relative z-10 row-start-1 flex items-center justify-end gap-0.5 col-start-2 md:col-start-auto md:row-start-auto">
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" asChild>
                        <Link href={`/staff/${s.id}`} aria-label={t('actions.view', 'View')} title={t('actions.view', 'View')}>
                          <Eye />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
