// src/components/timetable/timetable-grid.tsx
//
// Weekly timetable grid: periods down, days across. Subjects get a stable
// soft colour so a class's week can be read at a glance; today's column is
// highlighted and empty slots offer a quick "add" affordance.

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { TimetableEntry, dayNames } from '@/lib/api/timetable';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { toneClass, type Tone } from '@/lib/design/tokens';

interface TimetableGridProps {
  timetableData: Record<string, TimetableEntry[]>;
  config: {
    total_periods: number;
    days_per_week: number;
  } | null;
  onEditEntry?: (entry: TimetableEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
  /** Called with (day_of_week 1-7, period_number) when an empty slot is clicked. */
  onAddEntry?: (day: number, period: number) => void;
  className?: string;
}

const dayKeyMap: Record<string, string> = {
  Monday: 'days.monday',
  Tuesday: 'days.tuesday',
  Wednesday: 'days.wednesday',
  Thursday: 'days.thursday',
  Friday: 'days.friday',
  Saturday: 'days.saturday',
  Sunday: 'days.sunday',
};

/** Period start time, shared by the admin and teacher timetables. */
export function periodStartTime(periodNumber: number): string {
  const hour24 = 8 + periodNumber; // period 1 starts at 9:00
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:00 ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

// Literal classes so Tailwind generates them.
const SUBJECT_TONES: Tone[] = ['primary', 'success', 'warning', 'info', 'violet', 'rose'];
const BAR: Record<Tone, string> = {
  primary: 'bg-tone-primary',
  success: 'bg-tone-success',
  warning: 'bg-tone-warning',
  danger: 'bg-tone-danger',
  info: 'bg-tone-info',
  violet: 'bg-tone-violet',
  rose: 'bg-tone-rose',
  neutral: 'bg-muted-foreground',
};

/** Stable tone per subject name. */
export function subjectTone(name: string): Tone {
  // free / break-like periods stay quiet so real lessons stand out
  if (/free|lunch|break|recess|assembly/i.test(name)) return 'neutral';
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_TONES[hash % SUBJECT_TONES.length];
}
export const subjectBar = (name: string) => BAR[subjectTone(name)];
export const subjectSoft = (name: string) => toneClass[subjectTone(name)].soft;
export const subjectText = (name: string) => toneClass[subjectTone(name)].text;

export function TimetableGrid({ timetableData, config, onEditEntry, onDeleteEntry, onAddEntry, className = '' }: TimetableGridProps) {
  const { t } = useI18n();

  if (!config) {
    return (
      <div className={cn('rounded-xl border px-4 py-10 text-center text-sm text-muted-foreground', className)}>
        {t('timetable.noConfigSelected')}
      </div>
    );
  }

  const today = new Date().getDay() || 7; // 1 = Monday … 7 = Sunday
  const days = Array.from({ length: config.days_per_week }, (_, i) => i);
  const periods = Array.from({ length: config.total_periods }, (_, i) => i + 1);

  const renderCell = (dayIndex: number, periodNumber: number) => {
    const entry = (timetableData[dayNames[dayIndex]] || []).find((e) => e.period_number === periodNumber);
    const isToday = dayIndex + 1 === today;

    if (!entry) {
      return (
        <td key={`${dayIndex}-${periodNumber}`} className={cn('h-[4.5rem] p-1', isToday && 'bg-tone-primary-soft/30')}>
          {onAddEntry ? (
            <button
              type="button"
              onClick={() => onAddEntry(dayIndex + 1, periodNumber)}
              aria-label={`${t(dayKeyMap[dayNames[dayIndex]] || dayNames[dayIndex])} ${t('timetable.period')} ${periodNumber}: ${t('timetable.addEntry')}`}
              className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-transparent text-muted-foreground/0 transition-colors hover:border-border hover:bg-muted/50 hover:text-muted-foreground focus-visible:border-ring focus-visible:text-muted-foreground focus-visible:outline-none"
            >
              <Plus className="size-4" />
            </button>
          ) : null}
        </td>
      );
    }

    const subject = entry.subject_info?.display_name || entry.subject_info?.name || entry.subject;
    return (
      <td key={`${dayIndex}-${periodNumber}`} className={cn('h-[4.5rem] p-1', isToday && 'bg-tone-primary-soft/30')}>
        <div className={cn('group/cell relative flex h-full overflow-hidden rounded-lg', subjectSoft(subject))}>
          <span aria-hidden className={cn('w-1 shrink-0', subjectBar(subject))} />
          <div className="min-w-0 flex-1 px-2.5 py-1.5">
            <p className={cn('truncate text-sm font-semibold leading-tight', subjectText(subject))}>{subject}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.teacher?.full_name || t('timetable.unknownTeacher')}</p>
          </div>
          {(onEditEntry || onDeleteEntry) && (
            <div className="absolute right-1 top-1 flex gap-0.5 rounded-md bg-background/90 p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/cell:opacity-100">
              {onEditEntry && (
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  aria-label={t('actions.edit', 'Edit')}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="size-3" />
                </button>
              )}
              {onDeleteEntry && (
                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label={t('actions.delete', 'Delete')}
                  className="rounded p-1 text-tone-danger hover:bg-tone-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className={cn('overflow-x-auto rounded-xl border', className)}>
      <table className="w-full min-w-[44rem] table-fixed border-collapse">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="w-24 px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t('timetable.period')}</th>
            {days.map((i) => {
              const isToday = i + 1 === today;
              return (
                <th key={i} className={cn('px-2 py-2 text-center text-xs font-semibold', isToday ? 'text-tone-primary' : 'text-muted-foreground')}>
                  {t(dayKeyMap[dayNames[i]] || dayNames[i])}
                  {isToday && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" aria-label="today" />}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {periods.map((p) => (
            <tr key={p}>
              <th scope="row" className="px-3 text-left align-middle">
                <span className="block text-sm font-semibold">P{p}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">{periodStartTime(p)}</span>
              </th>
              {days.map((d) => renderCell(d, p))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
