// src/app/birthdays/page.tsx

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Cake, Check, Copy, Gift, PartyPopper, Search, Sparkles, X } from 'lucide-react';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, InlineError } from '@/components/ui/page-kit';
import { useBirthdays, BirthdayData } from '@/hooks/use-birthdays';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { surface, toneClass, type, type Tone } from '@/lib/design/tokens';

type RangeKey = 'today' | 'tomorrow' | 'next7' | 'month' | 'nextMonth';

interface Entry {
  b: BirthdayData;
  occurrence: Date; // next time the birthday falls (local midnight)
  days: number; // whole days from today
  age: number | null; // age they turn
  grade: string;
  seq: number;
  division: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Month/day/year from an ISO-like date string without timezone shifts. */
const parseDob = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (m) return { y: +m[1], m: +m[2] - 1, d: +m[3] };
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
};

const gradeOf = (b: BirthdayData) => {
  const rec = b.academicRecords?.[0]?.class_division;
  if (rec) return { grade: rec.level?.name || '', seq: rec.level?.sequence_number ?? 999, division: rec.division || '' };
  const g = b.class?.match(/^(.*?)\s*-\s*Section\s+(\w+)/i);
  return g ? { grade: g[1], seq: 999, division: g[2] } : { grade: b.class || '', seq: 999, division: '' };
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

// Every person gets a stable, cheerful colour.
const PALETTE: Tone[] = ['rose', 'violet', 'warning', 'info', 'success', 'primary'];
const toneFor = (name: string): Tone => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

// Literal class names so Tailwind generates them.
const SOLID: Record<Tone, string> = {
  primary: 'bg-tone-primary',
  success: 'bg-tone-success',
  warning: 'bg-tone-warning',
  danger: 'bg-tone-danger',
  info: 'bg-tone-info',
  violet: 'bg-tone-violet',
  rose: 'bg-tone-rose',
  neutral: 'bg-muted-foreground',
};

const classLabel = (e: Entry, sec: string) =>
  [e.grade, e.division && `${sec} ${e.division}`].filter(Boolean).join(' · ');

function Avatar({ entry, size = 'md' }: { entry: Entry; size?: 'md' | 'lg' }) {
  const tone = toneFor(entry.b.name);
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background',
        toneClass[tone].chip,
        size === 'lg' ? 'size-14 text-lg' : 'size-11 text-sm'
      )}
    >
      {entry.b.avatar || initialsOf(entry.b.name)}
      {entry.days === 0 && (
        <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-tone-rose text-white ring-2 ring-background">
          <PartyPopper className="size-3" />
        </span>
      )}
    </span>
  );
}

/** Decorative confetti for the hero (positions are fixed so it never jumps). */
const CONFETTI: { x: string; y: string; r: number; tone: Tone; shape: 'dot' | 'bar' | 'ring' }[] = [
  { x: '4%', y: '18%', r: 20, tone: 'rose', shape: 'bar' },
  { x: '10%', y: '70%', r: -30, tone: 'warning', shape: 'dot' },
  { x: '19%', y: '12%', r: 0, tone: 'violet', shape: 'ring' },
  { x: '31%', y: '82%', r: 40, tone: 'info', shape: 'bar' },
  { x: '44%', y: '10%', r: -15, tone: 'success', shape: 'dot' },
  { x: '57%', y: '86%', r: 25, tone: 'rose', shape: 'ring' },
  { x: '66%', y: '14%', r: 50, tone: 'warning', shape: 'bar' },
  { x: '78%', y: '76%', r: 0, tone: 'violet', shape: 'dot' },
  { x: '88%', y: '20%', r: -40, tone: 'info', shape: 'bar' },
  { x: '94%', y: '64%', r: 0, tone: 'rose', shape: 'dot' },
  { x: '72%', y: '40%', r: 0, tone: 'success', shape: 'ring' },
];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={cn(
            'absolute opacity-70',
            c.shape === 'dot' && 'size-2 rounded-full',
            c.shape === 'bar' && 'h-1 w-4 rounded-full',
            c.shape === 'ring' && 'size-3 rounded-full border-2 border-current',
            c.shape === 'ring' ? toneClass[c.tone].text : SOLID[c.tone]
          )}
          style={{ left: c.x, top: c.y, transform: `rotate(${c.r}deg)` }}
        />
      ))}
    </div>
  );
}

function WishButton({ name }: { name: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        t('birthdays.wishText', 'Happy Birthday {{name}}! 🎉 Wishing you a wonderful year ahead. – AJWS').replace(
          '{{name}}',
          name.split(/\s+/)[0]
        )
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={copy} className="h-7 gap-1 bg-background/70 px-2 text-xs">
      {copied ? <Check /> : <Copy />}
      {copied ? t('birthdays.wishCopied', 'Copied') : t('birthdays.sendWish', 'Wish')}
    </Button>
  );
}

