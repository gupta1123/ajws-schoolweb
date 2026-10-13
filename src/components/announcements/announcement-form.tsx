// src/components/announcements/announcement-form.tsx
//
// Create / edit form for announcements (shared by both pages). A calm,
// document-style layout: the message reads like a page on the left, and a
// quiet settings rail (type, priority, schedule, actions) sits on the right.

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Briefcase, Check, FileText, GraduationCap, Info, Loader2, Megaphone, TriangleAlert, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateField, TimeField, toISODate } from '@/components/calendar/event-pickers';
import { ClassPicker } from '@/components/shared/class-picker';
import { FormattedTextEditor, emptyAnnouncementFormat } from '@/components/announcements/formatted-text';
import type { AnnouncementTextFormat, AnnouncementType } from '@/lib/api/announcements';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { type } from '@/lib/design/tokens';

type Priority = 'low' | 'medium' | 'high';

export interface AnnouncementFormValues {
  title: string;
  content: string;
  announcement_type: AnnouncementType;
  priority: Priority;
  target_roles: string[];
  target_classes: string[];
  announcement_date: string; // yyyy-MM-dd
  announcement_time: string; // HH:mm
  title_format: AnnouncementTextFormat;
  content_format: AnnouncementTextFormat;
}

interface AnnouncementFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<AnnouncementFormValues>;
  /** Priorities offered (create is limited to low / high). */
  priorities: Priority[];
  /** Attachment picker (create) or manager (edit). */
  attachments: ReactNode;
  /** Short line under the actions, e.g. the re-approval warning. */
  note?: { text: string; tone: 'info' | 'warning' };
  submitting: boolean;
  onSubmit: (values: AnnouncementFormValues) => void;
  onCancel: () => void;
}

const TYPES: { value: AnnouncementType; label: string; icon: ReactNode }[] = [
  { value: 'general', label: 'General', icon: <Megaphone /> },
  { value: 'circular', label: 'Circular', icon: <FileText /> },
  { value: 'urgent', label: 'Urgent', icon: <TriangleAlert /> },
  { value: 'academic', label: 'Academic', icon: <GraduationCap /> },
  { value: 'administrative', label: 'Administrative', icon: <Briefcase /> },
];

// Literal classes so Tailwind generates them.
const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: 'text-tone-info',
  medium: 'text-tone-warning',
  high: 'text-tone-danger',
};

