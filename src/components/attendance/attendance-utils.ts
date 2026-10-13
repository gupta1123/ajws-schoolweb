// src/components/attendance/attendance-utils.ts

import type { ClassAttendanceSummary } from '@/lib/api/attendance';

export type ClassStatus = 'marked' | 'pending' | 'holiday';

export const classStatus = (c: ClassAttendanceSummary): ClassStatus =>
  c.is_holiday ? 'holiday' : c.attendance_marked ? 'marked' : 'pending';

/** Nursery → LKG → UKG → Grade 1…10, then by section. */
const GRADE_RANK: Record<string, number> = { NUR: -3, LKG: -2, UKG: -1 };
export function gradeRank(className: string): number {
  const token = className.replace(/^grade\s+/i, '').split(/\s+/)[0]?.toUpperCase() ?? '';
  if (token in GRADE_RANK) return GRADE_RANK[token];
  const n = parseInt(token, 10);
  return Number.isNaN(n) ? 100 : n;
}
export const byGrade = (a: ClassAttendanceSummary, b: ClassAttendanceSummary) =>
  gradeRank(a.class_name) - gradeRank(b.class_name) || a.class_name.localeCompare(b.class_name);

/** Literal class names so Tailwind generates them. */
export function rateTone(pct: number): { text: string; bar: string } {
  if (pct >= 90) return { text: 'text-tone-success', bar: 'bg-tone-success' };
  if (pct >= 75) return { text: 'text-tone-warning', bar: 'bg-tone-warning' };
  return { text: 'text-tone-danger', bar: 'bg-tone-danger' };
}

export const detailHref = (c: ClassAttendanceSummary, date: string) =>
  `/admin/attendance/${c.class_division_id}?date=${date}&name=${encodeURIComponent(c.class_name)}`;
