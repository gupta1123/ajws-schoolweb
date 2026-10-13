// src/components/layout/enhanced-topbar.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useI18n } from '@/lib/i18n/context';
import { useTopbarSlotValue } from '@/components/layout/topbar-slot';
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

// Sub-pages that show a back arrow in the topbar (opt-in, so other pages are unchanged)
const backTargets: { pattern: RegExp; href: string }[] = [
  { pattern: /^\/admin\/attendance\/[^/]+$/, href: '/admin/attendance' },
  { pattern: /^\/admin\/food-menu\/monthly\/create$/, href: '/admin/food-menu' },
  { pattern: /^\/staff\/create$/, href: '/staff' },
  { pattern: /^\/staff\/(?!create$|assign-subjects$)[^/]+$/, href: '/staff' },
  { pattern: /^\/students\/[^/]+$/, href: '/students' },
  { pattern: /^\/homework\/(create|edit\/[^/]+)$/, href: '/homework' },
  { pattern: /^\/calendar\/(create|[^/]+\/edit)$/, href: '/calendar' },
  { pattern: /^\/admin\/announcements\/(create|[^/]+|[^/]+\/edit)$/, href: '/admin/announcements' },
];

interface PageHeader { title: string; subtitle?: string; }

const headerKeyByPath: Record<string, string> = {
  '/dashboard': 'topbar.dashboard',
  '/staff/create': 'topbar.addStaff',
  '/staff': 'topbar.staff',
  '/students': 'topbar.students',
  '/homework': 'topbar.homework',
  '/homework/create': 'topbar.homeworkCreate',
  '/homework/edit/[id]': 'topbar.homeworkEdit',
  '/classwork': 'topbar.classwork',
  '/messaging': 'topbar.messaging',
  '/calendar': 'topbar.calendar',
  '/calendar/create': 'topbar.calendarCreate',
  '/calendar/[id]/edit': 'topbar.calendarEdit',
  '/approvals': 'topbar.approvals',
  '/attendance': 'topbar.attendance',
  '/admin/attendance/[id]': 'topbar.attendanceDetails',
  '/admin/attendance': 'topbar.attendance',
  '/leave-requests': 'topbar.leaveRequests',
  '/birthdays': 'topbar.birthdays',
  '/admin/timetable': 'topbar.timetable',
  '/timetable': 'topbar.timetable',
  '/admin/announcements/create': 'topbar.announcementCreate',
  '/announcements/create': 'topbar.announcementCreate',
  '/admin/announcements/[id]/edit': 'topbar.announcementEdit',
  '/admin/announcements/[id]': 'topbar.announcementDetails',
  '/admin/announcements': 'topbar.announcements',
  '/announcements': 'topbar.announcements',
  '/admin/food-menu/monthly/create': 'topbar.foodMenuUpload',
  '/admin/food-menu': 'topbar.foodMenu',
  '/profile': 'topbar.profile',
  '/parents': 'topbar.parents',
  '/parents/create': 'topbar.addParent',
  '/students/create': 'topbar.addStudent',
  '/students/[id]': 'topbar.studentDetails',
  '/academic/setup': 'topbar.academicSetup',
  '/students/[id]/edit': 'topbar.editStudent'
};

export function EnhancedTopbar({ onMenuClick, collapsed = false }: { onMenuClick?: () => void; collapsed?: boolean }) {
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

    // /homework would otherwise swallow its sub-routes via the prefix match above
    if (/^\/homework\/edit\/[^/]+$/.test(pathname)) key = 'topbar.homeworkEdit';

    // Handle dynamic routes with custom titles
    if (pathname.includes('/staff/') && pathname !== '/staff') {
      if (pathname.includes('/edit')) {
        key = 'topbar.editStaff';
      } else if (pathname === '/staff/create') {
        key = 'topbar.addStaff';
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

  const slot = useTopbarSlotValue();
  // a student opened from a filtered list goes back to that same class
  const [listQuery, setListQuery] = useState('');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('class_division_id');
    setListQuery(id ? `?class_division_id=${id}` : '');
  }, [pathname]);
  const backTarget = backTargets.find((b) => b.pattern.test(pathname))?.href;
  const backHref = backTarget === '/students' ? `/students${listQuery}` : backTarget;

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 transition-[left] duration-200 ${collapsed ? 'md:left-16' : 'md:left-56'}`}>
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden mr-2 md:mr-4" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Page Header Section */}
        {backHref && (
          <Button asChild variant="ghost" size="icon" className="mr-2 size-9 shrink-0 text-muted-foreground">
            <Link href={backHref} aria-label={t('common.back', 'Back')}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
        )}
        <div className="flex-1 min-w-0">
          {currentPageHeader ? (
            <div className="space-y-0.5">

              
              {/* Page Title */}
              <h1 className="text-base font-semibold text-foreground truncate">
                {slot?.title ?? currentPageHeader.title}
              </h1>
              
              {/* Page Subtitle */}
              {(slot?.subtitle ?? currentPageHeader.subtitle) && pathname !== '/dashboard' && (
                <p className="text-muted-foreground text-xs truncate">
                  {slot?.subtitle ?? currentPageHeader.subtitle}
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
          {slot?.actions}
          <LanguageSwitcher compact />
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label={user?.full_name}>
                <div className="bg-muted rounded-full size-8 flex items-center justify-center">
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
        </div>
      </div>
    </header>
  );
}
