// src/components/demo-nav.tsx

'use client';

import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Component,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DemoNav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: 'Components Index',
      href: '/components-demo',
      icon: <Component className="h-4 w-4" />,
    },
    {
      title: 'Full Demo',
      href: '/components-demo/full',
      icon: <FileText className="h-4 w-4" />,
    }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border rounded-full shadow-lg p-1 flex gap-1 z-50">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? 'default' : 'ghost'}
          size="sm"
          className="flex items-center gap-2"
          asChild
        >
          <Link href={item.href}>
            {item.icon}
            <span className="hidden sm:inline">{item.title}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}