# Academic Structure Components

This directory contains UI components for managing the academic structure of the school.

## Components

### AcademicStructureManager
Main component for managing class levels, divisions, and academic years with a tabbed interface.

**Features:**
- Visual hierarchy view of the academic structure
- Tabbed interface for different management sections
- Conflict detection for overlapping dates and duplicates
- Responsive design for all screen sizes

### AcademicYearSetupWizard
Step-by-step wizard for setting up new academic years.

**Features:**
- 5-step setup process
- Template selection (blank, previous year, custom)
- Review and confirmation step
- Progress tracking

### AcademicStructureStats
Dashboard-style statistics cards for quick overview.

**Features:**
- Class levels count
- Class divisions count
- Academic years count
- Total students count

### ConflictDetection
Utility functions for detecting conflicts in academic structure.

**Features:**
- Overlapping academic year detection
- Duplicate class level names detection
- Duplicate division names within levels detection

## Usage

```tsx
import { AcademicStructureManager } from '@/components/academic';

export default function AcademicStructurePage() {
  return (
    <div>
      <AcademicStructureManager />
    </div>
  );
}
```

## Props

### AcademicStructureStats
| Prop | Type | Description |
|------|------|-------------|
| classLevels | number | Number of class levels |
| classDivisions | number | Number of class divisions |
| academicYears | number | Number of academic years |
| totalStudents | number | Total number of students |

## Styling

All components use Tailwind CSS classes and follow the shadcn/ui design system.