function Hero({ entries, lang }: { entries: Entry[]; lang: string }) {
  const { t } = useI18n();
  if (entries.length === 0) return null;
  const first = entries[0].days;
  const featured = entries.filter((e) => e.days === first);
  const isToday = first === 0;
  const shown = featured.slice(0, 4);
  const extra = featured.length - shown.length;
  const when =
    first === 1
      ? t('birthdays.tomorrow', 'Tomorrow')
      : t('birthdays.inDays', 'in {{n}} days').replace('{{n}}', String(first));

  return (
    <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-tone-rose-soft via-tone-warning-soft to-tone-violet-soft p-4 sm:p-5">
      <Confetti />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-tone-rose">
            {isToday ? <PartyPopper className="size-4" /> : <Sparkles className="size-4" />}
            {isToday ? t('birthdays.heroToday', "Today's birthdays") : t('birthdays.heroNext', 'Up next')}
          </p>
          <h2 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">
            {isToday
              ? t('birthdays.happyBirthday', 'Happy Birthday! 🎉')
              : `${when} · ${featured[0].occurrence.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}`}
          </h2>
          <p className={cn(type.caption, 'mt-0.5 text-foreground/70')}>
            {featured.length === 1
              ? t('birthdays.heroOne', '1 celebration')
              : t('birthdays.heroMany', '{{n}} celebrations').replace('{{n}}', String(featured.length))}
          </p>
        </div>
        <Cake className="hidden size-14 text-tone-rose/40 sm:block" aria-hidden />
      </div>

      <ul className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((e) => (
          <li key={e.b.id} className="flex items-center gap-3 rounded-lg border bg-background/80 p-2.5 backdrop-blur-sm">
            <Avatar entry={e} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{e.b.name}</p>
              <p className={cn(type.caption, 'truncate')}>
                {classLabel(e, t('birthdays.sectionShort', 'Sec')) || t('common.students', 'Students')}
                {e.age !== null && ` · ${t('birthdays.turns', 'Turns {{n}}').replace('{{n}}', String(e.age))}`}
              </p>
            </div>
            {isToday && <WishButton name={e.b.name} />}
          </li>
        ))}
        {extra > 0 && (
          <li className="flex items-center justify-center rounded-lg border border-dashed bg-background/50 p-2.5 text-sm font-medium text-muted-foreground">
            +{extra} {t('birthdays.more', 'more')}
          </li>
        )}
      </ul>
    </section>
  );
}

function BirthdayCard({ entry, lang }: { entry: Entry; lang: string }) {
  const { t } = useI18n();
  const tone = toneFor(entry.b.name);
  const isToday = entry.days === 0;
  const when =
    entry.days === 0
      ? t('birthdays.todayBang', 'Today!')
      : entry.days === 1
      ? t('birthdays.tomorrow', 'Tomorrow')
      : t('birthdays.inDays', 'in {{n}} days').replace('{{n}}', String(entry.days));

  return (
    <li
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md',
        isToday && 'border-tone-rose/40 bg-tone-rose-soft/40'
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', SOLID[tone])} />
      <Avatar entry={entry} />
      <div className="min-w-0 flex-1">
        <p className={cn(type.rowTitle, 'truncate')}>{entry.b.name}</p>
        <p className={cn(type.caption, 'truncate')}>
          {[classLabel(entry, t('birthdays.sectionShort', 'Sec')), entry.b.department].filter(Boolean).join(' · ') ||
            t('common.students', 'Students')}
        </p>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
          {entry.occurrence.toLocaleDateString(lang, { day: 'numeric', month: 'short' })} · {when}
        </p>
      </div>
      {entry.age !== null && (
        <span
          className={cn(
            'inline-flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 leading-none',
            toneClass[isToday ? 'rose' : tone].chip
          )}
          title={t('birthdays.turns', 'Turns {{n}}').replace('{{n}}', String(entry.age))}
        >
          <Cake className="mb-0.5 size-3.5" />
          <span className="text-lg font-bold tabular-nums">{entry.age}</span>
        </span>
      )}
    </li>
  );
}

