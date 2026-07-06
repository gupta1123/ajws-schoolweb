// src/app/(teacher)/layout.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { usePathname } from 'next/navigation';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAttendanceRoute = pathname === '/attendance' || pathname.startsWith('/attendance/');
  const isHomeworkRoute = pathname === '/homework' || pathname.startsWith('/homework/');

  // Attendance staff can only access the attendance routes inside this group.
  if (user?.role === 'attendance_staff' && isAttendanceRoute) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }

  if (
    user &&
    isHomeworkRoute &&
    (user.role === 'teacher' || user.role === 'admin' || user.role === 'principal')
  ) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }

  // Only allow teachers to access teacher routes
  if (user && user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only teachers can access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
