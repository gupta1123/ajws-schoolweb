// src/components/ui/bulk-action-toolbar.tsx

'use client';

import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Download,
  Mail,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  actions = [],
  className,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={`flex items-center justify-between p-3 bg-muted rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'default'}
            size="sm"
            onClick={action.onClick}
            className="h-8 px-3"
          >
            {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
        
        {actions.length === 0 && (
          <>
            <Button variant="outline" size="sm" className="h-8 px-3">
              <Mail className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="destructive" size="sm" className="h-8 px-3">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Check className="h-4 w-4 mr-2" />
              Select all
            </DropdownMenuItem>
            <DropdownMenuItem>
              <X className="h-4 w-4 mr-2" />
              Clear selection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}