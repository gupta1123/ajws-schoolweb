// src/components/layout/global-header.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  User,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function GlobalHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    // The logout function now handles redirection internally
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline">{t('brand.name')}</span>
          </Link>
        </div>

        {/* Navigation for authenticated users */}
        {user ? (
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs capitalize leading-none text-muted-foreground">
                      {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('common.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">{t('common.settings')}</span>
            </Button>
          </div>
        ) : (
          // Navigation for unauthenticated users
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            {pathname !== '/login' && (
              <Button variant="ghost" asChild>
                <Link href="/login">{t('common.login')}</Link>
              </Button>
            )}
            {pathname !== '/register' && (
              <Button asChild>
                <Link href="/register">{t('common.register')}</Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation for authenticated users */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">
                  {t('common.welcome')}, {user?.full_name}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </Button>
            </div>
            
            <nav className="flex flex-col gap-2 py-2">
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                <BookOpen className="h-4 w-4" />
                {t('common.dashboard')}
              </Link>
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                <User className="h-4 w-4" />
                {t('common.profile')}
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted">
                <Settings className="h-4 w-4" />
                {t('common.settings')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