export default function BirthdaysPage() {
  const { t, lang } = useI18n();
  const { loading, error, useFallback, getAllBirthdays, clearError } = useBirthdays();

  const [range, setRange] = useState<RangeKey>('today');
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('all');
  const picked = useRef(false);

  const all = getAllBirthdays();

  // Next occurrence of every birthday, computed from month/day of the date of birth.
  const entries = useMemo<Entry[]>(() => {
    const today = startOfDay(new Date());
    return all
      .map((b) => {
        const dob = parseDob(b.date);
        if (!dob) return null;
        let occ = new Date(today.getFullYear(), dob.m, dob.d);
        if (occ < today) occ = new Date(today.getFullYear() + 1, dob.m, dob.d);
        const age = occ.getFullYear() - dob.y;
        const g = gradeOf(b);
        return {
          b,
          occurrence: occ,
          days: Math.round((occ.getTime() - today.getTime()) / 86400000),
          age: age > 0 && age < 100 ? age : null,
          ...g,
        } as Entry;
      })
      .filter((e): e is Entry => !!e)
      .sort((a, b) => a.days - b.days || a.b.name.localeCompare(b.b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, loading]);

  const inRange = (e: Entry, key: RangeKey) => {
    const now = new Date();
    switch (key) {
      case 'today':
        return e.days === 0;
      case 'tomorrow':
        return e.days === 1;
      case 'next7':
        return e.days <= 7;
      case 'month':
        return e.occurrence.getMonth() === now.getMonth() && e.occurrence.getFullYear() === now.getFullYear();
      case 'nextMonth': {
        const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return e.occurrence.getMonth() === nm.getMonth() && e.occurrence.getFullYear() === nm.getFullYear();
      }
    }
  };

  const tabs: { key: RangeKey; label: string }[] = [
    { key: 'today', label: t('birthdays.today', 'Today') },
    { key: 'tomorrow', label: t('birthdays.tomorrow', 'Tomorrow') },
    { key: 'next7', label: t('birthdays.next7', 'Next 7 days') },
    { key: 'month', label: t('birthdays.thisMonth', 'This Month') },
    { key: 'nextMonth', label: t('birthdays.nextMonth', 'Next Month') },
  ];
  const counts = useMemo(
    () => Object.fromEntries(tabs.map((tab) => [tab.key, entries.filter((e) => inRange(e, tab.key)).length])) as Record<RangeKey, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries]
  );

  // Open on the first tab that has someone, rather than an empty "Today".
  useEffect(() => {
    if (picked.current || loading || entries.length === 0) return;
    picked.current = true;
    const first = (['today', 'next7', 'month', 'nextMonth'] as RangeKey[]).find((k) => counts[k] > 0);
    if (first) setRange(first);
  }, [loading, entries, counts]);

  const grades = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => e.grade && map.set(e.grade, Math.min(map.get(e.grade) ?? 999, e.seq)));
    return [...map.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([g]) => g);
  }, [entries]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        inRange(e, range) &&
        (grade === 'all' || e.grade === grade) &&
        (!q || e.b.name.toLowerCase().includes(q))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, range, grade, search]);

  // Group cards by day
  const groups = useMemo(() => {
    const map = new Map<number, Entry[]>();
    visible.forEach((e) => map.set(e.days, [...(map.get(e.days) ?? []), e]));
    return [...map.entries()];
  }, [visible]);

  const dayLabel = (days: number, d: Date) => {
    const date = d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' });
    if (days === 0) return `${t('birthdays.today', 'Today')} · ${date}`;
    if (days === 1) return `${t('birthdays.tomorrow', 'Tomorrow')} · ${date}`;
    return date;
  };

  const nextUp = entries.find((e) => e.days > 0 && !inRange(e, range));
  const filtered = search.trim() !== '' || grade !== 'all';
  const showSkeleton = loading && entries.length === 0;

  if (useFallback) {
    return (
      <ProtectedRoute>
        <div className="mx-auto w-full max-w-5xl">
          <InlineError title={t('birthdays.loadFailed', 'Failed to load birthdays')} />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {error && (
          <InlineError
            title={t('birthdays.loadFailed', 'Failed to load birthdays')}
            detail={error}
            onRetry={clearError}
            retryLabel={t('common.dismiss', 'Dismiss')}
          />
        )}

        {showSkeleton ? <Skeleton className="h-40 w-full rounded-xl" /> : <Hero entries={entries} lang={lang} />}

        {/* Range tabs with counts */}
        <div role="tablist" className="flex flex-wrap gap-1 border-b">
          {tabs.map((tab) => {
            const active = range === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setRange(tab.key)}
                className={cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-tone-rose text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-5',
                    active ? 'bg-tone-rose-soft text-tone-rose' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {showSkeleton ? '–' : counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('birthdays.searchPlaceholder', 'Search by name...')}
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('birthdays.clearAll', 'Clear all')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            aria-label={t('birthdays.allClasses', 'All classes')}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{t('birthdays.allClasses', 'All classes')}</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Cards grouped by day */}
        {showSkeleton ? (
          <div className="grid gap-2 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className={surface.panel}>
            <EmptyState
              icon={<Gift />}
              title={
                filtered
                  ? t('birthdays.empty.title', 'No birthdays found')
                  : t('birthdays.empty.range', 'No birthdays in this period')
              }
              help={
                filtered
                  ? t('birthdays.empty.none', 'There are no birthdays matching your selected filters.')
                  : nextUp
                  ? t('birthdays.nextUp', 'Next: {{name}} · {{date}}')
                      .replace('{{name}}', nextUp.b.name)
                      .replace('{{date}}', nextUp.occurrence.toLocaleDateString(lang, { day: 'numeric', month: 'short' }))
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(([days, list]) => (
              <section key={days}>
                <header className="mb-2 flex items-center gap-2">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    {days === 0 && <PartyPopper className="size-4 text-tone-rose" />}
                    {dayLabel(days, list[0].occurrence)}
                  </h2>
                  <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums leading-5 text-muted-foreground">
                    {list.length}
                  </span>
                </header>
                <ul className="grid gap-2 md:grid-cols-2">
                  {list.map((entry) => (
                    <BirthdayCard key={entry.b.id} entry={entry} lang={lang} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
