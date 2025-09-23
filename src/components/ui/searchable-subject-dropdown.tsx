// src/components/ui/searchable-subject-dropdown.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  is_active?: boolean;
}

interface SearchableSubjectDropdownProps {
  subjects: Subject[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  showCode?: boolean;
  filterAssigned?: boolean;
  assignedSubjects?: string[];
}

export function SearchableSubjectDropdown({
  subjects,
  value,
  onValueChange,
  placeholder = "Search subjects...",
  label,
  disabled = false,
  className,
  emptyMessage = "No subjects found.",
  showCode = true,
  filterAssigned = false,
  assignedSubjects = []
}: SearchableSubjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter subjects based on search and assignment status
  const filteredSubjects = useMemo(() => {
    const filtered = subjects.filter(subject => {
      // Filter by search term
      const matchesSearch = subject.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                           (subject.code && subject.code.toLowerCase().includes(searchValue.toLowerCase()));
      
      // Filter by assignment status if needed
      const isAssigned = filterAssigned && assignedSubjects.includes(subject.id);
      
      return matchesSearch && (!filterAssigned || !isAssigned);
    });

    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, searchValue, filterAssigned, assignedSubjects]);

  // Get selected subject
  const selectedSubject = subjects.find(subject => subject.id === value);

  const handleSelect = (subjectId: string) => {
    onValueChange(subjectId === value ? '' : subjectId);
    setOpen(false);
    setSearchValue('');
  };

  const handleClear = () => {
    onValueChange('');
    setSearchValue('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-2", className)} ref={dropdownRef}>
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
            !selectedSubject && "text-muted-foreground"
          )}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedSubject 
                ? showCode && selectedSubject.code 
                  ? `${selectedSubject.name} (${selectedSubject.code})`
                  : selectedSubject.name
                : placeholder
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectedSubject && (
              <X 
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
        
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
            <div className="p-2 border-b border-border">
              <Input
                placeholder="Search subjects..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8 bg-background text-foreground border-border focus:ring-ring"
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredSubjects.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                <div className="p-1">
                  {filteredSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      onClick={() => handleSelect(subject.id)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        value === subject.id && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === subject.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{subject.name}</span>
                        {showCode && subject.code && (
                          <span className="text-xs text-muted-foreground">
                            Code: {subject.code}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
