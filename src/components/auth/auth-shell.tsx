// src/components/auth/auth-shell.tsx
//
// Full-screen frame for unauthenticated pages: a soft, theme-aware backdrop,
// language + theme controls in the corner, and the page centered in one column.

'use client';

import { GraduationCap, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';

export function BrandMark() {
  return (
    <div
      className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a5a9a] to-[#0b2545] text-white shadow-lg shadow-[#104070]/25 ring-1 ring-white/15"
      aria-hidden="true"
    >
      <GraduationCap className="size-6" />
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Backdrop: brand glow + faint grid that fades out away from the top */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-14rem] size-[44rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher compact />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 bg-card/60 backdrop-blur"
          onClick={toggleTheme}
          aria-label={t('auth.toggleTheme', 'Toggle theme')}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="pb-6 text-center text-xs text-muted-foreground">
        {t('brand.name')} · {t('brand.tagline')} · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
