import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely.
 * Supports conditional and dynamic class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
