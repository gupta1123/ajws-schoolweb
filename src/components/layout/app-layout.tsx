// src/components/layout/app-layout.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Sidebar } from './sidebar';
import { EnhancedTopbar } from './enhanced-topbar';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show layout for auth pages
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - fixed positioning */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Enhanced Topbar - fixed positioning */}
      <EnhancedTopbar onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Main Content Area - properly positioned */}
      <main className="pt-16 md:ml-64 min-h-screen bg-background">
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