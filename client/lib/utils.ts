import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ClipboardEvent, KeyboardEvent, MouseEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Props for date inputs that must be picker-only: typing and pasting are
 * blocked, and clicking opens the native calendar
 */
export const dateInputPickerOnlyProps = {
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow focus navigation and form submission, block everything else
    // (digits, arrow keys, etc.) so dates can only come from the picker
    if (!["Tab", "Escape", "Enter"].includes(e.key)) {
      e.preventDefault();
    }
  },
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => e.preventDefault(),
  onClick: (e: MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // showPicker is unsupported in some browsers; the calendar icon still works
    }
  },
};

/**
 * Format currency (SBD - Solomon Islands Dollar)
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format date to local string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to short string
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate days between two dates
 */
export function calculateDays(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}
