# School Management System - Theme System

## Overview
The application now includes a comprehensive theme system with:
1. Dark/Light mode toggle
2. Customizable color schemes
3. Persistent settings using localStorage
4. System preference detection

## Features

### Dark/Light Mode
- Toggle between dark and light themes
- Automatically detects system preference on first visit
- Persists user preference in localStorage

### Color Schemes
Users can choose from 5 color schemes:
1. **Default (Indigo)** - The original color scheme
2. **Blue** - Professional blue tones
3. **Green** - Nature-inspired green palette
4. **Purple** - Creative purple theme
5. **Orange** - Energetic orange colors

### Persistence
All theme settings are saved to localStorage and restored on subsequent visits.

## Implementation

### Theme Context
The theme system is built using React Context API:
- `ThemeProvider` - Wraps the entire application
- `useTheme` - Hook to access theme state and functions

### CSS Variables
Color schemes are implemented using CSS variables that are updated when the user changes preferences.

### Components
1. **ThemeToggle** - Desktop theme controls in dropdown menu
2. **ThemeSwitcher** - Mobile theme controls in sheet
3. **ThemeContext** - Core theme logic and state management

## Usage

### Accessing Theme State
```javascript
import { useTheme } from '@/lib/theme/context';

const { theme, colorScheme, toggleTheme, setColorScheme } = useTheme();
```

### Theme Values
- `theme`: 'light' | 'dark'
- `colorScheme`: 'default' | 'blue' | 'green' | 'purple' | 'orange'

### Theme Functions
- `toggleTheme()`: Switch between light and dark mode
- `setColorScheme(scheme)`: Change color scheme

## Customization

### Adding New Color Schemes
1. Add new color variables to `globals.css`
2. Add new color scheme option to the colorSchemes array in components
3. Add CSS variable overrides for the new scheme

### Default Colors
The theme system uses OKLCH color values for better color consistency:
- Primary colors use the `oklch()` function
- All color schemes maintain consistent contrast ratios
- Dark mode colors are automatically adjusted for readability

## Files
- `src/lib/theme/context.tsx` - Theme context and provider
- `src/components/theme/theme-toggle.tsx` - Desktop theme controls
- `src/components/theme/theme-switcher.tsx` - Mobile theme controls
- `src/app/globals.css` - CSS variables and theme definitions
- `src/app/profile/page.tsx` - Theme controls in user profile
- `src/components/layout/header.tsx` - Theme controls in header