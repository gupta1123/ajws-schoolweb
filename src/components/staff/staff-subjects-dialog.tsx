// src/components/staff/staff-subjects-dialog.tsx
//
// Side panel to pick the subjects a teacher teaches. Opens with the current ones ticked, so
// "replace" is the only mode people need: untick to remove, tick to add.

'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { IconChip } from '@/components/ui/page-kit';
import { academicServices, staffServices } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  teacherId: string;
  current: string[];
  onSaved: (subjects: string[]) => void;
}

export function StaffSubjectsDialog({ open, onOpenChange, staffName, teacherId, current, onSaved }: Props) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [available, setAvailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // start from the current subjects every time the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(current);
      setQuery('');
    }
  }, [open, current]);

  useEffect(() => {
    if (!open || !token || available.length > 0) return;
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    academicServices
      .getSubjects(token)
      .then((r) => {
        if (cancelled) return;
        if (r.status !== 'success') return setLoadFailed(true);
        setAvailable(r.data.subjects.filter((s) => s.is_active).map((s) => s.name).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => !cancelled && setLoadFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, token, available.length]);

  // keep subjects that are no longer active selectable so they can be removed
  const options = Array.from(new Set([...available, ...current])).filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  const changed = selected.length !== current.length || selected.some((s) => !current.includes(s));

  const save = async () => {
    if (!token || selected.length === 0) return;
    setSaving(true);
    try {
      const r = await staffServices.assignSubjectsToTeacher(teacherId, { subjects: selected, mode: 'replace' }, token);
      if (r.status !== 'success') throw new Error();
      toast({ title: t('staff.detail.subjectsSaved', 'Subjects updated'), variant: 'success' });
      onSaved(selected);
      onOpenChange(false);
    } catch {
      toast({ title: t('staff.detail.subjectsFailed', 'Could not update subjects'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-0 border-b p-5 pr-12">
          <div className="flex items-center gap-3">
            <IconChip className="size-10" tone="primary">
              <BookOpen />
            </IconChip>
            <div className="min-w-0">
              <SheetTitle className="text-base">{t('staff.detail.manageSubjects', 'Manage Subjects')}</SheetTitle>
              <SheetDescription className="truncate">
                {t('staff.detail.selectSubjectsFor', 'Select subjects for')} {staffName} {t('staff.detail.toTeach', 'to teach')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-3 border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('staff.detail.searchSubjects', 'Search subjects...')} className="pl-8" />
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name)}
                  className="inline-flex items-center gap-1 rounded-full bg-tone-primary-soft px-2.5 py-0.5 text-xs font-medium text-tone-primary transition-colors hover:bg-tone-danger/10 hover:text-tone-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${t('actions.remove', 'Remove')} ${name}`}
                >
                  {name}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : loadFailed ? (
            <p className="p-4 text-sm text-tone-danger">{t('staff.detail.subjectsLoadFailed', 'Could not load subjects.')}</p>
          ) : options.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t('staff.detail.noSubjectsFound', 'No subjects found')}</p>
          ) : (
            <ul className="divide-y">
              {options.map((name) => {
                const on = selected.includes(name);
                return (
                  <li key={name}>
                    <label className={cn('flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-muted/50', on && 'bg-tone-primary-soft/60 font-medium')}>
                      <Checkbox checked={on} onCheckedChange={() => toggle(name)} />
                      <span className="flex-1 truncate">{name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t bg-background p-4">
          <p className="text-xs text-muted-foreground">{t('staff.detail.selectedCount', '{n} selected').replace('{n}', String(selected.length))}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button onClick={save} disabled={saving || !changed || selected.length === 0}>
              {saving && <Loader2 className="animate-spin" />}
              {t('actions.save', 'Save')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
