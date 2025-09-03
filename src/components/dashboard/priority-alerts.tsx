// src/components/dashboard/priority-alerts.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Bell,
  X
} from 'lucide-react';
import { useState } from 'react';

// Mock alert data - in a real app this would come from an API
const mockAlerts = [
  {
    id: '1',
    type: 'urgent',
    title: 'Homework submissions due today',
    description: '3 assignments need grading',
    time: '2 hours ago',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-500'
  },
  {
    id: '2',
    type: 'info',
    title: 'Parent messages',
    description: '2 unread messages from parents',
    time: '1 hour ago',
    icon: <Bell className="h-4 w-4" />,
    color: 'text-blue-500'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Student birthday today',
    description: 'Aarav Patel turns 10 today',
    time: '30 minutes ago',
    icon: <Bell className="h-4 w-4" />,
    color: 'text-yellow-500'
  }
];

export function PriorityAlerts() {
  const [alerts, setAlerts] = useState(mockAlerts);

  const handleDismiss = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <Card className="mb-6 border-0 shadow-none bg-muted/30">
      <CardHeader className="py-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Priority Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="flex items-start justify-between p-3 rounded-lg bg-background border"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${alert.color}`}>
                  {alert.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{alert.title}</h3>
                  <p className="text-muted-foreground text-xs">{alert.description}</p>
                  <p className="text-muted-foreground text-xs mt-1">{alert.time}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}