const rail = 'text-xs font-medium text-muted-foreground';

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={type.sectionTitle}>{title}</h2>
        {hint && <p className={type.caption}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function AnnouncementForm({ mode, initial, priorities, attachments, note, submitting, onSubmit, onCancel }: AnnouncementFormProps) {
  const { t, lang } = useI18n();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<AnnouncementFormValues>({
    title: '',
    content: '',
    announcement_type: 'general',
    priority: priorities[0],
    target_roles: [],
    target_classes: [],
    announcement_date: '',
    announcement_time: '09:00',
    title_format: emptyAnnouncementFormat(),
    content_format: emptyAnnouncementFormat(),
    ...initial,
  });
  const set = <K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // parent / student (class parents) are mutually exclusive; teachers toggle freely
  const toggleRole = (role: string) =>
    setValues((prev) => {
      const on = prev.target_roles.includes(role);
      if (role === 'parent' || role === 'student') {
        if (on) {
          return {
            ...prev,
            target_roles: prev.target_roles.filter((r) => r !== role),
            target_classes: role === 'student' ? [] : prev.target_classes,
          };
        }
        return {
          ...prev,
          target_roles: [...prev.target_roles.filter((r) => r !== 'parent' && r !== 'student'), role],
          target_classes: role === 'student' ? prev.target_classes : [],
        };
      }
      return { ...prev, target_roles: on ? prev.target_roles.filter((r) => r !== role) : [...prev.target_roles, role] };
    });

  const today = toISODate(new Date());
  const pastDate = !isEdit && !!values.announcement_date && values.announcement_date < today;
  const pastTime = useMemo(() => {
    if (isEdit || values.announcement_date !== today || !values.announcement_time) return false;
    const [h, m] = values.announcement_time.split(':').map(Number);
    const at = new Date();
    at.setHours(h, m, 0, 0);
    return at < new Date();
  }, [isEdit, values.announcement_date, values.announcement_time, today]);

  const canSubmit =
    !submitting &&
    !!values.title.trim() &&
    !!values.content.trim() &&
    !!values.announcement_date &&
    !!values.announcement_time &&
    values.target_roles.length > 0 &&
    !pastDate &&
    !pastTime;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit(values);
  };

  const roleOptions = [
    {
      value: 'teacher',
      icon: <Briefcase />,
      label: t('announcements.roles.teacher', 'Teachers'),
      desc: t('announcements.roles.desc.teacher', 'All teaching staff'),
    },
    {
      value: 'parent',
      icon: <Users />,
      label: t('announcements.roles.parent', 'All Parents'),
      desc: t('announcements.roles.desc.parent', 'Every parent in the school'),
    },
    {
      value: 'student',
      icon: <User />,
      label: t('announcements.roles.student', 'Specific Class Parents'),
      desc: t('announcements.roles.desc.student', 'Parents of the classes you pick'),
    },
  ];

  const summary = [
    values.announcement_date
      ? (() => {
          const [y, m, d] = values.announcement_date.split('-').map(Number);
          return new Date(y, m - 1, d).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
        })()
      : null,
    values.announcement_time
      ? new Date(2000, 0, 1, +values.announcement_time.slice(0, 2), +values.announcement_time.slice(3, 5)).toLocaleTimeString(lang, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null,
    values.target_roles.length > 0
      ? values.target_roles
          .map((r) => roleOptions.find((o) => o.value === r)?.label)
          .filter(Boolean)
          .join(', ')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-6xl">
      <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Document: title + body, then attachments and audience */}
        <div className="min-w-0 space-y-8 lg:col-start-1">
          <div className="space-y-5">
            <div>
              <Label htmlFor="title" className="sr-only">
                {t('announcements.create.titleLabel', 'Title *')}
              </Label>
              <FormattedTextEditor
                variant="clean"
                id="title"
                value={values.title}
                format={values.title_format}
                onChange={(v) => set('title', v)}
                onFormatChange={(f) => set('title_format', f)}
                placeholder={t('announcements.create.titlePlaceholder', 'Enter announcement title')}
              />
            </div>
            <div className="border-t pt-4">
              <Label htmlFor="content" className="sr-only">
                {t('announcements.create.contentLabel', 'Content *')}
              </Label>
              <FormattedTextEditor
                variant="clean"
                id="content"
                value={values.content}
                format={values.content_format}
                onChange={(v) => set('content', v)}
                onFormatChange={(f) => set('content_format', f)}
                placeholder={t('announcements.create.contentPlaceholder', 'Enter announcement content')}
                multiline
                rows={5}
              />
            </div>
          </div>

          <Block
            title={t('announcements.attachments.title', 'Attachments')}
            hint={isEdit ? undefined : t('announcements.attachments.createDescription', 'Files will be uploaded after the announcement is created.')}
          >
            {attachments}
          </Block>

          <Block title={t('announcements.form.sectionAudience', 'Who should see it?')}>
            <div role="group" aria-label={t('announcements.create.targetRoles', 'Target Roles *')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {roleOptions.map((opt) => {
                const active = values.target_roles.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleRole(opt.value)}
                    className={cn(
                      'relative flex items-start gap-2.5 rounded-xl p-3 text-left ring-1 transition-all focus-visible:outline-none focus-visible:ring-2',
                      active ? 'bg-tone-primary-soft ring-primary' : 'bg-muted/40 ring-transparent hover:bg-muted/70'
                    )}
                  >
                    <span className={cn('mt-0.5 [&_svg]:size-4', active ? 'text-tone-primary' : 'text-muted-foreground')}>{opt.icon}</span>
                    <span className="min-w-0 pr-4">
                      <span className="block text-sm font-medium leading-tight">{opt.label}</span>
                      <span className={cn(type.caption, 'mt-0.5 block')}>{opt.desc}</span>
                    </span>
                    {active && <Check className="absolute right-2.5 top-2.5 size-4 text-tone-primary" />}
                  </button>
                );
              })}
            </div>
            {values.target_roles.length === 0 && (
              <p className="text-xs text-muted-foreground">{t('announcements.create.selectOneRole', 'Please select at least one target role')}</p>
            )}
            {values.target_roles.includes('student') && (
              <div className="space-y-2 pt-1">
                <p className={type.caption}>
                  {t('announcements.create.classesHelp', 'Leave empty to send to all students, or select specific classes for targeted announcements.')}
                </p>
                <ClassPicker selected={values.target_classes} onChange={(ids) => set('target_classes', ids)} />
              </div>
            )}
          </Block>
        </div>

        {/* Settings rail: no boxes, just quiet groups */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:border-l lg:pl-8">
          <div className="space-y-2">
            <Label id="type-label" className={rail}>
              {t('announcements.create.typeLabel', 'Type *')}
            </Label>
            <div role="radiogroup" aria-labelledby="type-label" className="flex flex-wrap gap-1.5">
              {TYPES.map((opt) => {
                const active = values.announcement_type === opt.value;
                const urgent = opt.value === 'urgent';
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('announcement_type', opt.value)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5',
                      active
                        ? urgent
                          ? 'bg-tone-danger-soft font-medium text-tone-danger'
                          : 'bg-tone-primary-soft font-medium text-tone-primary'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {opt.icon}
                    {t(`announcements.type.${opt.value}`, opt.label)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label id="priority-label" className={rail}>
              {t('announcements.create.priorityLabel', 'Priority')}
            </Label>
            <div role="radiogroup" aria-labelledby="priority-label" className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-muted/60 p-0.5">
              {priorities.map((p) => {
                const active = values.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set('priority', p)}
                    className={cn(
                      'h-8 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? cn(PRIORITY_ACTIVE[p], 'bg-background font-medium shadow-sm') : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(`announcements.priority.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-t pt-6">
            <Label htmlFor="announcement_date" className={rail}>
              {t('announcements.create.announcementDate', 'Announcement Date *')}
            </Label>
            <DateField
              id="announcement_date"
              value={values.announcement_date}
              onChange={(v) => set('announcement_date', v)}
              invalid={pastDate}
              min={isEdit ? undefined : today}
            />
            <Label htmlFor="announcement_time" className={cn(rail, 'block pt-2')}>
              {t('announcements.create.announcementTime', 'Announcement Time *')}
            </Label>
            <TimeField id="announcement_time" value={values.announcement_time} onChange={(v) => set('announcement_time', v)} invalid={pastTime} />
            {(pastDate || pastTime) && (
              <p className="text-xs font-medium text-tone-danger">
                {pastDate
                  ? t('announcements.create.pastDateError', 'Cannot create announcements for past dates')
                  : t('announcements.create.pastTimeError', 'Cannot create announcements for past times')}
              </p>
            )}
          </div>

          {/* Actions (floating bar on mobile) */}
          <div className="space-y-3 border-t pt-6 max-lg:fixed max-lg:inset-x-3 max-lg:bottom-3 max-lg:z-30 max-lg:space-y-0 max-lg:rounded-xl max-lg:border max-lg:bg-background max-lg:p-3 max-lg:shadow-lg">
            {summary && <p className={cn(type.caption, 'max-lg:hidden')}>{summary}</p>}
            <div className="flex items-center gap-2 lg:flex-col-reverse lg:items-stretch">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting} className="max-lg:flex-1">
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit} className="max-lg:flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {isEdit ? t('calendar.form.updating', 'Updating...') : t('calendar.form.creating', 'Creating...')}
                  </>
                ) : isEdit ? (
                  t('announcements.edit.update', 'Update Announcement')
                ) : (
                  t('announcements.create.cta', 'Create Announcement')
                )}
              </Button>
            </div>
            {note && (
              <p
                className={cn(
                  'flex items-start gap-1 text-[11px] leading-snug max-lg:hidden',
                  note.tone === 'warning' ? 'text-tone-warning' : 'text-muted-foreground'
                )}
              >
                <Info className="mt-0.5 size-3 shrink-0" />
                {note.text}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* room so the floating mobile action bar never covers content */}
      <div className="h-24 lg:hidden" aria-hidden />
    </form>
  );
}
