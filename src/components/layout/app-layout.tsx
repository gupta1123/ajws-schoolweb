// src/components/layout/app-layout.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Sidebar } from './sidebar';
import { EnhancedTopbar } from './enhanced-topbar';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the saved sidebar preference (desktop only).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);
  const pathname = usePathname();
  const router = useRouter();

  const isAttendanceStaffAllowedPath =
    pathname === '/attendance' ||
    pathname.startsWith('/attendance/') ||
    pathname === '/profile' ||
    pathname === '/change-password';

  // Auth pages own their full-screen layout; never wrap them in the app shell,
  // even when a stored session exists (otherwise /login renders under the
  // sidebar/topbar offsets).
  const isAuthRoute = pathname === '/login';

  useEffect(() => {
    if (!isAuthRoute && user?.role === 'attendance_staff' && !isAttendanceStaffAllowedPath) {
      router.replace('/attendance');
    }
  }, [isAttendanceStaffAllowedPath, isAuthRoute, router, user?.role]);

  if (!user || isAuthRoute) {
    return <>{children}</>;
  }

  if (user.role === 'attendance_staff' && !isAttendanceStaffAllowedPath) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - fixed positioning */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      
      {/* Enhanced Topbar - fixed positioning */}
      <EnhancedTopbar onMenuClick={() => setSidebarOpen(true)} collapsed={collapsed} />
      
      {/* Main Content Area - properly positioned */}
      <main className={`pt-16 min-h-screen bg-background transition-[margin] duration-200 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
