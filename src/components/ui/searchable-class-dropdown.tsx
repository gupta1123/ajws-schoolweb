// src/components/ui/searchable-class-dropdown.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ClassDivision {
  id: string;
  division: string;
  class_level: {
    name: string;
    sequence_number: number;
  };
  academic_year: {
    year_name: string;
  };
}

interface SearchableClassDropdownProps {
  classes: ClassDivision[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  showAcademicYear?: boolean;
}

export function SearchableClassDropdown({
  classes,
  value,
  onValueChange,
  placeholder = "Search classes...",
  label,
  disabled = false,
  className,
  emptyMessage = "No classes found.",
  showAcademicYear = false
}: SearchableClassDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    const filtered = classes.filter(classDiv => {
      // Filter by search term - search in class level name, division, and academic year
      const searchLower = searchValue.toLowerCase();
      const matchesSearch = 
        classDiv.class_level.name.toLowerCase().includes(searchLower) ||
        classDiv.division.toLowerCase().includes(searchLower) ||
        (showAcademicYear && classDiv.academic_year.year_name.toLowerCase().includes(searchLower));
      
      return matchesSearch;
    });

    // Sort by sequence number, then by division
    return filtered.sort((a, b) => {
      if (a.class_level.sequence_number !== b.class_level.sequence_number) {
        return a.class_level.sequence_number - b.class_level.sequence_number;
      }
      return a.division.localeCompare(b.division);
    });
  }, [classes, searchValue, showAcademicYear]);

  // Get selected class
  const selectedClass = classes.find(classDiv => classDiv.id === value);

  const handleSelect = (classId: string) => {
    onValueChange(classId === value ? '' : classId);
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
            !selectedClass && "text-muted-foreground"
          )}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedClass 
                ? `${selectedClass.class_level.name} ${selectedClass.division}`
                : placeholder
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectedClass && (
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
                placeholder="Search classes..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8 bg-background text-foreground border-border focus:ring-ring"
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredClasses.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                <div className="p-1">
                  {filteredClasses.map((classDiv) => (
                    <div
                      key={classDiv.id}
                      onClick={() => handleSelect(classDiv.id)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        value === classDiv.id && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === classDiv.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {classDiv.class_level.name} {classDiv.division}
                        </span>
                        {showAcademicYear && (
                          <span className="text-xs text-muted-foreground">
                            {classDiv.academic_year.year_name}
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
