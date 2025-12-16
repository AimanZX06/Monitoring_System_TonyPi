import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export function formatBatteryLevel(level: number): string {
  return `${level.toFixed(1)}%`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
      return 'text-green-600 bg-green-100';
    case 'offline':
      return 'text-red-600 bg-red-100';
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getBatteryColor(level: number): string {
  if (level > 60) return 'text-green-600';
  if (level > 30) return 'text-yellow-600';
  return 'text-red-600';
}