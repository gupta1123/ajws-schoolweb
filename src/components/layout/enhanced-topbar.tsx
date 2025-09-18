// src/components/layout/enhanced-topbar.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';
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

interface PageHeader { title: string; subtitle?: string; }

const headerKeyByPath: Record<string, string> = {
  '/dashboard': 'topbar.dashboard',
  '/staff': 'topbar.staff',
  '/students': 'topbar.students',
  '/homework': 'topbar.homework',
  '/classwork': 'topbar.classwork',
  '/messages': 'topbar.messages',
  '/calendar': 'topbar.calendar',
  '/calendar/create': 'topbar.calendarCreate',
  '/calendar/[id]/edit': 'topbar.calendarEdit',
  '/approvals': 'topbar.approvals',
  '/attendance': 'topbar.attendance',
  '/leave-requests': 'topbar.leaveRequests',
  '/birthdays': 'topbar.birthdays',
  '/profile': 'topbar.profile',
  '/parents': 'topbar.parents',
  '/parents/create': 'topbar.addParent',
  '/students/create': 'topbar.addStudent',
  '/students/[id]': 'topbar.studentDetails',
  '/academic/setup': 'topbar.academicSetup',
  '/students/[id]/edit': 'topbar.editStudent'
};

export function EnhancedTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [currentPageHeader, setCurrentPageHeader] = useState<PageHeader | null>(null);

  // Update page header when route changes
  useEffect(() => {
    // Find exact match first, then try to find partial matches
    let key = headerKeyByPath[pathname];
    
    if (!key) {
      // Try to find partial matches for dynamic routes
      for (const [route, pageHeaderKey] of Object.entries(headerKeyByPath)) {
        // Handle dynamic routes like /calendar/[id]/edit
        const regexPattern = route.replace(/\[.*?\]/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(pathname)) {
          key = pageHeaderKey;
          break;
        }
        
        // Handle partial matches for nested routes
        if (pathname.startsWith(route)) {
          key = pageHeaderKey;
          break;
        }
      }
    }

    // Handle dynamic routes with custom titles
    if (pathname.includes('/staff/') && pathname !== '/staff') {
      if (pathname.includes('/edit')) {
        key = 'topbar.editStaff';
      } else if (pathname.match(/\/staff\/[^\/]+$/)) {
        key = 'topbar.staffDetails';
      }
    }

    // Handle student dynamic routes
    if (pathname.includes('/students/') && pathname !== '/students') {
      if (pathname.includes('/edit')) {
        key = 'topbar.editStudent';
      } else if (pathname.match(/\/students\/[^\/]+$/) && !pathname.includes('/create')) {
        key = 'topbar.studentDetails';
      }
    }

    const header: PageHeader = key
      ? { title: t(`${key}.title`), subtitle: t(`${key}.subtitle`, undefined) }
      : { title: t('topbar.fallback.title'), subtitle: t('topbar.fallback.subtitle') };

    setCurrentPageHeader(header);
  }, [pathname, t]);

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-background border-b z-40">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden mr-2 md:mr-4" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Page Header Section */}
        <div className="flex-1 min-w-0">
          {currentPageHeader ? (
            <div className="space-y-0.5">

              
              {/* Page Title */}
              <h1 className="text-lg font-semibold text-foreground truncate">
                {currentPageHeader.title}
              </h1>
              
              {/* Page Subtitle */}
              {currentPageHeader.subtitle && (
                <p className="text-muted-foreground text-xs truncate">
                  {currentPageHeader.subtitle}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <h1 className="text-lg font-semibold text-foreground">{t('topbar.fallback.title')}</h1>
              <p className="text-muted-foreground text-xs">{t('topbar.fallback.subtitle')}</p>
            </div>
          )}
        </div>

        {/* Right Section - Theme Toggle & User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher compact />
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 md:gap-3 h-10 px-2 md:px-4">
                <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user?.role}
                  </div>
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
        </div>
      </div>
    </header>
  );
}
