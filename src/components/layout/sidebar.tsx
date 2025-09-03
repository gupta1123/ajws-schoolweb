// src/components/layout/sidebar.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Home, Users, Clipboard, FileText,AlertCircle, User, School, Calendar, Cake, LogOut, MessageSquare, CheckSquare, Clock } from 'lucide-react';
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

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}


const teacherNavItems: NavCategory[] = [
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
        icon: Users,
      },
      {
        title: 'Timetable',
        href: '/timetable',
        icon: Calendar,
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
      }
    ]
  },
  {
    category: 'Management',
    items: [
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageSquare,
      },
      {
        title: 'Announcements',
        href: '/announcements',
        icon: AlertCircle,
      },
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
        title: 'Academic Setup',
        href: '/academic/setup',
        icon: School,
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
        title: 'Attendance',
        href: '/admin/attendance',
        icon: CheckSquare,
      },
      {
        title: 'Timetable',
        href: '/admin/timetable',
        icon: Clock,
      },

    ]
  },
  {
    category: 'Management',
    items: [
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageSquare,
      },
      {
        title: 'Announcements',
        href: '/admin/announcements',
        icon: AlertCircle,
      },
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


const principalNavItems: NavItem[] = [
  // Approvals section removed/hidden
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();


  if (typeof window !== 'undefined' && 
      (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return null;
  }

  let navConfig: NavCategory[];
  if (user?.role === 'teacher') {
    navConfig = teacherNavItems;
  } else if (user?.role === 'admin') {
    navConfig = adminNavItems;
  } else if (user?.role === 'principal') {

    navConfig = adminNavItems.map(category => ({
      ...category,
      items: [...category.items]
    }));
    

    const managementCategory = navConfig.find(category => category.category === 'Management');
    if (managementCategory) {
      managementCategory.items = [...managementCategory.items, ...principalNavItems];
    }
  } else {
    navConfig = [];
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
   
      <div className="hidden md:block w-64 border-r bg-background fixed h-screen top-0 left-0 z-30">
        <div className="flex h-full flex-col">
          {/* Product Branding Header */}
          <div className="flex h-16 items-center px-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-primary rounded-xl w-9 h-9 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary group-hover:text-primary/80 transition-colors">AJWS</span>
                <span className="text-xs text-muted-foreground font-medium">School Management</span>
              </div>
            </Link>
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
                    
                      if (!Icon) {
                        return null;
                      }
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

      {/* Mobile Sidebar */}
      <div className={cn(
        "md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Product Branding Header */}
          <div className="flex h-16 items-center px-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-primary rounded-xl w-9 h-9 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary group-hover:text-primary/80 transition-colors">AJWS</span>
                <span className="text-xs text-muted-foreground font-medium">School Management System</span>
              </div>
            </Link>
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
                          onClick={onClose}
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
    </>
  );
}