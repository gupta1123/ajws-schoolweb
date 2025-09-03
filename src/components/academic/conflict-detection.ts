// src/components/academic/conflict-detection.ts

import type { AcademicYear, ClassLevel, ClassDivision } from '@/types/academic';

export interface Conflict {
  id: string;
  type: 'year_overlap' | 'duplicate_level' | 'duplicate_division';
  message: string;
  severity: 'warning' | 'error';
}

export function detectAcademicStructureConflicts(
  academicYears: AcademicYear[],
  classLevels: ClassLevel[],
  classDivisions: ClassDivision[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Check for overlapping academic years
  academicYears.forEach(year1 => {
    academicYears.forEach(year2 => {
      if (year1.id !== year2.id) {
        const start1 = new Date(year1.start_date);
        const end1 = new Date(year1.end_date);
        const start2 = new Date(year2.start_date);
        const end2 = new Date(year2.end_date);
        
        if ((start1 <= end2 && start2 <= end1)) {
          conflicts.push({
            id: `year_overlap_${year1.id}_${year2.id}`,
            type: 'year_overlap',
            message: `Academic years ${year1.year_name} and ${year2.year_name} have overlapping dates`,
            severity: 'error'
          });
        }
      }
    });
  });
  
  // Check for duplicate level names
  const levelNames = classLevels.map(level => level.name);
  const duplicateLevels = levelNames.filter((name, index) => levelNames.indexOf(name) !== index);
  if (duplicateLevels.length > 0) {
    conflicts.push({
      id: 'duplicate_level_names',
      type: 'duplicate_level',
      message: `Duplicate class level names: ${[...new Set(duplicateLevels)].join(', ')}`,
      severity: 'error'
    });
  }
  
  // Check for duplicate division names within same level
  classLevels.forEach(level => {
    const divisionsInLevel = classDivisions
      .filter(div => div.class_level_id === level.id)
      .map(div => div.division);
    const duplicateDivisions = divisionsInLevel.filter((name, index) => divisionsInLevel.indexOf(name) !== index);
    if (duplicateDivisions.length > 0) {
      conflicts.push({
        id: `duplicate_division_${level.id}`,
        type: 'duplicate_division',
        message: `Duplicate divisions in ${level.name}: ${[...new Set(duplicateDivisions)].join(', ')}`,
        severity: 'warning'
      });
    }
  });
  
  return conflicts;
}