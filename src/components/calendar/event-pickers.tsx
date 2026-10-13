// src/components/calendar/event-pickers.tsx
//
// Small, consistent pickers for the event form: a popover calendar and
// time-slot selects (replacing the browser's native date/time inputs).

'use client';

import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export const parseISODate = (s: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

/* ----------------------------- Date ----------------------------- */

interface DateFieldProps {
  id?: string;
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  invalid?: boolean;
  /** Earliest selectable date (yyyy-MM-dd). */
  min?: string;
  /** Hide the Today / Tomorrow / Next week chips (e.g. for dates in the past). */
  hideQuickPicks?: boolean;
  /** Month and year dropdowns, for far-away dates such as birthdays or joining dates. */
  yearDropdown?: boolean;
  /** Called when the person clears the date. Shows a clear button when provided. */
  onClear?: () => void;
}

export function DateField({ id, value, onChange, invalid, min, hideQuickPicks, yearDropdown, onClear }: DateFieldProps) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  const label = selected
    ? selected.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : t('calendar.form.pickDate', 'Pick a date');

  const today = new Date();
  const quick = [
    { label: t('calendar.form.quick.today', 'Today'), date: today },
    { label: t('calendar.form.quick.tomorrow', 'Tomorrow'), date: addDays(today, 1) },
    { label: t('calendar.form.quick.nextWeek', 'Next week'), date: addDays(today, 7) },
  ];

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className={cn('h-9 w-full justify-start gap-2 px-3 font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarDays className="text-muted-foreground" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <DayPicker
            mode="single"
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? (yearDropdown ? new Date(1990, 0) : today)}
            {...(yearDropdown ? { captionLayout: 'dropdown' as const, startMonth: new Date(1940, 0), endMonth: new Date(today.getFullYear() + 1, 11) } : {})}
            disabled={min ? { before: parseISODate(min) ?? today } : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(toISODate(d));
                setOpen(false);
              }
            }}
            classNames={{
              root: 'text-sm',
              months: 'relative flex flex-col',
              month_caption: 'flex h-8 items-center justify-center px-8 text-sm font-semibold',
              dropdowns: 'flex items-center gap-1',
              dropdown: 'cursor-pointer rounded-md border bg-background px-1.5 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              caption_label: yearDropdown ? 'sr-only' : '',
              nav: yearDropdown ? 'hidden' : 'absolute inset-x-0 top-0 flex items-center justify-between',
              button_previous:
                'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground',
              button_next:
                'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground',
              chevron: 'size-4 fill-current',
              month_grid: 'mt-1 border-collapse',
              weekday: 'size-9 text-center text-xs font-medium text-muted-foreground',
              day: 'p-0 text-center',
              day_button:
                'inline-flex size-9 items-center justify-center rounded-md text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
              today: '[&>button]:font-bold [&>button]:text-tone-primary',
              outside: 'opacity-40',
              disabled: 'opacity-30 [&>button]:pointer-events-none',
            }}
          />
        </PopoverContent>
      </Popover>
      {onClear && selected && (
        <button type="button" onClick={onClear} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
          {t('actions.clear', 'Clear')}
        </button>
      )}
      <div className={cn('flex flex-wrap gap-1', hideQuickPicks && 'hidden')}>
        {quick.map((q) => {
          const iso = toISODate(q.date);
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange(iso)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-muted',
                value === iso ? 'border-primary bg-tone-primary-soft text-tone-primary' : 'text-muted-foreground'
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- Time ----------------------------- */

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
};

interface TimeFieldProps {
  id?: string;
  value: string; // HH:mm
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** When set, only later slots are offered and each shows its duration. */
  after?: string;
}

export function TimeField({ id, value, onChange, disabled, invalid, after }: TimeFieldProps) {
  const { lang } = useI18n();

  const format = (hhmm: string) => {
    const d = new Date(2000, 0, 1, Math.floor(toMinutes(hhmm) / 60), toMinutes(hhmm) % 60);
    return d.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });
  };

  const options = useMemo(() => {
    const slots: string[] = [];
    for (let m = 0; m < 24 * 60; m += 15) slots.push(fromMinutes(m));
    // keep an off-grid value (e.g. an existing 09:10 event) selectable
    if (value && !slots.includes(value)) slots.push(value);
    const startMin = after ? toMinutes(after) : -1;
    return slots.filter((s) => toMinutes(s) > startMin || s === value).sort();
  }, [value, after]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid} className="h-9 w-full gap-2 px-3">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue>{value ? format(value) : '--:--'}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="tabular-nums">{format(s)}</span>
            {after && toMinutes(s) > toMinutes(after) && (
              <span className="ml-2 text-xs text-muted-foreground">({formatDuration(toMinutes(s) - toMinutes(after))})</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
