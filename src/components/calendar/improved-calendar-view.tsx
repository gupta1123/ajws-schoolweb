// src/components/calendar/improved-calendar-view.tsx

'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, CalendarX2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/page-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { surface, toneClass, type, type Tone } from '@/lib/design/tokens';

type EventKind = 'school' | 'class' | 'pending';

const eventTone: Record<EventKind, Tone> = {
  school: 'primary',
  class: 'success',
  pending: 'warning',
};

const eventDot: Record<EventKind, string> = {
  school: 'bg-tone-primary',
  class: 'bg-tone-success',
  pending: 'bg-tone-warning',
};

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
  status?: 'pending' | 'approved' | 'rejected';
}

interface ImprovedCalendarViewProps {
  events: CalendarEvent[];
  onViewEvent: (eventId: string) => void;
  onAddEvent: (date: string) => void;
  onMonthChange?: (date: Date) => void;
  /** Rendered at the right end of the toolbar (e.g. the Create Event button). */
  toolbarEnd?: ReactNode;
  /** Show skeleton placeholders instead of events. */
  loading?: boolean;
}

type ViewMode = 'monthly' | 'weekly' | 'daily';

const MAX_CHIPS = 3;

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const kindOf = (event: CalendarEvent): EventKind => (event.status === 'pending' ? 'pending' : event.type) as EventKind;
const trimTime = (time: string) => (time || '').slice(0, 5);

function EventChip({
  event,
  showTime = false,
  timeLabel,
  onView,
}: {
  event: CalendarEvent;
  showTime?: boolean;
  timeLabel: string;
  onView: (eventId: string) => void;
}) {
  const kind = kindOf(event);
  return (
    <button
      type="button"
      title={event.title}
      onClick={(e) => {
        e.stopPropagation();
        onView(event.id);
      }}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded-sm border-l-2 border-current px-1.5 py-0.5 text-left text-[11px] font-medium leading-4 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        toneClass[eventTone[kind]].chip
      )}
    >
      {showTime && <span className="shrink-0 tabular-nums opacity-80">{timeLabel}</span>}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

/** Deterministic placeholder bars so the skeleton doesn't jump between renders. */
function ChipSkeletons({ seed, max = 2 }: { seed: number; max?: number }) {
  const count = (seed * 7 + 3) % (max + 1);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4 rounded-sm', i % 2 ? 'w-2/3' : 'w-full')} />
      ))}
    </>
  );
}

