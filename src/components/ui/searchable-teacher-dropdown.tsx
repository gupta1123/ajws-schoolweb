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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            !selectedTeacher && "text-muted-foreground"
          )}
          disabled={disabled}
          onClick={() => setOpen(!open)}
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
            <span className="truncate">
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
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
            <div className="p-2 border-b border-border">
              <Input
                placeholder="Search teachers..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8 bg-background text-foreground border-border focus:ring-ring"
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                <div className="p-1">
                  {filteredTeachers.map((teacher) => {
                    const teacherId = teacher.id || teacher.teacher_id || '';
                    return (
                    <div
                      key={teacherId}
                      onClick={() => handleSelect(teacherId)}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        value === teacherId && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === teacherId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-xs">
                          {teacher.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{teacher.full_name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {showPhone && teacher.phone_number && (
                            <span className="truncate">{teacher.phone_number}</span>
                          )}
                          {showDepartment && teacher.department && (
                            <span className="truncate">{teacher.department}</span>
                          )}
                        </div>
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
