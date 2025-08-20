// src/components/theme/theme-toggle.tsx

'use client';

import { useTheme, ColorScheme } from '@/lib/theme/context';
import { Button } from '@/components/ui/button';
import { 
  Sun, 
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();

  const colorSchemes = [
    { id: 'default', name: 'Default (Indigo)' },
    { id: 'blue', name: 'Blue' },
    { id: 'green', name: 'Green' },
    { id: 'purple', name: 'Purple' },
    { id: 'orange', name: 'Orange' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
        <DropdownMenuRadioGroup 
          value={colorScheme} 
          onValueChange={(value) => setColorScheme(value as ColorScheme)}
        >
          {colorSchemes.map((scheme) => (
            <DropdownMenuRadioItem key={scheme.id} value={scheme.id}>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  scheme.id === 'default' ? 'bg-indigo-600' :
                  scheme.id === 'blue' ? 'bg-blue-600' :
                  scheme.id === 'green' ? 'bg-green-600' :
                  scheme.id === 'purple' ? 'bg-purple-600' :
                  scheme.id === 'orange' ? 'bg-orange-600' : 'bg-indigo-600'
                }`} />
                {scheme.name}
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}