import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to "21 Aug '25" format
 */
export function formatDate(date: string | Date | number): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear().toString().slice(-2);

  return `${day} ${month} '${year}`;
}

/**
 * Formats a date and time to "21 Aug '25, 14:30" format
 */
export function formatDateTime(date: string | Date | number): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const formattedDate = formatDate(dateObj);
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${formattedDate}, ${time}`;
}

const HOMEWORK_NO_DUE_DATE_VISIBLE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isHomeworkVisibleByExpiry(homework: {
  due_date?: string | null;
  created_at?: string | null;
}): boolean {
  if (homework.due_date) {
    return true;
  }

  if (!homework.created_at) {
    return true;
  }

  const createdAt = new Date(homework.created_at);
  if (isNaN(createdAt.getTime())) {
    return true;
  }

  return Date.now() < createdAt.getTime() + HOMEWORK_NO_DUE_DATE_VISIBLE_DAYS * MS_PER_DAY;
}

/**
 * Mirrors the homework API's canonical ordering: newest creation first, then
 * latest due date when creation timestamps are equal.
 */
export function sortHomeworkLatestFirst<T extends {
  created_at?: string | null;
  due_date?: string | null;
}>(items: T[]): T[] {
  const timestamp = (value?: string | null) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return [...items].sort((a, b) => {
    const createdDifference = timestamp(b.created_at) - timestamp(a.created_at);
    if (createdDifference !== 0) return createdDifference;
    return timestamp(b.due_date) - timestamp(a.due_date);
  });
}

export function isDateOnLocalDay(value: string | Date, day: Date): boolean {
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) return false;

  return candidate.getFullYear() === day.getFullYear()
    && candidate.getMonth() === day.getMonth()
    && candidate.getDate() === day.getDate();
}
