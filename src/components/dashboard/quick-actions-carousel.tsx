// src/components/dashboard/quick-actions-carousel.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/ui/quick-action-button';
import { 
  Users, 
  Calendar,
  FileBarChart,
  UserCog,
  Mail,
  FilePlus
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function QuickActionsCarousel() {
  const { user } = useAuth();
  const [actions, setActions] = useState<Array<{
    href: string;
    icon: React.ReactNode;
    label: string;
    description: string;
  }>>([]);

  useEffect(() => {
    // Define actions based on user role
    let roleActions: Array<{
      href: string;
      icon: React.ReactNode;
      label: string;
      description: string;
    }> = [];
    
    if (user?.role === 'teacher') {
      roleActions = [
        { 
          href: '/classes', 
          icon: <Users className="h-5 w-5" />, 
          label: 'My Classes', 
          description: 'View your classes' 
        },
        { 
          href: '/homework/create', 
          icon: <FilePlus className="h-5 w-5" />, 
          label: 'Create Homework', 
          description: 'Assign new homework' 
        },
        { 
          href: '/messages', 
          icon: <Mail className="h-5 w-5" />, 
          label: 'Messages', 
          description: 'Check messages' 
        },
        { 
          href: '/calendar', 
          icon: <Calendar className="h-5 w-5" />, 
          label: 'Calendar', 
          description: 'View events' 
        },
      ];
    } else if (user?.role === 'admin' || user?.role === 'principal') {
      roleActions = [
        { 
          href: '/students', 
          icon: <Users className="h-5 w-5" />, 
          label: 'Students', 
          description: 'Manage students' 
        },
        { 
          href: '/staff', 
          icon: <UserCog className="h-5 w-5" />, 
          label: 'Staff', 
          description: 'Manage staff' 
        },
        { 
          href: '/reports', 
          icon: <FileBarChart className="h-5 w-5" />, 
          label: 'Reports', 
          description: 'View reports' 
        },
        { 
          href: '/messages', 
          icon: <Mail className="h-5 w-5" />, 
          label: 'Messages', 
          description: 'Check messages' 
        },
      ];
    }
    
    setActions(roleActions);
  }, [user]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <Button variant="ghost" size="sm" className="text-xs">
          Customize
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            href={action.href}
            icon={action.icon}
            label={action.label}
            description={action.description}
            variant="outline"
          />
        ))}
      </div>
    </div>
  );
}