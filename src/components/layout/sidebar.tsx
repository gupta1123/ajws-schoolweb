// src/components/layout/sidebar.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Home, Users, Clipboard, FileText,AlertCircle, User, School, Calendar, Cake, LogOut, MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
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
  title: string; // i18n key
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavCategory {
  category: string; // i18n key
  items: NavItem[];
}


const teacherNavItems: NavCategory[] = [
  {
    category: 'sidebar.category.dashboard',
    items: [
      {
        title: 'common.dashboard',
        href: '/dashboard',
        icon: Home,
      }
    ]
  },
  {
    category: 'sidebar.category.academics',
    items: [
      {
        title: 'common.myClasses',
        href: '/classes',
        icon: Users,
      },
      {
        title: 'common.timetable',
        href: '/timetable',
        icon: Calendar,
      },
      {
        title: 'common.attendance',
        href: '/attendance',
        icon: CheckSquare,
      },
      {
        title: 'common.homework',
        href: '/homework',
        icon: Clipboard,
      }
    ]
  },
  {
    category: 'sidebar.category.management',
    items: [
      {
        title: 'common.messages',
        href: '/messages',
        icon: MessageSquare,
      },
      {
        title: 'common.announcements',
        href: '/announcements',
        icon: AlertCircle,
      },
      {
        title: 'common.leaveRequests',
        href: '/leave-requests',
        icon: FileText,
      },
      {
        title: 'common.calendar',
        href: '/calendar',
        icon: Calendar,
      },
      {
        title: 'common.birthdays',
        href: '/birthdays',
        icon: Cake,
      }
    ]
  }
];


const adminNavItems = [
  {
    category: 'sidebar.category.dashboard',
    items: [
      {
        title: 'common.dashboard',
        href: '/dashboard',
        icon: Home,
      }
    ]
  },
  {
    category: 'sidebar.category.academics',
    items: [
      {
        title: 'common.academicSetup',
        href: '/academic/setup',
        icon: School,
      },
      {
        title: 'common.students',
        href: '/students',
        icon: Users,
      },
      {
        title: 'common.staff',
        href: '/staff',
        icon: User,
      },
      {
        title: 'common.attendance',
        href: '/admin/attendance',
        icon: CheckSquare,
      },
      {
        title: 'common.timetable',
        href: '/admin/timetable',
        icon: Clock,
      },

    ]
  },
  {
    category: 'sidebar.category.management',
    items: [
      {
        title: 'common.announcements',
        href: '/admin/announcements',
        icon: AlertCircle,
      },
      {
        title: 'common.leaveRequests',
        href: '/leave-requests',
        icon: FileText,
      },
      {
        title: 'common.calendar',
        href: '/calendar',
        icon: Calendar,
      },
      {
        title: 'common.birthdays',
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
  const { t } = useI18n();


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
    navConfig = adminNavItems.map(category => ({ ...category }));
    
    const managementCategory = navConfig.find(category => category.category === 'sidebar.category.management');
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
                <span className="font-bold text-lg text-primary group-hover:text-primary/80 transition-colors">{t('brand.name')}</span>
                <span className="text-xs text-muted-foreground font-medium">{t('brand.tagline')}</span>
              </div>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navConfig.map((category) => (
                <div key={category.category} className="mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t(category.category)}
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
                          <span className="text-sm">{t(item.title)}</span>
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
                <span className="font-bold text-lg text-primary group-hover:text-primary/80 transition-colors">{t('brand.name')}</span>
                <span className="text-xs text-muted-foreground font-medium">{t('brand.tagline')}</span>
              </div>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navConfig.map((category) => (
                <div key={category.category} className="mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">{t(category.category)}</h3>
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
                          <span className="text-sm">{t(item.title)}</span>
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
      </div>
    </>
  );
}
