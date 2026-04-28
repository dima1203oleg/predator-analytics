import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * PREDATOR Analytics v61.0-ELITE
 * Утиліта для злиття класів Tailwind CSS.
 * Стандартпроекту: @/utils/cn
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
