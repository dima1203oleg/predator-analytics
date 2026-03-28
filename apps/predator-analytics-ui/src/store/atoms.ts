import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Theme, Sale, ChatMessage } from '../types/index';

// Theme state
export const themeAtom = atomWithStorage<Theme>('predator-theme', 'dark');

// Sales data state
export const salesAtom = atom<Sale[]>([
  { id: '1', date: '2026-03-28', product: 'Термінал P-1', amount: 15400, status: 'оплачено' },
  { id: '2', date: '2026-03-28', product: 'Система Аналітики v4', amount: 89000, status: 'очікує' },
  { id: '3', date: '2026-03-27', product: 'Модуль Шифрування', amount: 4200, status: 'оплачено' },
  { id: '4', date: '2026-03-27', product: 'Датчик S-500', amount: 1250, status: 'очікує' },
  { id: '5', date: '2026-03-26', product: 'Процесор Ultra', amount: 75000, status: 'оплачено' },
]);

// Chat messages state
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const isTypingAtom = atom<boolean>(false);

// User state
export const userRoleAtom = atomWithStorage<'admin' | 'analyst' | 'operator' | 'viewer'>('predator-role', 'admin');

// UI state
export const isSidebarOpenAtom = atomWithStorage<boolean>('predator-sidebar-open', true);
export const sidebarSearchAtom = atom<string>('');
