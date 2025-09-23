// src/components/ui/searchable-teacher-dropdown.tsx

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface Teacher {
  id?: string;
  teacher_id?: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  department?: string;
  designation?: string;
  is_active?: boolean;
}

interface SearchableTeacherDropdownProps {
  teachers: Teacher[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  showPhone?: boolean;
  showDepartment?: boolean;
}

export function SearchableTeacherDropdown({
  teachers,
  value,
  onValueChange,
  placeholder = "Search teachers...",
  label,
  disabled = false,
  className,
  emptyMessage = "No teachers found.",
  showPhone = true,
  showDepartment = false
}: SearchableTeacherDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    const filtered = teachers.filter(teacher => {
      // Filter by search term - search in name, phone, email, department
      const searchLower = searchValue.toLowerCase();
      const matchesSearch = 
        teacher.full_name.toLowerCase().includes(searchLower) ||
        (teacher.phone_number && teacher.phone_number.includes(searchLower)) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchLower)) ||
        (teacher.department && teacher.department.toLowerCase().includes(searchLower));
      
      return matchesSearch;
    });

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [teachers, searchValue]);

  // Get selected teacher
  const selectedTeacher = teachers.find(teacher => (teacher.id || teacher.teacher_id) === value);

  const handleSelect = (teacherId: string) => {
    onValueChange(teacherId === value ? '' : teacherId);
    setOpen(false);
    setSearchValue('');
  };

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 300; // Approximate height
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
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
          ref={buttonRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-base",
            !selectedTeacher && "text-muted-foreground"
          )}
          disabled={disabled}
          onClick={() => {
            calculateDropdownPosition();
            setOpen(!open);
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedTeacher ? (
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-xs">
                  {selectedTeacher.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate text-base">
              {selectedTeacher ? selectedTeacher.full_name : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectedTeacher && (
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
          <div className={cn(
            "absolute z-50 w-full min-w-[400px] bg-popover border border-border rounded-lg shadow-xl",
            dropdownPosition === 'top' ? "bottom-full mb-1" : "top-full mt-1"
          )}>
            <div className="p-3 border-b border-border">
              <Input
                placeholder="Search teachers..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-10 bg-background text-foreground border-border focus:ring-ring text-base"
                autoFocus
              />
            </div>
            
            <div className="max-h-72 overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                <div className="p-1">
                  {filteredTeachers.map((teacher, index) => {
                    const teacherId = teacher.id || teacher.teacher_id || '';
                    return (
                    <div
                      key={`${teacherId}-${index}`}
                      onClick={() => handleSelect(teacherId)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        value === teacherId && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-5 w-5 shrink-0 mt-0.5",
                          value === teacherId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-sm font-medium">
                          {teacher.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0 space-y-1">
                        <span className="font-medium text-base leading-tight break-words">{teacher.full_name}</span>
                        {(showPhone && teacher.phone_number) || (showDepartment && teacher.department) ? (
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {showPhone && teacher.phone_number && (
                              <span className="text-xs">{teacher.phone_number}</span>
                            )}
                            {showDepartment && teacher.department && (
                              <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full inline-block w-fit">
                                {teacher.department}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
