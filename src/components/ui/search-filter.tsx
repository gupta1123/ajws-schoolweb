// src/components/ui/search-filter.tsx

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter,
  X
} from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, string | boolean | string[]>) => void;
  placeholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'checkbox' | 'date';
    options?: Array<{ value: string; label: string }>;
  }>;
  className?: string;
}

export function SearchFilter({
  onSearch,
  onFilter,
  placeholder = 'Search...',
  filters = [],
  className,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | boolean | string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: string, value: string | boolean | string[]) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (key: string, date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      handleFilterChange(key, formattedDate);
    } else {
      handleFilterChange(key, '');
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    if (onFilter) {
      onFilter({});
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  // Convert string date to Date object for DatePicker
  const getDateValue = (key: string): Date | undefined => {
    const value = activeFilters[key];
    if (typeof value === 'string' && value) {
      return new Date(value);
    }
    return undefined;
  };

  return (
    <div className={className}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
        {filters.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
            )}
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium">{filter.label}</label>
                {filter.type === 'select' && filter.options && (
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm dark:bg-background dark:border-gray-700"
                    value={typeof activeFilters[filter.key] === 'string' ? activeFilters[filter.key] as string : ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={filter.key}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                      checked={!!activeFilters[filter.key]}
                      onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                    />
                    <label htmlFor={filter.key} className="text-sm">
                      {filter.label}
                    </label>
                  </div>
                )}
                
                {filter.type === 'date' && (
                  <DatePicker 
                    date={getDateValue(filter.key)} 
                    onDateChange={(date) => handleDateFilterChange(filter.key, date)} 
                    placeholder="Pick a date"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}