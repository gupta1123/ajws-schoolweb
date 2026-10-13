// src/components/food-menu/daily-menus-panel.tsx
//
// Legacy view: a date-wise breakfast / lunch / snack menu. Add and edit open
// in a side panel. Loaded lazily, only when its tab is first opened.

'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Info, Loader2, Pencil, Plus, RefreshCw, Utensils } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { foodMenuServices, FoodMenu, FoodMenuPayload } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { DateField, toISODate } from '@/components/calendar/event-pickers';
import { EmptyState, InlineError, Pill } from '@/components/ui/page-kit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { surface, type } from '@/lib/design/tokens';

type StatusFilter = 'all' | 'active' | 'inactive';
type Meal = 'breakfast' | 'lunch' | 'snack';

interface FormState {
  menu_date: string;
  breakfast: string;
  lunch: string;
  snack: string;
  notes: string;
  is_active: boolean;
}

// literal classes so Tailwind generates them
const MEALS: { key: Meal; dot: string }[] = [
  { key: 'breakfast', dot: 'bg-tone-warning' },
  { key: 'lunch', dot: 'bg-tone-success' },
  { key: 'snack', dot: 'bg-tone-info' },
];

// date | breakfast | lunch | snack | actions
const ROW_GRID = 'md:grid-cols-[3.5rem_repeat(3,minmax(0,1fr))_8.5rem]';

const emptyForm = (date = toISODate(new Date())): FormState => ({ menu_date: date, breakfast: '', lunch: '', snack: '', notes: '', is_active: true });
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const normalize = (v: string) => v.trim() || null;

