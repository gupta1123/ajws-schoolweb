// src/components/layout/sidebar.tsx

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, User, LogOut, ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { getSidebarNav, isNavActive } from '@/lib/nav/sidebar-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarContent({ collapsed = false, onNavigate, onToggleCollapse }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const groups = getSidebarNav(user?.role);
  const homeHref = user?.role === 'attendance_staff' ? '/attendance' : '/dashboard';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex h-16 shrink-0 items-center border-b', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Link href={homeHref} onClick={onNavigate} className="flex items-center gap-3" title={t('brand.name')}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight text-primary">{t('brand.name')}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{t('brand.tagline')}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label={t('sidebar.mainNav', 'Main navigation')} className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group, index) => (
          <div key={group.label ?? `group-${index}`} className={cn(index > 0 && 'mt-4')}>
            {group.label &&
              (collapsed ? (
                <div className="mx-3 mb-1.5 border-t" aria-hidden />
              ) : (
                <h3 className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(group.label)}
                </h3>
              ))}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                const label = t(item.title);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md py-2 text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        collapsed ? 'justify-center px-0' : 'px-3',
                        active
                          ? 'bg-tone-primary-soft font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: collapse toggle (desktop) + user menu */}
      <div className="shrink-0 space-y-1 border-t p-2">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
            aria-label={collapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
            className={cn(
              'flex w-full items-center gap-3 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              collapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>{t('sidebar.collapse', 'Collapse sidebar')}</span>}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-md py-2 text-left transition-colors hover:bg-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tone-primary-soft text-primary">
                <User className="size-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user?.full_name}</span>
                    <span className="block truncate text-xs capitalize text-muted-foreground">{user?.role}</span>
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" side={collapsed ? 'right' : 'top'} align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs capitalize leading-none text-muted-foreground">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" onClick={onNavigate} className="flex items-center">
                  <User className="mr-2 size-4" />
                  <span>{t('common.profile')}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center">
              <LogOut className="mr-2 size-4" />
              <span>{t('common.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen border-r bg-background transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile drawer */}
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  );
}
