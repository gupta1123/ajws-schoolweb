// src/components/ui/timeline.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  author?: {
    name: string;
    role: string;
  };
  details?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({
  events,
  className,
}: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'error':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  const formatTime = (timestamp: string) => {
    return formatDateTime(timestamp);
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted transform translate-x-[-1px]"></div>
        
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="relative pl-12">
              {/* Event dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-background border-2 border-muted flex items-center justify-center z-10">
                {getEventTypeIcon(event.type)}
              </div>
              
              {/* Event card */}
              <Card className={`${getEventTypeColor(event.type)} border-l-4`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{event.title}</h3>
                      
                      {event.description && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTime(event.timestamp)}</span>
                        </div>
                        
                        {event.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{event.author.name} ({event.author.role})</span>
                          </div>
                        )}
                      </div>
                      
                      {expandedEvent === event.id && event.details && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          {event.details}
                        </div>
                      )}
                    </div>
                    
                    {event.details && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => 
                          setExpandedEvent(
                            expandedEvent === event.id ? null : event.id
                          )
                        }
                      >
                        {expandedEvent === event.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}