// src/app/profile/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Calendar, Check, Globe, Lock, Mail, Moon, Palette, Pencil, Phone, Sun, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useTheme, type ColorScheme } from '@/lib/theme/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { authServices } from '@/lib/auth/api';
import { useI18n, type Lang } from '@/lib/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';
import type { StaffInfo, UpdateProfileData } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, IconChip, Panel, Pill } from '@/components/ui/page-kit';
import { space } from '@/lib/design/tokens';

type LanguageValue = 'english' | 'hindi' | 'marathi';

const LANGUAGES: { value: LanguageValue; label: string; lang: Lang }[] = [
  { value: 'english', label: 'English', lang: 'en' },
  { value: 'hindi', label: 'हिंदी (Hindi)', lang: 'hi' },
  { value: 'marathi', label: 'मराठी (Marathi)', lang: 'mr' },
];

// Swatch colors reference the same CSS variables the theme uses (globals.css).
const COLOR_SCHEMES: { id: ColorScheme; nameKey: string; fallback: string; swatch: string }[] = [
  { id: 'default', nameKey: 'profilePage.navy', fallback: 'Navy', swatch: '#104070' },
  { id: 'blue', nameKey: 'profilePage.scheme.ocean', fallback: 'Ocean', swatch: 'var(--primary-blue)' },
  { id: 'green', nameKey: 'profilePage.scheme.forest', fallback: 'Forest', swatch: 'var(--primary-green)' },
  { id: 'purple', nameKey: 'profilePage.scheme.royal', fallback: 'Royal', swatch: 'var(--primary-purple)' },
  { id: 'orange', nameKey: 'profilePage.scheme.sunset', fallback: 'Sunset', swatch: 'var(--primary-orange)' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialsOf = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const normalizeLanguage = (value?: string): LanguageValue =>
  LANGUAGES.some((l) => l.value === value) ? (value as LanguageValue) : 'english';

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
  const { t, setLang } = useI18n();
  const { toast } = useToast();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [lastLogin, setLastLogin] = useState<string | undefined>(user?.last_login);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    preferredLanguage: normalizeLanguage(user?.preferred_language),
  });

  // Staff details and last login only come from GET /api/users/profile.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authServices.getCurrentUser(token);
        if (cancelled || res instanceof Blob || !('data' in res) || res.status !== 'success') return;
        setStaff(res.data.staff ?? null);
        setLastLogin(res.data.user.last_login);
      } catch (error) {
        console.error('Failed to load profile details:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const resetForm = useCallback(() => {
    setForm({
      fullName: user?.full_name || '',
      email: user?.email || '',
      preferredLanguage: normalizeLanguage(user?.preferred_language),
    });
    setErrors({});
  }, [user]);

  const startEditing = () => {
    resetForm();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    const nextErrors: typeof errors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t('profilePage.nameRequired', 'Name is required');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      nextErrors.email = t('profilePage.emailInvalid', 'Enter a valid email address');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Send only what changed (the API ignores empty values and cannot clear fields).
    const payload: UpdateProfileData = {};
    if (form.fullName.trim() !== user.full_name) payload.full_name = form.fullName.trim();
    if (form.email.trim() && form.email.trim() !== (user.email || '')) payload.email = form.email.trim();
    if (form.preferredLanguage !== normalizeLanguage(user.preferred_language)) {
      payload.preferred_language = form.preferredLanguage;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await authServices.updateProfile(token, payload);
      if (res.status !== 'success') {
        throw new Error('message' in res && res.message ? res.message : 'Update failed');
      }
      if (payload.preferred_language) {
        const match = LANGUAGES.find((l) => l.value === payload.preferred_language);
        if (match) setLang(match.lang);
      }
      await refreshUser();
      setIsEditing(false);
      toast({
        title: t('profilePage.toasts.updatedTitle', 'Profile Updated'),
        description: t('profilePage.toasts.updatedDesc', 'Your profile information has been successfully updated.'),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('profilePage.saveFailed', 'Could not save changes'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (user?.role || '').replace(/_/g, ' ');
  const languageLabel = LANGUAGES.find((l) => l.value === normalizeLanguage(user?.preferred_language))?.label;
  const hasWorkDetails = !!staff && !!(staff.department || staff.designation || staff.joining_date);
  const notProvided = t('settings.notProvided', 'Not provided');

  return (
    <ProtectedRoute>
      <div className={space.page + ' max-w-5xl'}>
        {/* Identity */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tone-primary-soft text-lg font-semibold text-primary">
            {initialsOf(user?.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{user?.full_name}</h2>
              <Pill tone="primary" className="capitalize">
                {roleLabel}
              </Pill>
              {staff && (
                <Pill tone={staff.is_active === false ? 'danger' : 'success'}>
                  {staff.is_active === false
                    ? t('profilePage.inactive', 'Inactive')
                    : t('profilePage.active', 'Active')}
                </Pill>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {user?.phone_number}
              {user?.email ? ` · ${user.email}` : ''}
            </p>
          </div>
          {lastLogin && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {t('profilePage.lastLogin', 'Last login')}: {formatDate(lastLogin)}
            </p>
          )}
        </div>

        <div className={`${space.grid} lg:grid-cols-3`}>
          <div className="space-y-4 lg:col-span-2">
            {/* Personal details */}
            <form onSubmit={handleSave} noValidate>
              <Panel
                title={t('profilePage.details', 'Personal details')}
                icon={<User />}
                action={
                  !isEditing ? (
                    <Button type="button" variant="ghost" size="sm" onClick={startEditing}>
                      <Pencil />
                      {t('actions.edit', 'Edit')}
                    </Button>
                  ) : undefined
                }
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName">{t('profilePage.labels.fullName', 'Full Name')}</Label>
                        <Input
                          id="fullName"
                          value={form.fullName}
                          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                          placeholder={t('profilePage.placeholders.fullName', 'Enter your full name')}
                          aria-invalid={!!errors.fullName}
                          autoFocus
                        />
                        {errors.fullName && <p className="text-xs text-tone-danger">{errors.fullName}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phoneNumber">{t('profilePage.labels.phoneNumber', 'Phone Number')}</Label>
                        <Input id="phoneNumber" value={user?.phone_number || ''} disabled readOnly />
                        <p className="text-[11px] text-muted-foreground">
                          {t('profilePage.phoneLocked', 'Contact the school office to change your phone number.')}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email">{t('profilePage.labels.emailAddress', 'Email Address')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder={t('profilePage.placeholders.email', 'Enter your email')}
                          aria-invalid={!!errors.email}
                        />
                        {errors.email && <p className="text-xs text-tone-danger">{errors.email}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="preferredLanguage">
                          {t('profilePage.labels.preferredLanguage', 'Preferred Language')}
                        </Label>
                        <select
                          id="preferredLanguage"
                          value={form.preferredLanguage}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, preferredLanguage: e.target.value as LanguageValue }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.value} value={l.value} className="bg-background text-foreground">
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button type="button" variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                        {t('actions.cancel', 'Cancel')}
                      </Button>
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? t('profilePage.saving', 'Saving...') : t('profilePage.saveChanges', 'Save Changes')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('profilePage.labels.fullName', 'Full Name')} value={user?.full_name} icon={<User />} />
                    <Field label={t('profilePage.labels.phoneNumber', 'Phone Number')} value={user?.phone_number} icon={<Phone />} />
                    <Field
                      label={t('profilePage.labels.emailAddress', 'Email Address')}
                      value={user?.email}
                      icon={<Mail />}
                      emptyLabel={notProvided}
                    />
                    <Field
                      label={t('profilePage.labels.preferredLanguage', 'Preferred Language')}
                      value={languageLabel}
                      icon={<Globe />}
                    />
                  </dl>
                )}
              </Panel>
            </form>

            {/* Work details (staff roles only) */}
            {hasWorkDetails && (
              <Panel title={t('profilePage.work', 'Work details')} icon={<Briefcase />}>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <Field label={t('profilePage.department', 'Department')} value={staff?.department} />
                  <Field label={t('profilePage.designation', 'Designation')} value={staff?.designation} />
                  <Field
                    label={t('profilePage.joiningDate', 'Joining date')}
                    value={staff?.joining_date ? formatDate(staff.joining_date) : undefined}
                  />
                </dl>
              </Panel>
            )}
          </div>

          <div className="space-y-4">
            {/* Appearance */}
            <Panel title={t('profilePage.appearance.title', 'Appearance')} icon={<Palette />}>
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('profilePage.mode', 'Mode')}</p>
                  <div role="radiogroup" aria-label={t('profilePage.mode', 'Mode')} className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
                    {(['light', 'dark'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={theme === mode}
                        onClick={() => theme !== mode && toggleTheme()}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors',
                          theme === mode
                            ? 'bg-background font-medium text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {mode === 'light' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                        {mode === 'light' ? t('profilePage.light', 'Light') : t('profilePage.dark', 'Dark')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {t('profilePage.appearance.colorTheme', 'Color Theme')}
                  </p>
                  <div role="radiogroup" aria-label={t('profilePage.appearance.colorTheme', 'Color Theme')} className="flex flex-wrap gap-2">
                    {COLOR_SCHEMES.map((scheme) => {
                      const selected = colorScheme === scheme.id;
                      const name = t(scheme.nameKey, scheme.fallback);
                      return (
                        <button
                          key={scheme.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={name}
                          title={name}
                          onClick={() => setColorScheme(scheme.id)}
                          className={cn(
                            'flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected ? 'ring-2 ring-foreground/70' : 'hover:ring-2 hover:ring-border'
                          )}
                          style={{ backgroundColor: scheme.swatch }}
                        >
                          {selected && <Check className="size-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Security */}
            <Panel title={t('profilePage.security.title', 'Security')} icon={<Lock />}>
              <div className="flex items-start gap-3">
                <IconChip tone="neutral">
                  <Lock />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    {t('profilePage.changePasswordHelp', "Use a strong password you don't use elsewhere.")}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/change-password')}>
                    {t('changePassword.changePassword', 'Change Password')}
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
