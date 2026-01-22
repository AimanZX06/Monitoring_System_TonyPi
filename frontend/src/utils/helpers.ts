/**
 * =============================================================================
 * Helper Utilities - Common Formatting and Styling Functions
 * =============================================================================
 * 
 * This file contains utility functions used throughout the frontend application
 * for common tasks like CSS class merging, date formatting, and status colors.
 * 
 * FUNCTIONS:
 *   cn()               - Merge Tailwind CSS classes intelligently
 *   formatDate()       - Format Date objects to readable strings
 *   formatBatteryLevel() - Format battery percentage with precision
 *   getStatusColor()   - Get color classes for robot status
 *   getBatteryColor()  - Get color class based on battery level
 * 
 * TAILWIND CLASS MERGING:
 *   The cn() function combines clsx (conditional classes) with tailwind-merge
 *   to handle conflicting Tailwind classes correctly.
 *   
 *   Example: cn('bg-red-500', 'bg-blue-500') => 'bg-blue-500' (not both)
 */

// =============================================================================
// IMPORTS
// =============================================================================

// clsx - Conditionally construct className strings
// Allows arrays, objects, and conditional values
import { clsx, type ClassValue } from 'clsx';

// tailwind-merge - Merge Tailwind classes without conflicts
// Handles class precedence correctly (last class wins)
import { twMerge } from 'tailwind-merge';

// =============================================================================
// CSS CLASS UTILITIES
// =============================================================================

/**
 * Merge Tailwind CSS classes intelligently
 * 
 * Combines clsx for conditional class construction with tailwind-merge
 * to handle conflicting Tailwind utility classes correctly.
 * 
 * @param inputs - Any number of class values (strings, arrays, objects)
 * @returns Merged className string with conflicts resolved
 * 
 * @example
 * cn('px-2 py-1', 'p-4')                    // => 'p-4' (p-4 overrides px-2 py-1)
 * cn('text-red-500', condition && 'text-blue-500')  // => 'text-blue-500' if condition
 * cn(['flex', 'items-center'], { 'hidden': isHidden }) // Array + object syntax
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format a Date object or ISO string to a human-readable format
 * 
 * Uses the browser's locale for formatting, so dates appear in the
 * user's preferred format (e.g., "1/22/2026 10:30:00 AM" for en-US).
 * 
 * @param date - Date object or ISO date string
 * @returns Formatted date string with date and time
 * 
 * @example
 * formatDate(new Date())                    // => "1/22/2026 10:30:00 AM"
 * formatDate("2026-01-22T10:30:00.000Z")   // => "1/22/2026 10:30:00 AM"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

// =============================================================================
// BATTERY FORMATTING
// =============================================================================

/**
 * Format battery percentage with one decimal place
 * 
 * @param level - Battery percentage (0-100)
 * @returns Formatted string like "75.5%"
 * 
 * @example
 * formatBatteryLevel(75.567)  // => "75.6%"
 * formatBatteryLevel(100)     // => "100.0%"
 */
export function formatBatteryLevel(level: number): string {
  return `${level.toFixed(1)}%`;
}

// =============================================================================
// STATUS COLORS
// =============================================================================

/**
 * Get Tailwind CSS classes for robot status badges
 * 
 * Returns both text and background colors for status pills/badges.
 * 
 * @param status - Robot status string (online, offline, maintenance)
 * @returns Tailwind classes for text and background color
 * 
 * STATUS COLORS:
 *   online      - Green (robot connected and active)
 *   offline     - Red (robot not communicating)
 *   maintenance - Yellow (robot under maintenance)
 *   default     - Gray (unknown status)
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
      return 'text-green-600 bg-green-100';    // Green for active
    case 'offline':
      return 'text-red-600 bg-red-100';        // Red for disconnected
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-100';  // Yellow for maintenance
    default:
      return 'text-gray-600 bg-gray-100';      // Gray for unknown
  }
}

/**
 * Get Tailwind CSS color class based on battery level
 * 
 * Uses a traffic-light color scheme:
 *   - Green (>60%):  Healthy battery level
 *   - Yellow (31-60%): Getting low, should charge soon
 *   - Red (≤30%):    Critical, needs charging
 * 
 * @param level - Battery percentage (0-100)
 * @returns Tailwind text color class
 * 
 * @example
 * getBatteryColor(85)  // => "text-green-600"
 * getBatteryColor(45)  // => "text-yellow-600"
 * getBatteryColor(15)  // => "text-red-600"
 */
export function getBatteryColor(level: number): string {
  if (level > 60) return 'text-green-600';   // Healthy
  if (level > 30) return 'text-yellow-600';  // Warning
  return 'text-red-600';                     // Critical
}