export function DailyMenusPanel({ lead, canManage }: { lead?: ReactNode; canManage: boolean }) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [menus, setMenus] = useState<FoodMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<FoodMenu | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingHide, setPendingHide] = useState<FoodMenu | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const today = toISODate(new Date());
  const isCurrentMonth = month.getTime() === monthStart(new Date()).getTime();
  const monthLabel = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(month);
  const shiftMonth = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await foodMenuServices.list(
        {
          from_date: toISODate(month),
          to_date: toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
          is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
          page: 1,
          limit: 50,
        },
        token
      );
      if (response instanceof Blob) throw new Error(t('foodMenu.failed', 'Failed to load food menus'));
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.failed', 'Failed to load food menus'));
      setMenus('data' in response ? response.data.menus || [] : []);
    } catch (err) {
      setMenus([]);
      setError(err instanceof Error ? err.message : t('foodMenu.failed', 'Failed to load food menus'));
    } finally {
      setLoading(false);
    }
  }, [month, statusFilter, t, token]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => [...menus].sort((a, b) => a.menu_date.localeCompare(b.menu_date)), [menus]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(isCurrentMonth ? today : toISODate(month)));
    setFormError(null);
    setPanelOpen(true);
  };

  const openEdit = (menu: FoodMenu) => {
    setEditing(menu);
    setForm({ menu_date: menu.menu_date, breakfast: menu.breakfast || '', lunch: menu.lunch || '', snack: menu.snack || '', notes: menu.notes || '', is_active: menu.is_active });
    setFormError(null);
    setPanelOpen(true);
  };

  const existing = !editing ? menus.find((m) => m.menu_date === form.menu_date) : undefined;

  const save = async () => {
    if (!token || !form.menu_date) return;
    const payload: FoodMenuPayload = {
      menu_date: form.menu_date,
      breakfast: normalize(form.breakfast),
      lunch: normalize(form.lunch),
      snack: normalize(form.snack),
      notes: normalize(form.notes),
      is_active: form.is_active,
    };
    try {
      setSaving(true);
      setFormError(null);
      const response = editing ? await foodMenuServices.update(editing.id, payload, token) : await foodMenuServices.create(payload, token);
      if (response instanceof Blob) throw new Error(t('foodMenu.saveFailed', 'Failed to save food menu'));
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.saveFailed', 'Failed to save food menu'));
      setPanelOpen(false);
      toast({ title: t('foodMenu.saved', 'Menu saved'), variant: 'success' });
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('foodMenu.saveFailed', 'Failed to save food menu'));
    } finally {
      setSaving(false);
    }
  };

  const setVisible = async (menu: FoodMenu, visible: boolean) => {
    if (!token) return;
    try {
      setWorkingId(menu.id);
      const response = visible ? await foodMenuServices.update(menu.id, { is_active: true }, token) : await foodMenuServices.delete(menu.id, token);
      if (response.status === 'error') throw new Error(response.message || t('foodMenu.saveFailed', 'Failed to save food menu'));
      toast({ title: visible ? t('foodMenu.shown', 'Menu is visible again') : t('foodMenu.hiddenToast', 'Menu hidden from parents'), variant: 'success' });
      await load();
    } catch (err) {
      toast({ title: t('common.error', 'Error'), description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setWorkingId(null);
      setPendingHide(null);
    }
  };

  const fmtDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return { wd: d.toLocaleDateString(lang, { weekday: 'short' }), day: d.getDate() };
  };
  const mealLabel: Record<Meal, string> = {
    breakfast: t('foodMenu.fields.breakfast', 'Breakfast'),
    lunch: t('foodMenu.fields.lunch', 'Lunch'),
    snack: t('foodMenu.fields.snack', 'Snack'),
  };
  const ghost = 'size-8 text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {lead}
          <Button variant="outline" size="icon" className="size-9" onClick={() => shiftMonth(-1)} aria-label={t('foodMenu.prevMonth', 'Previous month')}>
            <ChevronLeft />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold capitalize">{monthLabel}</span>
          <Button variant="outline" size="icon" className="size-9" onClick={() => shiftMonth(1)} aria-label={t('foodMenu.nextMonth', 'Next month')}>
            <ChevronRight />
          </Button>
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={() => setMonth(monthStart(new Date()))}>
              {t('foodMenu.thisMonth', 'This month')}
            </Button>
          )}
          {canManage && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger aria-label={t('foodMenu.filters.status', 'Status')} className="ml-1 h-9 w-auto min-w-[8.5rem] gap-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('foodMenu.status.all', 'All menus')}</SelectItem>
                <SelectItem value="active">{t('foodMenu.status.active', 'Visible only')}</SelectItem>
                <SelectItem value="inactive">{t('foodMenu.status.inactive', 'Hidden only')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" onClick={load} disabled={loading} aria-label={t('actions.refresh', 'Refresh')} title={t('actions.refresh', 'Refresh')}>
            <RefreshCw className={cn(loading && 'animate-spin')} />
          </Button>
          {canManage && (
            <Button onClick={openCreate}>
              <Plus />
              {t('foodMenu.new', 'New menu')}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border">
          <InlineError title={error} onRetry={load} retryLabel={t('actions.refresh', 'Refresh')} />
        </div>
      ) : (
        <section className={cn(surface.panel, 'overflow-hidden')}>
          {sorted.length > 0 && (
            <div className={cn('hidden gap-x-4 border-b bg-muted/30 px-4 py-2 md:grid', ROW_GRID)}>
              <span className={type.label}>{t('foodMenu.fields.date', 'Date')}</span>
              {MEALS.map((m) => (
                <span key={m.key} className={cn(type.label, 'flex items-center gap-1.5')}>
                  <span className={cn('size-1.5 rounded-full', m.dot)} aria-hidden />
                  {mealLabel[m.key]}
                </span>
              ))}
              <span />
            </div>
          )}

          {loading && menus.length === 0 ? (
            <ul className="divide-y" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-4">
                  <Skeleton className="size-10" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </li>
              ))}
            </ul>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={<Utensils />}
              title={t('foodMenu.empty.title', 'No menus for {month}').replace('{month}', monthLabel)}
              help={canManage ? t('foodMenu.empty.help', 'Add a daily menu so parents can see what is served.') : undefined}
            />
          ) : (
            <ul className={cn('divide-y transition-opacity', loading && 'opacity-60')}>
              {sorted.map((menu) => {
                const { wd, day } = fmtDay(menu.menu_date);
                const isToday = menu.menu_date === today;
                const busy = workingId === menu.id;
                return (
                  <li
                    key={menu.id}
                    className={cn('grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1.5 px-4 py-3', ROW_GRID, isToday && 'bg-tone-primary-soft/40', !menu.is_active && 'bg-muted/20')}
                  >
                    <div className={cn('flex size-14 flex-col items-center justify-center rounded-lg text-center leading-none md:h-12 md:w-14', isToday ? 'bg-tone-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                      <span className={cn('text-[10px] font-medium uppercase', isToday ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{wd}</span>
                      <span className="mt-1 text-lg font-semibold tabular-nums">{day}</span>
                    </div>

                    <div className={cn('grid gap-2 sm:grid-cols-3 md:contents', !menu.is_active && 'opacity-60')}>
                      {MEALS.map((m) => (
                        <div key={m.key} className="min-w-0">
                          <p className={cn(type.label, 'mb-0.5 flex items-center gap-1.5 md:hidden')}>
                            <span className={cn('size-1.5 rounded-full', m.dot)} aria-hidden />
                            {mealLabel[m.key]}
                          </p>
                          <p className={cn('whitespace-pre-line break-words text-sm', !menu[m.key]?.trim() && 'text-muted-foreground')}>{menu[m.key]?.trim() || '—'}</p>
                        </div>
                      ))}
                    </div>

                    <div className="col-start-2 flex items-center justify-end gap-1 md:col-start-auto">
                      {!menu.is_active && <Pill>{t('foodMenu.status.hiddenShort', 'Hidden')}</Pill>}
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon" className={cn(ghost, 'hover:text-foreground')} onClick={() => openEdit(menu)} aria-label={t('actions.edit', 'Edit')} title={t('actions.edit', 'Edit')}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(ghost, menu.is_active ? 'hover:text-tone-danger' : 'hover:text-tone-success')}
                            disabled={busy}
                            onClick={() => (menu.is_active ? setPendingHide(menu) : setVisible(menu, true))}
                            aria-label={menu.is_active ? t('foodMenu.actions.hide', 'Hide') : t('foodMenu.actions.show', 'Show')}
                            title={menu.is_active ? t('foodMenu.actions.hide', 'Hide') : t('foodMenu.actions.show', 'Show')}
                          >
                            {busy ? <Loader2 className="animate-spin" /> : menu.is_active ? <EyeOff /> : <Eye />}
                          </Button>
                        </>
                      )}
                    </div>

                    {menu.notes?.trim() && (
                      <p className={cn(type.caption, 'col-start-2 flex items-start gap-1.5 md:col-[2/-1]', !menu.is_active && 'opacity-60')}>
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        <span className="whitespace-pre-line">{menu.notes}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Add / edit side panel */}
      <Sheet open={panelOpen} onOpenChange={(o) => !saving && setPanelOpen(o)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="gap-1 border-b px-5 py-4 pr-12">
            <SheetTitle>{editing ? t('foodMenu.editTitle', 'Edit menu') : t('foodMenu.createTitle', 'New menu')}</SheetTitle>
            <SheetDescription>{t('foodMenu.form.desc', 'Set what is served on a day. Leave a meal empty if there is none.')}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="menu-date">{t('foodMenu.fields.date', 'Date')}</Label>
              <DateField id="menu-date" value={form.menu_date} onChange={(v) => setForm((f) => ({ ...f, menu_date: v }))} />
              {existing && (
                <p className="text-xs text-tone-warning">
                  {t('foodMenu.form.exists', 'A menu already exists for this date.')}{' '}
                  <button type="button" className="font-medium underline underline-offset-2" onClick={() => openEdit(existing)}>
                    {t('foodMenu.form.editExisting', 'Edit it instead')}
                  </button>
                </p>
              )}
            </div>

            {MEALS.map((m) => (
              <div key={m.key} className="space-y-1.5">
                <Label htmlFor={m.key} className="flex items-center gap-1.5">
                  <span className={cn('size-1.5 rounded-full', m.dot)} aria-hidden />
                  {mealLabel[m.key]}
                </Label>
                <Textarea id={m.key} rows={2} value={form[m.key]} onChange={(e) => setForm((f) => ({ ...f, [m.key]: e.target.value }))} placeholder={t(`foodMenu.placeholders.${m.key}`, '')} />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="notes">
                {t('foodMenu.fields.notes', 'Notes')} <span className="font-normal text-muted-foreground">· {t('foodMenu.form.optional', 'optional')}</span>
              </Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={t('foodMenu.placeholders.notes', 'A note for parents')} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div>
                <Label htmlFor="is-active">{t('foodMenu.fields.visible', 'Visible to parents')}</Label>
                <p className={type.caption}>{t('foodMenu.fields.visibleHelp', 'Hidden menus are not shown to parents.')}</p>
              </div>
              <Switch id="is-active" checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
            </div>

            {formError && (
              <p role="alert" className="text-sm text-tone-danger">
                {formError}
              </p>
            )}
          </div>

          <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t px-5 py-3">
            <Button variant="outline" onClick={() => setPanelOpen(false)} disabled={saving}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button onClick={save} disabled={saving || !form.menu_date || Boolean(existing)}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? t('actions.saving', 'Saving...') : t('actions.save', 'Save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Hide confirm */}
      <Dialog open={Boolean(pendingHide)} onOpenChange={(o) => !o && setPendingHide(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('foodMenu.hideConfirm.title', 'Hide this menu?')}</DialogTitle>
            <DialogDescription>
              {t('foodMenu.hideConfirm.desc', 'Parents will no longer see the menu for {date}. You can show it again later.').replace(
                '{date}',
                pendingHide ? new Date(`${pendingHide.menu_date}T00:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) : ''
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingHide(null)}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" disabled={Boolean(workingId)} onClick={() => pendingHide && setVisible(pendingHide, false)}>
              {workingId && <Loader2 className="animate-spin" />}
              {t('foodMenu.actions.hide', 'Hide')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
