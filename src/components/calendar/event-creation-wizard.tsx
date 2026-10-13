// src/components/calendar/event-creation-wizard.tsx
//
// Create / edit form for calendar events. Same props and submit payload as
// before; layout is a single column of compact sections with a sticky footer.

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DateField, TimeField } from '@/components/calendar/event-pickers';
import { ClassPicker } from '@/components/shared/class-picker';
import { Loader2, Check, School, BookOpen, User, Info } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import type { CalendarEvent } from '@/lib/api/calendar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { surface, type } from '@/lib/design/tokens';

type EventType = 'school_wide' | 'class_specific' | 'teacher_specific';
type EventCategory = 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  eventType: EventType;
  classDivisionIds: string[];
  eventCategory: EventCategory;
}

interface EventCreationWizardProps {
  initialDate?: string;
  event?: CalendarEvent; // Optional event for edit mode
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CATEGORIES: EventCategory[] = ['general', 'academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'];

const timeToMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const minToTime = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const fmtTime = (hhmm: string, lang: string) =>
  new Date(2000, 0, 1, Math.floor(timeToMin(hhmm) / 60), timeToMin(hhmm) % 60).toLocaleTimeString(lang, {
    hour: 'numeric',
    minute: '2-digit',
  });

function Section({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(surface.panel, 'overflow-hidden', className)}>
      <header className="flex items-baseline justify-between gap-2 border-b px-4 py-2.5">
        <h2 className={type.sectionTitle}>{title}</h2>
        {hint && <p className={type.caption}>{hint}</p>}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export function EventCreationWizard({ initialDate, event, onSubmit, onCancel, isLoading }: EventCreationWizardProps) {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const isEditMode = !!event;
  const autoApproved = user?.role === 'admin' || user?.role === 'principal';

  // Default form data based on edit mode or initial values
  const defaultFormData = useMemo((): EventFormData => {
    if (event) {
      return {
        title: event.title || '',
        description: event.description || '',
        date: event.event_date ? event.event_date.split('T')[0] : '',
        startTime: event.start_time ? event.start_time.substring(0, 5) : '09:00',
        endTime: event.end_time ? event.end_time.substring(0, 5) : '10:00',
        isFullDay: !event.start_time && !event.end_time,
        eventType: (event.event_type as EventType) || 'school_wide',
        classDivisionIds:
          event.class_division_ids && event.class_division_ids.length > 0
            ? event.class_division_ids
            : event.class_division_id
            ? [event.class_division_id]
            : [],
        eventCategory: (event.event_category as EventCategory) || 'general',
      };
    }
    return {
      title: '',
      description: '',
      date: initialDate || '',
      startTime: '09:00',
      endTime: '10:00',
      isFullDay: false,
      eventType: 'school_wide',
      classDivisionIds: [],
      eventCategory: 'general',
    };
  }, [event, initialDate]);

  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  useEffect(() => {
    setFormData(defaultFormData);
  }, [defaultFormData]);

  const setField = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const setEventType = (value: EventType) =>
    setFormData((prev) => ({
      ...prev,
      eventType: value,
      classDivisionIds: value === 'class_specific' ? prev.classDivisionIds : [],
    }));

  // Validation
  const needsClasses = formData.eventType === 'class_specific' && formData.classDivisionIds.length === 0;
  const badTimeRange = !formData.isFullDay && !!formData.startTime && !!formData.endTime && formData.endTime <= formData.startTime;
  const canSubmit = !isLoading && !!formData.title.trim() && !!formData.date && !needsClasses && !badTimeRange;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...formData,
      classDivisionIds: formData.eventType === 'class_specific' ? formData.classDivisionIds : [],
    });
  };

  // Summary line for the footer
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (formData.date) {
      const d = new Date(`${formData.date}T00:00:00`);
      if (!isNaN(d.getTime())) {
        parts.push(d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }));
      }
    }
    parts.push(
      formData.isFullDay
        ? t('calendar.form.labels.fullDay', 'Full day')
        : `${fmtTime(formData.startTime, lang)} – ${fmtTime(formData.endTime, lang)}`
    );
    parts.push(
      formData.eventType === 'class_specific'
        ? `${formData.classDivisionIds.length} ${t('calendar.form.summary.classesShort', 'classes')}`
        : t(
            `calendar.form.eventType.${formData.eventType}`,
            formData.eventType === 'school_wide' ? 'School wide' : 'Teacher specific'
          )
    );
    return parts.join(' · ');
  }, [formData, lang, t]);

  const typeOptions: { value: EventType; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      value: 'school_wide',
      icon: <School />,
      label: t('calendar.form.eventType.school_wide', 'School Wide'),
      desc: t('calendar.form.eventTypeDesc.school_wide', 'Everyone in the school'),
    },
    {
      value: 'class_specific',
      icon: <BookOpen />,
      label: t('calendar.form.eventType.class_specific', 'Class Specific'),
      desc: t('calendar.form.eventTypeDesc.class_specific', 'Only selected classes'),
    },
    {
      value: 'teacher_specific',
      icon: <User />,
      label: t('calendar.form.eventType.teacher_specific', 'Teacher Specific'),
      desc: t('calendar.form.eventTypeDesc.teacher_specific', 'Teachers and staff only'),
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-6xl">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Details */}
        <Section title={t('calendar.form.section.basics', 'Details')} className="lg:col-start-1">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t('calendar.form.labels.title', 'Event Title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={t('calendar.form.placeholders.title', 'e.g., School Assembly, Sports Day, etc.')}
              required
              autoFocus={!isEditMode}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t('calendar.form.labels.description', 'Description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder={t('calendar.form.placeholders.description', 'Enter event description')}
              rows={3}
              className="min-h-20 resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <Label id="category-label">{t('calendar.form.labels.category', 'Event Category')}</Label>
            <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = formData.eventCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setField('eventCategory', c)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-primary bg-tone-primary-soft font-medium text-tone-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {active && <Check className="size-3.5" />}
                    {t(`calendar.form.category.${c}`, c)}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Schedule + actions (right column on desktop) */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Section title={t('calendar.form.section.when', 'When')}>
            <div className="space-y-1.5">
              <Label htmlFor="date">{t('calendar.form.labels.date', 'Date')}</Label>
              <DateField id="date" value={formData.date} onChange={(v) => setField('date', v)} invalid={!formData.date} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <Label htmlFor="isFullDay" className="cursor-pointer font-normal">
                {t('calendar.form.labels.fullDay', 'Full Day')}
              </Label>
              <Switch id="isFullDay" checked={formData.isFullDay} onCheckedChange={(v) => setField('isFullDay', v)} />
            </div>

            <div className={cn('grid grid-cols-2 gap-3 transition-opacity', formData.isFullDay && 'pointer-events-none opacity-50')}>
              <div className="space-y-1.5">
                <Label htmlFor="startTime">{t('calendar.form.labels.start', 'Start')}</Label>
                <TimeField
                  id="startTime"
                  value={formData.startTime}
                  onChange={(v) => {
                    // keep the same duration when the start moves
                    setFormData((prev) => {
                      const dur = Math.max(15, timeToMin(prev.endTime) - timeToMin(prev.startTime));
                      const end = Math.min(23 * 60 + 45, timeToMin(v) + dur);
                      return { ...prev, startTime: v, endTime: minToTime(end) };
                    });
                  }}
                  disabled={formData.isFullDay}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">{t('calendar.form.labels.end', 'End')}</Label>
                <TimeField
                  id="endTime"
                  value={formData.endTime}
                  onChange={(v) => setField('endTime', v)}
                  disabled={formData.isFullDay}
                  invalid={badTimeRange}
                  after={formData.startTime}
                />
              </div>
            </div>
            {badTimeRange && (
              <p className="text-xs font-medium text-tone-danger">
                {t('calendar.form.errors.endBeforeStart', 'End time must be after the start time.')}
              </p>
            )}
          </Section>

          {/* Summary + actions */}
          <div className={cn(surface.panel, 'space-y-3 p-4 max-lg:fixed max-lg:inset-x-3 max-lg:bottom-3 max-lg:z-30 max-lg:space-y-2 max-lg:p-3 max-lg:shadow-lg')}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{formData.title.trim() || t('calendar.form.untitled', 'Untitled event')}</p>
              <p className={cn(type.caption, 'mt-0.5')}>{summary}</p>
              {!autoApproved && (
                <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-tone-warning max-lg:hidden">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  {t('calendar.form.needsApproval', 'Needs principal approval before it appears on the calendar')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 lg:flex-col-reverse lg:items-stretch">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="max-lg:flex-1">
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit} className="max-lg:flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {isEditMode ? t('calendar.form.updating', 'Updating...') : t('calendar.form.creating', 'Creating...')}
                  </>
                ) : isEditMode ? (
                  t('calendar.form.update', 'Update Event')
                ) : (
                  t('calendar.form.create', 'Create Event')
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Audience */}
        <Section title={t('calendar.form.section.audience', 'Who is it for?')} className="lg:col-start-1">
          <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {typeOptions.map((opt) => {
              const active = formData.eventType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setEventType(opt.value)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-tone-primary-soft' : 'hover:bg-muted/50'
                  )}
                >
                  <span className={cn('mt-0.5 [&_svg]:size-4', active ? 'text-tone-primary' : 'text-muted-foreground')}>
                    {opt.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{opt.label}</span>
                    <span className={cn(type.caption, 'mt-0.5 block')}>{opt.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {formData.eventType === 'class_specific' && (
            <ClassPicker
              selected={formData.classDivisionIds}
              onChange={(ids) => setField('classDivisionIds', ids)}
              required
            />
          )}
        </Section>
      </div>

      {/* room so the floating mobile action bar never covers content */}
      <div className="h-24 lg:hidden" aria-hidden />
    </form>
  );
}
