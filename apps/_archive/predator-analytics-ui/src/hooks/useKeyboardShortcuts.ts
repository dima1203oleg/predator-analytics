/**
 * ⌨️ Keyboard Shortcuts Hook — глобальні гарячі клавіші PREDATOR
 */
import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ігноруємо якщо фокус в input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      for (const sc of shortcuts) {
        const keyMatch = e.key.toLowerCase() === sc.key.toLowerCase();
        const ctrlMatch = !!sc.ctrl === e.ctrlKey;
        const shiftMatch = !!sc.shift === e.shiftKey;
        const altMatch = !!sc.alt === e.altKey;
        const metaMatch = !!sc.meta === e.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (sc.preventDefault !== false) e.preventDefault();
          sc.handler(e);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Стандартні shortcuts для PREDATOR
export const defaultShortcuts = (
  navigate: (path: string) => void,
  toggleCopilot: () => void,
  toggleCommandPalette: () => void
): ShortcutConfig[] => [
  {
    key: 'k',
    meta: true,
    handler: () => toggleCommandPalette(),
    description: 'Відкрити командну палітру',
  },
  {
    key: '/',
    handler: () => navigate('/search?tab=global'),
    description: 'Перейти до пошуку',
  },
  {
    key: '1',
    meta: true,
    handler: () => navigate('/command?tab=board'),
    description: 'Командний центр',
  },
  {
    key: '2',
    meta: true,
    handler: () => navigate('/market?tab=overview'),
    description: 'Торгова розвідка',
  },
  {
    key: '3',
    meta: true,
    handler: () => navigate('/osint?tab=graph'),
    description: 'OSINT Hub',
  },
  {
    key: '4',
    meta: true,
    handler: () => navigate('/alerts'),
    description: 'Центр сповіщень',
  },
  {
    key: 'a',
    meta: true,
    handler: () => toggleCopilot(),
    description: 'Відкрити AI Copilot',
  },
  {
    key: '?',
    shift: true,
    handler: () => {
      // Показати help — можна реалізувати через toast
      window.dispatchEvent(new CustomEvent('predator-show-shortcuts'));
    },
    description: 'Показати гарячі клавіші',
    preventDefault: false,
  },
  {
    key: 'Escape',
    handler: () => {
      window.dispatchEvent(new CustomEvent('predator-escape'));
    },
    description: 'Закрити панелі / модальні вікна',
    preventDefault: false,
  },
];
