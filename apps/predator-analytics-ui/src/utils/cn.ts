import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * PREDATOR Analytics v57.2-WRAITH
 * Утиліта для злиття класів Tailwind CSS.
 * Стандарт проекту: @/utils/cn
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
