// src/app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, LifeBuoy, Phone } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { BrandMark } from '@/components/auth/auth-shell';

export default function LoginPage() {
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const { login, error } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(phone_number, password);
      const storedUser = localStorage.getItem('user');
      const role = storedUser ? JSON.parse(storedUser)?.role : null;
      // Keep the button in its loading state while navigating away.
      router.push(role === 'attendance_staff' ? '/attendance' : '/dashboard');
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login failed:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card/80 p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(16,64,112,0.25)] backdrop-blur-sm duration-500 sm:p-10">
      <div className="flex flex-col items-center text-center">
        <BrandMark />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t('brand.name')}
        </p>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {t('auth.welcomeBack', 'Welcome back')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.title')}</p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error === 'Login failed' ? t('auth.loginFailed', error) : error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phone_number">{t('auth.phoneNumber')}</Label>
          <div className="relative">
            <Phone
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              autoFocus
              placeholder={t('auth.enterPhone')}
              value={phone_number}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="h-11 rounded-lg bg-background/60 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
              onBlur={() => setCapsLock(false)}
              required
              className="h-11 rounded-lg bg-background/60 pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={
                showPassword
                  ? t('auth.hidePassword', 'Hide password')
                  : t('auth.showPassword', 'Show password')
              }
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {capsLock && (
            <p className="text-xs text-tone-warning" role="status">
              {t('auth.capsLockOn', 'Caps Lock is on')}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="group h-11 w-full rounded-lg text-sm font-semibold shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            <>
              {t('auth.signIn')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <LifeBuoy className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{t('auth.forgotNote')}</span>
      </div>
    </div>
  );
}
