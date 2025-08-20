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
