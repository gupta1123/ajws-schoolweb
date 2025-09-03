// src/components/theme/theme-toggle.tsx

'use client';

import { useTheme } from '@/lib/theme/context';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon
} from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}