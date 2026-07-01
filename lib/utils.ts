import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class strings with conflict resolution.
 * Standard shadcn/ui helper — later `cn(...)` conflicts win.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
