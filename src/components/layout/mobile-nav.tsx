// src/components/layout/mobile-nav.tsx

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, BookOpen, Home, Users, Clipboard, FileText, MessageSquare, User, School, Calendar, Cake, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

const teacherNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'My Classes',
    href: '/classes',
    icon: BookOpen,
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: CheckSquare,
  },
  {
    title: 'Homework',
    href: '/homework',
    icon: Clipboard,
  },
  {
    title: 'Classwork',
    href: '/classwork',
    icon: FileText,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Birthdays',
    href: '/birthdays',
    icon: Cake,
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
];

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    title: 'Staff',
    href: '/staff',
    icon: User,
  },
  {
    title: 'Academic Structure',
    href: '/academic',
    icon: School,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Birthdays',
    href: '/birthdays',
    icon: Cake,
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show mobile nav on auth pages
  if (typeof window !== 'undefined' && 
      (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return null;
  }

  // Determine which navigation items to show based on user role
  const navItems = user?.role === 'teacher' ? teacherNavItems : 
                  (user?.role === 'admin' || user?.role === 'principal') ? adminNavItems : [];

  return (
    <div className="md:hidden flex items-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-4 border-b">
              <h2 className="text-lg font-semibold">
                {user?.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <nav className="grid items-start px-2 text-sm font-medium">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800',
                        pathname === item.href && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div className="font-medium truncate">{user?.full_name}</div>
                <div className="truncate">{user?.role}</div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}