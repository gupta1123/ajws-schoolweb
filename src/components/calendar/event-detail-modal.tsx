// src/components/calendar/event-detail-modal.tsx
//
// Event details shown in a right-hand side panel (kept the original export
// name so existing call sites keep working).

'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Field, Pill } from '@/components/ui/page-kit';
import { Check, Pencil, Trash2, X, CalendarDays, Clock, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { type, type Tone } from '@/lib/design/tokens';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'school' | 'class';
  class?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
}

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
  userRole: 'admin' | 'principal' | 'teacher' | 'attendance_staff' | 'student';
}

const trimTime = (time: string) => (time || '').slice(0, 5);

export function EventDetailModal({ event, onClose, onEdit, onDelete, onApprove, onReject, userRole }: EventDetailModalProps) {
  const { t, lang } = useI18n();

  // Synthetic entries (e.g. birthdays) carry no approval info and can't be edited here.
  const isRealEvent = event.requiresApproval !== undefined;
  const isPending = isRealEvent && !event.approved;

  const canEdit =
    isRealEvent && (userRole === 'admin' || userRole === 'principal' || (userRole === 'teacher' && !!event.teacher));
  const canApprove = userRole === 'principal' && !!event.requiresApproval && !event.approved;

  const tone: Tone = isPending ? 'warning' : event.type === 'class' ? 'success' : 'primary';
  const barClass = isPending ? 'bg-tone-warning' : event.type === 'class' ? 'bg-tone-success' : 'bg-tone-primary';

  const classes = (event.class || '')
    .split(/\s*,\s*/)
    .map((c) => c.trim())
    .filter(Boolean);

  const start = trimTime(event.startTime);
  const end = trimTime(event.endTime);
  const allDay = start === '00:00' && end === '23:59';
  const timeText = allDay ? t('calendar.view.allDay', 'All day') : end ? `${start} – ${end}` : start;

  const date = new Date(`${event.date}T00:00:00`);
  const dateText = isNaN(date.getTime())
    ? event.date
    : date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const typeLabel = t(
    event.type === 'class' ? 'calendar.modal.classEvent' : 'calendar.modal.event',
    event.type === 'class' ? 'Class event' : 'School event'
  );

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className={cn('h-1 w-full shrink-0', barClass)} />

        <SheetHeader className="space-y-2 border-b p-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={event.type === 'class' ? 'success' : 'primary'}>{typeLabel}</Pill>
            {isRealEvent && (
              <Pill tone={event.approved ? 'success' : 'warning'}>
                {event.approved
                  ? t('calendar.modal.approved', 'Approved')
                  : t('calendar.modal.pendingApproval', 'Pending approval')}
              </Pill>
            )}
          </div>
          <SheetTitle className="text-lg leading-snug">{event.title}</SheetTitle>
          <SheetDescription className="sr-only">{typeLabel}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <dl className="grid grid-cols-1 gap-4">
            <Field
              label={t('calendar.modal.date', 'Date')}
              icon={<CalendarDays />}
              value={dateText}
            />
            <Field label={t('calendar.modal.time', 'Time')} icon={<Clock />} value={timeText} />
            {classes.length > 0 && (
              <div className="min-w-0">
                <dt className={type.label}>
                  {t('calendar.modal.appliesTo', 'Applies to')}
                  {classes.length > 1 && <span className="ml-1 tabular-nums">({classes.length})</span>}
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {classes.map((name) => (
                    <Pill key={name} tone="primary" className="text-xs">
                      {name}
                    </Pill>
                  ))}
                </dd>
              </div>
            )}
            {event.teacher && (
              <Field label={t('calendar.modal.createdBy', 'Created by')} icon={<User />} value={event.teacher} />
            )}
          </dl>

          {event.description && (
            <div>
              <p className={type.label}>{t('calendar.modal.descriptionLabel', 'Description')}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        {(canApprove || canEdit) && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3">
            {canApprove && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject?.(event.id)}
                  className="text-tone-danger hover:text-tone-danger"
                >
                  <X />
                  {t('calendar.modal.reject', 'Reject')}
                </Button>
                <Button size="sm" onClick={() => onApprove?.(event.id)}>
                  <Check />
                  {t('calendar.modal.approve', 'Approve')}
                </Button>
              </>
            )}
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(event.id)}
                  className="text-tone-danger hover:text-tone-danger"
                >
                  <Trash2 />
                  {t('actions.delete', 'Delete')}
                </Button>
                <Button size="sm" variant={canApprove ? 'outline' : 'default'} onClick={() => onEdit(event.id)}>
                  <Pencil />
                  {t('actions.edit', 'Edit')}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
