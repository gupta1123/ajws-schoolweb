// src/components/ui/sortable-list.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GripVertical,
  MoveUp,
  MoveDown,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SortableItem {
  id: string;
  content: React.ReactNode;
  [key: string]: unknown;
}

interface SortableListProps {
  items: SortableItem[];
  onChange: (items: SortableItem[]) => void;
  renderItem?: (item: SortableItem, index: number) => React.ReactNode;
  className?: string;
}

export function SortableList({
  items,
  onChange,
  renderItem,
  className,
}: SortableListProps) {
  const [, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId === targetId) return;
    
    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    
    onChange(newItems);
    setDraggedItem(null);
  };

  const moveItemUp = (index: number) => {
    if (index <= 0) return;
    
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const moveItemDown = (index: number) => {
    if (index >= items.length - 1) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const defaultRenderItem = (item: SortableItem) => (
    <div className="flex items-center justify-between p-3">
      <span>{item.content}</span>
    </div>
  );

  const renderListItem = renderItem || defaultRenderItem;

  return (
    <div className={className}>
      {items.map((item, index) => (
        <Card 
          key={item.id}
          className="mb-2 hover:shadow-md transition-shadow"
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          <CardContent className="p-0">
            <div className="flex items-center">
              <div 
                className="p-3 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1">
                {renderListItem(item, index)}
              </div>
              
              <div className="flex items-center p-3 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveItemUp(index)}
                  disabled={index === 0}
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveItemDown(index)}
                  disabled={index === items.length - 1}
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {items.length === 0 && (
        <Card className="border-dashed border-muted">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No items yet. Add some items to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}