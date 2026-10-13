// src/components/shared/class-picker.tsx
//
// Grid of grade cards with section toggles. Used wherever a form targets
// classes (calendar events, announcements). Loads its own data and only offers
// the school's active academic year; classes of other years stay visible only
// if they are already selected (so they can be removed).

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { academicServices } from '@/lib/api/academic';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { type } from '@/lib/design/tokens';
import type { ClassDivision } from '@/types/academic';

interface ClassPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Show a "select at least one" hint while nothing is selected. */
  required?: boolean;
}

export function ClassPicker({ selected, onChange, required }: ClassPickerProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [divisions, setDivisions] = useState<ClassDivision[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentYearId, setCurrentYearId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // the school's active academic year decides which classes are offered
        academicServices
          .getActiveAcademicYear(token)
          .then((r) => !cancelled && r.status === 'success' && setCurrentYearId(r.data?.academic_year?.id ?? null))
          .catch(() => {});
        const response = await academicServices.getClassDivisions(token);
        if (!cancelled && response.status === 'success' && response.data) {
          setDivisions(response.data.class_divisions);
        }
      } catch (err) {
        console.error('Error fetching class divisions:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inYear =
      currentYearId && divisions.some((d) => d.academic_year_id === currentYearId)
        ? divisions.filter((d) => d.academic_year_id === currentYearId || selected.includes(d.id))
        : divisions;
    if (!q) return inYear;
    return inYear.filter((d) => {
      const grade = d.class_level?.name?.toLowerCase() || '';
      const division = d.division?.toLowerCase() || '';
      return grade.includes(q) || division.includes(q) || `${grade} ${division}`.includes(q);
    });
  }, [divisions, search, currentYearId, selected]);

  const groups = useMemo(() => {
    const map = new Map<string, { grade: string; seq: number; divisions: ClassDivision[] }>();
    filtered.forEach((d) => {
      const grade = d.class_level?.name || 'Unknown';
      const g = map.get(grade) ?? { grade, seq: d.class_level?.sequence_number ?? 999, divisions: [] };
      g.divisions.push(d);
      map.set(grade, g);
    });
    return [...map.values()]
      .sort((a, b) => a.seq - b.seq)
      .map((g) => ({ ...g, divisions: g.divisions.sort((a, b) => a.division.localeCompare(b.division)) }));
  }, [filtered]);

  const visibleIds = filtered.map((d) => d.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const setMany = (ids: string[], on: boolean) =>
    onChange(on ? [...new Set([...selected, ...ids])] : selected.filter((id) => !ids.includes(id)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('calendar.form.placeholders.searchClasses', 'Search classes...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('calendar.form.clearSearch', 'Clear Search')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <span className={cn(type.caption, 'tabular-nums')}>
          {t('calendar.form.selectedCount', '{{count}} selected').replace('{{count}}', String(selected.length))}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={visibleIds.length === 0}
          onClick={() => setMany(visibleIds, !allVisibleSelected)}
        >
          {allVisibleSelected
            ? search
              ? t('calendar.form.actions.deselectFiltered', 'Deselect Filtered')
              : t('calendar.form.actions.deselectAll', 'Deselect All')
            : search
            ? t('calendar.form.actions.selectFiltered', 'Select Filtered')
            : t('calendar.form.actions.selectAll', 'Select All')}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : divisions.length === 0 ? (
        <p className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
          {t('calendar.form.noClasses', 'No classes found.')}
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
          {t('calendar.form.noSearchResults', 'No classes match your search.')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {groups.map(({ grade, divisions: list }) => {
            const ids = list.map((d) => d.id);
            const selectedCount = ids.filter((id) => selected.includes(id)).length;
            const all = selectedCount === ids.length;
            return (
              <li
                key={grade}
                className={cn(
                  'rounded-lg border p-2.5 transition-colors',
                  selectedCount > 0 && 'border-primary/50 bg-tone-primary-soft/40'
                )}
              >
                <button
                  type="button"
                  onClick={() => setMany(ids, !all)}
                  className="flex w-full items-center gap-2 text-left"
                  title={all ? t('calendar.form.actions.deselectAll', 'Deselect All') : t('calendar.form.actions.selectAll', 'Select All')}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border',
                      all ? 'border-primary bg-primary text-primary-foreground' : selectedCount > 0 ? 'border-primary' : 'border-input'
                    )}
                  >
                    {all ? <Check className="size-3" /> : selectedCount > 0 ? <span className="size-1.5 rounded-sm bg-primary" /> : null}
                  </span>
                  <span className="truncate text-sm font-medium">{grade}</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {list.map((d) => {
                    const on = selected.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={on}
                        title={d.academic_year?.year_name}
                        onClick={() => toggle(d.id)}
                        className={cn(
                          'inline-flex h-8 min-w-10 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {d.division}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {required && selected.length === 0 && !loading && divisions.length > 0 && (
        <p className="text-xs font-medium text-tone-danger">{t('calendar.form.errors.selectClass', 'Select at least one class.')}</p>
      )}
    </div>
  );
}
