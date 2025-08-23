// src/components/layout/enhanced-topbar.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageHeader {
  title: string;
  subtitle?: string;
}

// Page header configurations
const pageHeaders: Record<string, PageHeader> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Welcome back! Here\'s what\'s happening today.'
  },
  '/staff': {
    title: 'Staff Management',
    subtitle: 'Manage school staff, teachers, and administrators.'
  },
  '/students': {
    title: 'Student Management',
    subtitle: 'Manage student records, admissions, and academic progress.'
  },
  '/homework': {
    title: 'Homework Management',
    subtitle: 'Create, assign, and track homework assignments.'
  },
  '/classwork': {
    title: 'Classwork Management',
    subtitle: 'Track daily class activities and topics covered.'
  },
  '/messages': {
    title: 'Messages',
    subtitle: 'Communicate with parents, staff, and students.'
  },
  '/calendar': {
    title: 'Calendar',
    subtitle: 'Manage school events, holidays, and important dates.'
  },
  '/calendar/create': {
    title: 'Create Event',
    subtitle: 'Add a new event to the school calendar.'
  },
  '/calendar/[id]/edit': {
    title: 'Edit Event',
    subtitle: 'Modify event details and settings.'
  },
  '/approvals': {
    title: 'Event Approvals',
    subtitle: 'Review and manage event approvals.'
  },
  '/attendance': {
    title: 'Attendance',
    subtitle: 'Track student and staff attendance records.'
  },
  '/leave-requests': {
    title: 'Leave Requests',
    subtitle: 'Manage and approve leave requests from staff and students.'
  },
  '/birthdays': {
    title: 'Birthdays',
    subtitle: 'Celebrate student and staff birthdays.'
  },
  '/profile': {
    title: 'Profile',
    subtitle: 'Manage your account settings and preferences.'
  },
  '/parents': {
    title: 'Parent Management',
    subtitle: 'Manage parent accounts and student relationships.'
  },
  '/parents/create': {
    title: 'Add New Parent',
    subtitle: 'Create a new parent account. Student linking is optional and can be done later.'
  },
  '/students/create': {
    title: 'Add New Student',
    subtitle: 'Add a new student to the school system.'
  },
  '/students/[id]': {
    title: 'Student Details',
    subtitle: 'View comprehensive student information and records.'
  },
  '/academic/setup': {
    title: 'Academic Setup',
    subtitle: 'Manage academic years, classes, divisions, and subjects.'
  },
  '/students/[id]/edit': {
    title: 'Edit Student',
    subtitle: 'Update student information and details.'
  }
};

export function EnhancedTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [currentPageHeader, setCurrentPageHeader] = useState<PageHeader | null>(null);

  // Update page header when route changes
  useEffect(() => {
    // Find exact match first, then try to find partial matches
    let header = pageHeaders[pathname];
    
    if (!header) {
      // Try to find partial matches for dynamic routes
      for (const [route, pageHeader] of Object.entries(pageHeaders)) {
        // Handle dynamic routes like /calendar/[id]/edit
        const regexPattern = route.replace(/\[.*?\]/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(pathname)) {
          header = pageHeader;
          break;
        }
        
        // Handle partial matches for nested routes
        if (pathname.startsWith(route)) {
          header = pageHeader;
          break;
        }
      }
    }

    // Handle dynamic routes with custom titles
    if (pathname.includes('/staff/') && pathname !== '/staff') {
      if (pathname.includes('/edit')) {
        header = {
          title: 'Edit Staff Member',
          subtitle: 'Update staff information and details.'
        };
      } else if (pathname.match(/\/staff\/[^\/]+$/)) {
        header = {
          title: 'Staff Details',
          subtitle: 'View comprehensive staff information and assignments.'
        };
      }
    }

    // Handle student dynamic routes
    if (pathname.includes('/students/') && pathname !== '/students') {
      if (pathname.includes('/edit')) {
        header = {
          title: 'Edit Student',
          subtitle: 'Update student information and details.'
        };
      } else if (pathname.match(/\/students\/[^\/]+$/) && !pathname.includes('/create')) {
        header = {
          title: 'Student Details',
          subtitle: 'View comprehensive student information and records.'
        };
      }
    }

    setCurrentPageHeader(header);
  }, [pathname]);

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
              <h1 className="text-lg font-semibold text-foreground">Welcome</h1>
              <p className="text-muted-foreground text-xs">
                Navigate to get started with your tasks.
              </p>
            </div>
          )}
        </div>

        {/* Right Section - Theme Toggle & User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
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
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}