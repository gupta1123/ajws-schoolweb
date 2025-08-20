// src/components/layout/sidebar.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Home, Users, Clipboard, FileText, MessageSquare, User, School, Calendar, Cake, Settings, LogOut, UserCheck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Categorized navigation items for teachers
const teacherNavItems = [
  {
    category: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      }
    ]
  },
  {
    category: 'Academics',
    items: [
      {
        title: 'My Classes',
        href: '/classes',
        icon: BookOpen,
      },
      {
        title: 'Attendance',
        href: '/attendance',
        icon: CheckCircle,
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
      }
    ]
  },
  {
    category: 'Communication',
    items: [
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageSquare,
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        title: 'Leave Requests',
        href: '/leave-requests',
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
      }
    ]
  }
];

// Categorized navigation items for admins/principals
const adminNavItems = [
  {
    category: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      }
    ]
  },
  {
    category: 'Academics',
    items: [
      {
        title: 'Students',
        href: '/students',
        icon: Users,
      },
      {
        title: 'Parents',
        href: '/parents',
        icon: UserCheck,
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

    ]
  },
  {
    category: 'Communication',
    items: [
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageSquare,
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        title: 'Leave Requests',
        href: '/leave-requests',
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
      }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Don't show sidebar on auth pages
  if (typeof window !== 'undefined' && 
      (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return null;
  }

  // Determine which navigation items to show based on user role
  const navConfig = user?.role === 'teacher' ? teacherNavItems : 
                   (user?.role === 'admin' || user?.role === 'principal') ? adminNavItems : [];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="hidden md:block w-64 border-r bg-background fixed h-screen top-0 left-0">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navConfig.map((category) => (
              <div key={category.category} className="mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800',
                          pathname === item.href && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-sm font-medium truncate max-w-[120px]">{user?.full_name}</div>
                  <div className="text-xs text-muted-foreground capitalize truncate max-w-[120px]">
                    {user?.role}
                  </div>
                </div>
              </div>
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
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
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
    </div>
  );
}