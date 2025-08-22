// src/components/calendar/event-detail-modal.tsx

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  BookOpen,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { formatDate } from '@/lib/utils';


// Event type configuration
const eventTypeConfig = {
  school: { 
    label: 'Event', 
    color: 'event-school', 
    textColor: 'text-blue-800',
    darkColor: 'dark:bg-blue-900/50',
    borderColor: 'border-school',
    icon: CalendarIcon
  },
  class: { 
    label: 'Class Event', 
    color: 'event-class', 
    textColor: 'text-green-800',
    darkColor: 'dark:bg-green-900/50',
    borderColor: 'border-class',
    icon: BookOpen
  },
  pending_approval: { 
    label: 'Pending Approval', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-800',
    darkColor: 'dark:bg-orange-900/50',
    borderColor: 'border-orange-500',
    icon: CalendarIcon
  }
};

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: keyof typeof eventTypeConfig;
  class?: string;
  teacher?: string;
  requiresApproval?: boolean;
  approved?: boolean;
  category: string;
}

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
  userRole: 'admin' | 'principal' | 'teacher' | 'student';
}

export function EventDetailModal({ 
  event, 
  onClose, 
  onEdit, 
  onDelete, 
  onApprove, 
  onReject,
  userRole 
}: EventDetailModalProps) {
  // Determine if user can edit/delete (admins/principals can always, teachers can for their own events)
  const canEdit = userRole === 'admin' || userRole === 'principal' || 
    (userRole === 'teacher' && event.teacher); // Simplified check
  
  // Determine if user can approve (only admins/principals)
  const canApprove = (userRole === 'admin' || userRole === 'principal') && 
    event.requiresApproval && !event.approved;
  
  const config = event.requiresApproval && !event.approved 
    ? eventTypeConfig.pending_approval 
    : eventTypeConfig[event.type];
  const Icon = config.icon;
  
  // Format date for display
  const formattedDate = formatDate(event.date);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
                <CardTitle>{event.title}</CardTitle>
              </div>
              <CardDescription>
                {config.label}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          
          {event.description && (
            <div className="text-sm">
              <p className="font-medium mb-1">Description:</p>
              <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
            </div>
          )}
          
          {event.class && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{event.class}</span>
            </div>
          )}
          
          {event.teacher && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Created by:</span>
              <span>{event.teacher}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            {event.approved ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Approved</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">Pending Approval</span>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {canApprove && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onApprove && onApprove(event.id)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onReject && onReject(event.id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {canEdit && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(event.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(event.id)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}