export function ImprovedCalendarView({ events, onViewEvent, onAddEvent, onMonthChange, toolbarEnd, loading = false }: ImprovedCalendarViewProps) {
  const { t, lang } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const today = new Date();
  const todayStr = toISODate(today);

  const eventsByDate = (date: Date) => events.filter((event) => event.date === toISODate(date));
  const hasPending = events.some((e) => e.status === 'pending');

  const moveTo = (next: Date) => {
    const monthChanged =
      next.getMonth() !== currentDate.getMonth() || next.getFullYear() !== currentDate.getFullYear();
    setCurrentDate(next);
    if (monthChanged) onMonthChange?.(next);
  };

  const navigate = (direction: -1 | 1) => {
    const next = new Date(currentDate);
    if (viewMode === 'monthly') next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * (viewMode === 'weekly' ? 7 : 1));
    moveTo(next);
  };

  const openDay = (date: Date) => {
    moveTo(date);
    setViewMode('daily');
  };

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2021, 7, i + 1).toLocaleDateString(lang, { weekday: 'short' })
  );

  const timeLabel = (event: CalendarEvent) =>
    trimTime(event.startTime) === '00:00' && trimTime(event.endTime) === '23:59'
      ? t('calendar.view.allDay', 'All day')
      : trimTime(event.startTime);

  // Title for the toolbar, depends on the view
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const title =
    viewMode === 'monthly'
      ? currentDate.toLocaleDateString(lang, { year: 'numeric', month: 'long' })
      : viewMode === 'weekly'
      ? `${startOfWeek.toLocaleDateString(lang, { day: 'numeric', month: 'short' })} – ${endOfWeek.toLocaleDateString(lang, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`
      : currentDate.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ---- Month view ----
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lead = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <>
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {dayNames.map((day) => (
            <div
              key={day}
              className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const isToday = !!day && toISODate(day) === todayStr;
            const dayEvents = day ? eventsByDate(day) : [];
            return (
              <div
                key={index}
                onClick={() => day && onAddEvent(toISODate(day))}
                className={cn(
                  'min-h-[6.5rem] border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0',
                  day ? 'cursor-pointer bg-card hover:bg-muted/30' : 'bg-muted/30'
                )}
              >
                {day && (
                  <>
                    <div className="mb-1 flex">
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                          isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {loading && <ChipSkeletons seed={index} />}
                      {!loading && dayEvents.slice(0, MAX_CHIPS).map((event) => (
                        <EventChip key={event.id} event={event} timeLabel={timeLabel(event)} onView={onViewEvent} />
                      ))}
                      {!loading && dayEvents.length > MAX_CHIPS && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDay(day);
                          }}
                          className="px-1.5 text-[11px] font-medium text-primary hover:underline"
                        >
                          +{dayEvents.length - MAX_CHIPS} {t('calendar.view.more', 'more')}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ---- Week view ----
  const renderWeek = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
    return (
      <div className="grid grid-cols-7">
        {weekDays.map((day, i) => {
          const isToday = toISODate(day) === todayStr;
          const dayEvents = eventsByDate(day);
          return (
            <div
              key={i}
              onClick={() => onAddEvent(toISODate(day))}
              className="min-h-64 cursor-pointer border-r last:border-r-0 hover:bg-muted/30"
            >
              <div className="flex flex-col items-center gap-0.5 border-b bg-muted/40 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {dayNames[day.getDay()]}
                </span>
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1 p-1.5">
                {loading && <ChipSkeletons seed={i} max={3} />}
                {!loading && dayEvents.map((event) => (
                  <EventChip key={event.id} event={event} showTime timeLabel={timeLabel(event)} onView={onViewEvent} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---- Day view ----
  const renderDay = () => {
    const dayEvents = eventsByDate(currentDate);
    if (loading) {
      return (
        <ul className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 px-4 py-3">
              <Skeleton className="h-4 w-16" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </li>
          ))}
        </ul>
      );
    }
    if (dayEvents.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <CalendarX2 className="size-6 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            {t('calendar.view.noEventsToday', 'No events scheduled for today')}
          </p>
          <Button variant="outline" size="sm" onClick={() => onAddEvent(toISODate(currentDate))}>
            <Plus />
            {t('calendar.view.addEvent', 'Add Event')}
          </Button>
        </div>
      );
    }
    return (
      <ul className="divide-y">
        {dayEvents.map((event) => {
          const kind = kindOf(event);
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onViewEvent(event.id)}
                className={cn('grid w-full grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-3 text-left', surface.rowHover)}
              >
                <div className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                  <span className={cn('size-2 rounded-full', eventDot[kind])} />
                  {timeLabel(event)}
                  {trimTime(event.endTime) &&
                    timeLabel(event) !== t('calendar.view.allDay', 'All day') &&
                    ` – ${trimTime(event.endTime)}`}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={type.rowTitle}>{event.title}</p>
                    {event.class &&
                      (() => {
                        const names = event.class.split(/\s*,\s*/).filter(Boolean);
                        return (
                          <>
                            {names.slice(0, 2).map((name) => (
                              <Pill key={name} tone="primary">
                                {name}
                              </Pill>
                            ))}
                            {names.length > 2 && <Pill>+{names.length - 2}</Pill>}
                          </>
                        );
                      })()}
                    {kind === 'pending' && <Pill tone="warning">{t('calendar.legend.pending', 'Pending')}</Pill>}
                  </div>
                  {event.description && (
                    <p className={cn(type.caption, 'mt-0.5 line-clamp-2')}>{event.description}</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const modes: { key: ViewMode; label: string }[] = [
    { key: 'monthly', label: t('calendar.view.month', 'Month') },
    { key: 'weekly', label: t('calendar.view.week', 'Week') },
    { key: 'daily', label: t('calendar.view.day', 'Day') },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={() => moveTo(new Date())}>
            {t('calendar.view.today', 'Today')}
          </Button>
        </div>
        <h2 className="ml-1 text-base font-semibold tracking-tight">{title}</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="tablist" className="inline-flex rounded-md bg-muted p-0.5">
            {modes.map((mode) => (
              <button
                key={mode.key}
                role="tab"
                aria-selected={viewMode === mode.key}
                onClick={() => setViewMode(mode.key)}
                className={cn(
                  'rounded-[5px] px-3 py-1 text-xs font-medium transition-colors',
                  viewMode === mode.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {toolbarEnd}
        </div>
      </div>

      {/* Grid */}
      <section className={cn(surface.panel, 'overflow-hidden')}>
        {viewMode === 'monthly' ? renderMonth() : viewMode === 'weekly' ? renderWeek() : renderDay()}
      </section>

      {/* Legend */}
      <div className={cn(type.caption, 'flex flex-wrap items-center gap-x-4 gap-y-1')}>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', eventDot.school)} />
          {t('calendar.legend.event', 'School event')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', eventDot.class)} />
          {t('calendar.legend.classEvent', 'Class event')}
        </span>
        {hasPending && (
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', eventDot.pending)} />
            {t('calendar.legend.pending', 'Pending')}
          </span>
        )}
      </div>
    </div>
  );
}
