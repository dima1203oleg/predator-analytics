import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Утиліта для злиття класів Tailwind CSS (застосовується у всіх Shadcn компонентах).
 * Вона вирішує конфлікти марджинів/паддінгів, замінюючи старі класи на нові.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
