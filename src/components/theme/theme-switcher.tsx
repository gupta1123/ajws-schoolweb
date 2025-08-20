// src/components/theme/theme-switcher.tsx

'use client';

import { useTheme } from '@/lib/theme/context';
import { Button } from '@/components/ui/button';
import { 
  Sun, 
  Moon,
  Palette
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function ThemeSwitcher() {
  const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();

  const colorSchemes = [
    { id: 'default', name: 'Default (Indigo)' },
    { id: 'blue', name: 'Blue' },
    { id: 'green', name: 'Green' },
    { id: 'purple', name: 'Purple' },
    { id: 'orange', name: 'Orange' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription>
            Customize the look and feel of the application
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </div>
            <Button variant="outline" onClick={toggleTheme} size="sm">
              Toggle
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Color Scheme</h3>
            <div className="grid grid-cols-1 gap-2">
              {colorSchemes.map((scheme) => (
                <Button
                  key={scheme.id}
                  variant={colorScheme === scheme.id ? 'default' : 'outline'}
                  className="flex items-center justify-start"
                  onClick={() => setColorScheme(scheme.id as 'default' | 'blue' | 'green' | 'purple' | 'orange')}
                >
                  <div className={`w-4 h-4 rounded-full mr-2 ${
                    scheme.id === 'default' ? 'bg-indigo-600' :
                    scheme.id === 'blue' ? 'bg-blue-600' :
                    scheme.id === 'green' ? 'bg-green-600' :
                    scheme.id === 'purple' ? 'bg-purple-600' :
                    scheme.id === 'orange' ? 'bg-orange-600' : 'bg-indigo-600'
                  }`} />
                  {scheme.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}