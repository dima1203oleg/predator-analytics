import { describe, it, expect, vi } from 'vitest';

describe.sequential('useAppStore (persist) — безпечний storage', () => {
  it('не падає, якщо localStorage заблокований (setItem кидає помилку)', async () => {
    const originalLocalStorage = window.localStorage;

    const throwingLocalStorage: Storage = {
      get length() { return 0; },
      clear: () => { throw new Error('localStorage заблокований'); },
      getItem: () => { throw new Error('localStorage заблокований'); },
      key: () => null,
      removeItem: () => { throw new Error('localStorage заблокований'); },
      setItem: () => { throw new Error('localStorage заблокований'); },
    };

    Object.defineProperty(window, 'localStorage', {
      value: throwingLocalStorage,
      configurable: true,
    });

    try {
      vi.resetModules();
      const { useAppStore } = await import('../useAppStore');

      expect(() => {
        useAppStore.getState().setRole('client');
      }).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    }
  });

  it('не падає, якщо localStorage заблокований (getItem кидає помилку)', async () => {
    const originalLocalStorage = window.localStorage;

    const throwingLocalStorage: Storage = {
      get length() { return 0; },
      clear: () => { /* no-op */ },
      getItem: () => { throw new Error('localStorage заблокований'); },
      key: () => null,
      removeItem: () => { /* no-op */ },
      setItem: () => { /* no-op */ },
    };

    Object.defineProperty(window, 'localStorage', {
      value: throwingLocalStorage,
      configurable: true,
    });

    try {
      vi.resetModules();
      const { useAppStore } = await import('../useAppStore');

      expect(() => {
        // Достатньо торкнутись стану, щоб persist спробував прочитати storage
        void useAppStore.getState().userRole;
      }).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    }
  });
});
