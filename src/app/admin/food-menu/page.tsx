'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Utensils,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useI18n } from '@/lib/i18n/context';
import { foodMenuServices, FoodMenu, FoodMenuPayload } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface FoodMenuFormState {
  menu_date: string;
  breakfast: string;
  lunch: string;
  snack: string;
  notes: string;
  is_active: boolean;
}

const createEmptyForm = (): FoodMenuFormState => ({
  menu_date: new Date().toISOString().split('T')[0],
  breakfast: '',
  lunch: '',
  snack: '',
  notes: '',
  is_active: true,
});

const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fromDate: firstDay.toISOString().split('T')[0],
    toDate: lastDay.toISOString().split('T')[0],
  };
};

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const textOrDash = (value: string | null) => value?.trim() || '-';

const normalizeText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export default function AdminFoodMenuPage() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const monthRange = useMemo(() => getCurrentMonthRange(), []);

  const [menus, setMenus] = useState<FoodMenu[]>([]);
  const [fromDate, setFromDate] = useState(monthRange.fromDate);
  const [toDate, setToDate] = useState(monthRange.toDate);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<FoodMenu | null>(null);
  const [formData, setFormData] = useState<FoodMenuFormState>(() => createEmptyForm());

  const canManageFoodMenu = user?.role === 'admin' || user?.role === 'principal';

  const sortedMenus = useMemo(() => {
    return [...menus].sort((a, b) => a.menu_date.localeCompare(b.menu_date));
  }, [menus]);

  const loadMenus = useCallback(async () => {
    if (!token || !canManageFoodMenu) return;

    try {
      setLoading(true);
      setError(null);

      const response = await foodMenuServices.list(
        {
          from_date: fromDate,
          to_date: toDate,
          is_active:
            activeFilter === 'all'
              ? undefined
              : activeFilter === 'active',
          page: 1,
          limit: 50,
        },
        token
      );

      if (response instanceof Blob) {
        setError('Unexpected response format from food menu API');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load food menus');
        setMenus([]);
        return;
      }

      if ('data' in response) {
        setMenus(response.data.menus || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load food menus');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, canManageFoodMenu, fromDate, toDate, token]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const openCreateDialog = () => {
    setEditingMenu(null);
    setFormData(createEmptyForm());
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (menu: FoodMenu) => {
    setEditingMenu(menu);
    setFormData({
      menu_date: menu.menu_date,
      breakfast: menu.breakfast || '',
      lunch: menu.lunch || '',
      snack: menu.snack || '',
      notes: menu.notes || '',
      is_active: menu.is_active,
    });
    setError(null);
    setDialogOpen(true);
  };

  const buildPayload = (): FoodMenuPayload => ({
    menu_date: formData.menu_date,
    breakfast: normalizeText(formData.breakfast),
    lunch: normalizeText(formData.lunch),
    snack: normalizeText(formData.snack),
    notes: normalizeText(formData.notes),
    is_active: formData.is_active,
  });

  const handleSave = async () => {
    if (!token || !formData.menu_date) return;

    try {
      setSaving(true);
      setError(null);

      const payload = buildPayload();
      const response = editingMenu
        ? await foodMenuServices.update(editingMenu.id, payload, token)
        : await foodMenuServices.create(payload, token);

      if (response instanceof Blob) {
        setError('Unexpected response format from food menu API');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to save food menu');
        return;
      }

      setDialogOpen(false);
      setEditingMenu(null);
      await loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save food menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menu: FoodMenu) => {
    if (!token) return;

    try {
      setDeletingId(menu.id);
      setError(null);

      const response = await foodMenuServices.delete(menu.id, token);

      if (response.status === 'error') {
        setError(response.message || 'Failed to hide food menu');
        return;
      }

      await loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide food menu');
    } finally {
      setDeletingId(null);
    }
  };

  if (user && !canManageFoodMenu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.adminsOnlySection', 'Only admins and principals can access this section.')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Utensils className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">{t('foodMenu.title', 'Food Menu')}</h1>
                </div>
                <p className="text-muted-foreground">
                  {t('foodMenu.subtitle', 'Manage school-wide breakfast, lunch, and snack menus')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={loadMenus} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {t('actions.refresh', 'Refresh')}
                </Button>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('foodMenu.new', 'New Menu')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              {t('foodMenu.filters.title', 'Menu Filters')}
            </CardTitle>
            <CardDescription>
              {t('foodMenu.filters.desc', 'Filter date-wise menus by range and visibility')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="from-date">{t('foodMenu.filters.fromDate', 'From Date')}</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">{t('foodMenu.filters.toDate', 'To Date')}</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">{t('foodMenu.filters.status', 'Status')}</Label>
                <select
                  id="status-filter"
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="all">{t('foodMenu.status.all', 'All menus')}</option>
                  <option value="active">{t('foodMenu.status.active', 'Active only')}</option>
                  <option value="inactive">{t('foodMenu.status.inactive', 'Inactive only')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={loadMenus} disabled={loading} className="w-full">
                  {t('foodMenu.filters.apply', 'Apply Filters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('foodMenu.list.title', 'Date-wise Menus')}</CardTitle>
            <CardDescription>
              {t('foodMenu.list.desc', 'Breakfast, lunch, and snack for the selected range')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('foodMenu.fields.date', 'Date')}</TableHead>
                    <TableHead>{t('foodMenu.fields.breakfast', 'Breakfast')}</TableHead>
                    <TableHead>{t('foodMenu.fields.lunch', 'Lunch')}</TableHead>
                    <TableHead>{t('foodMenu.fields.snack', 'Snack')}</TableHead>
                    <TableHead>{t('foodMenu.fields.notes', 'Notes')}</TableHead>
                    <TableHead>{t('foodMenu.fields.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t('foodMenu.loading', 'Loading food menus...')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedMenus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {t('foodMenu.empty', 'No food menus found for this filter.')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedMenus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">{formatDate(menu.menu_date)}</TableCell>
                        <TableCell className="whitespace-normal min-w-[160px]">{textOrDash(menu.breakfast)}</TableCell>
                        <TableCell className="whitespace-normal min-w-[180px]">{textOrDash(menu.lunch)}</TableCell>
                        <TableCell className="whitespace-normal min-w-[160px]">{textOrDash(menu.snack)}</TableCell>
                        <TableCell className="whitespace-normal min-w-[180px]">{textOrDash(menu.notes)}</TableCell>
                        <TableCell>
                          <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                            {menu.is_active
                              ? t('foodMenu.status.activeShort', 'Active')
                              : t('foodMenu.status.inactiveShort', 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(menu)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('actions.edit', 'Edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(menu)}
                              disabled={!menu.is_active || deletingId === menu.id}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              {deletingId === menu.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              {t('foodMenu.actions.hide', 'Hide')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? t('foodMenu.editTitle', 'Edit Food Menu') : t('foodMenu.createTitle', 'Create Food Menu')}
              </DialogTitle>
              <DialogDescription>
                {t('foodMenu.form.desc', 'Set breakfast, lunch, snack, notes, and visibility for a date.')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="menu-date">{t('foodMenu.fields.date', 'Date')} *</Label>
                <Input
                  id="menu-date"
                  type="date"
                  value={formData.menu_date}
                  onChange={(event) => setFormData((prev) => ({ ...prev, menu_date: event.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="breakfast">{t('foodMenu.fields.breakfast', 'Breakfast')}</Label>
                  <Textarea
                    id="breakfast"
                    value={formData.breakfast}
                    onChange={(event) => setFormData((prev) => ({ ...prev, breakfast: event.target.value }))}
                    placeholder={t('foodMenu.placeholders.breakfast', 'e.g., Poha and banana')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunch">{t('foodMenu.fields.lunch', 'Lunch')}</Label>
                  <Textarea
                    id="lunch"
                    value={formData.lunch}
                    onChange={(event) => setFormData((prev) => ({ ...prev, lunch: event.target.value }))}
                    placeholder={t('foodMenu.placeholders.lunch', 'e.g., Dal, rice, roti')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snack">{t('foodMenu.fields.snack', 'Snack')}</Label>
                  <Textarea
                    id="snack"
                    value={formData.snack}
                    onChange={(event) => setFormData((prev) => ({ ...prev, snack: event.target.value }))}
                    placeholder={t('foodMenu.placeholders.snack', 'e.g., Milk and biscuits')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('foodMenu.fields.notes', 'Notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder={t('foodMenu.placeholders.notes', 'Optional notes for parents')}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="is-active">{t('foodMenu.fields.visible', 'Active / visible')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('foodMenu.fields.visibleHelp', 'Inactive menus are hidden from parent reads.')}
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.menu_date}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? t('actions.saving', 'Saving...') : t('actions.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
