// src/lib/nav/sidebar-nav.ts
//
// Single source of truth for sidebar navigation. Each role gets a list of
// groups; groups without a `label` render with no heading (e.g. Dashboard).

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  School,
  ClipboardCheck,
  NotebookPen,
  CalendarClock,
  GraduationCap,
  Users,
  UserCog,
  Contact,
  Megaphone,
  FileText,
  Calendar,
  Cake,
  Utensils,
  MessageCircle,
} from 'lucide-react';

export type NavRole = 'teacher' | 'admin' | 'principal' | 'attendance_staff' | 'parent';

export interface NavItem {
  /** i18n key */
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** i18n key; omit for an unlabeled group */
  label?: string;
  items: NavItem[];
}

const item = (title: string, href: string, icon: LucideIcon): NavItem => ({ title, href, icon });

const dashboard: NavGroup = {
  items: [item('common.dashboard', '/dashboard', LayoutDashboard)],
};

const teacherNav: NavGroup[] = [
  dashboard,
  {
    label: 'sidebar.category.academics',
    items: [
      item('common.myClasses', '/classes', GraduationCap),
      item('common.timetable', '/timetable', CalendarClock),
      item('common.attendance', '/attendance', ClipboardCheck),
      item('common.homework', '/homework', NotebookPen),
    ],
  },
  {
    label: 'sidebar.category.schoolLife',
    items: [
      item('common.messaging', '/messaging', MessageCircle),
      item('common.announcements', '/announcements', Megaphone),
      item('common.leaveRequests', '/leave-requests', FileText),
      item('common.calendar', '/calendar', Calendar),
      item('common.birthdays', '/birthdays', Cake),
    ],
  },
];

const adminNav: NavGroup[] = [
  dashboard,
  {
    label: 'sidebar.category.academics',
    items: [
      item('common.academicSetup', '/academic/setup', School),
      item('common.attendance', '/admin/attendance', ClipboardCheck),
      item('common.homework', '/homework', NotebookPen),
      item('common.timetable', '/admin/timetable', CalendarClock),
    ],
  },
  {
    label: 'sidebar.category.people',
    items: [
      item('common.students', '/students', Users),
      item('common.staff', '/staff', UserCog),
      item('common.parents', '/parents', Contact),
    ],
  },
  {
    label: 'sidebar.category.schoolLife',
    items: [
      item('common.announcements', '/admin/announcements', Megaphone),
      item('common.leaveRequests', '/leave-requests', FileText),
      item('common.calendar', '/calendar', Calendar),
      item('common.birthdays', '/birthdays', Cake),
      item('common.foodMenu', '/admin/food-menu', Utensils),
    ],
  },
];

// Principal = admin menu + Messaging in "School life".
const principalNav: NavGroup[] = adminNav.map((group) =>
  group.label === 'sidebar.category.schoolLife'
    ? { ...group, items: [item('common.messaging', '/admin/messaging', MessageCircle), ...group.items] }
    : group
);

const attendanceStaffNav: NavGroup[] = [
  {
    label: 'sidebar.category.academics',
    items: [item('common.attendance', '/attendance', ClipboardCheck)],
  },
];

const parentNav: NavGroup[] = [
  dashboard,
  {
    label: 'sidebar.category.schoolLife',
    items: [
      item('common.calendar', '/calendar', Calendar),
      item('common.birthdays', '/birthdays', Cake),
      item('common.foodMenu', '/admin/food-menu', Utensils),
    ],
  },
];

const navByRole: Record<NavRole, NavGroup[]> = {
  teacher: teacherNav,
  admin: adminNav,
  principal: principalNav,
  attendance_staff: attendanceStaffNav,
  parent: parentNav,
};

export function getSidebarNav(role?: string): NavGroup[] {
  return navByRole[role as NavRole] ?? [];
}

/** Active when the path equals the href or is nested under it. */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
