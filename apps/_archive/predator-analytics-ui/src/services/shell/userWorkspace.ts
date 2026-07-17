import type { UserWorkspaceState } from '@/types/shell';

export const NAV_FAVORITES_STORAGE_KEY = 'predator-nav-favorites';
export const NAV_RECENT_STORAGE_KEY = 'predator-nav-recent';

const readIds = (storageKey: string): string[] => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeIds = (storageKey: string, value: string[]): void => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Локальне сховище працює як best-effort і не блокує shell.
  }
};

export const loadUserWorkspace = (): UserWorkspaceState => ({
  favorites: readIds(NAV_FAVORITES_STORAGE_KEY),
  recent: readIds(NAV_RECENT_STORAGE_KEY),
});

export const saveUserWorkspace = (state: Partial<UserWorkspaceState>): void => {
  if (state.favorites) {
    writeIds(NAV_FAVORITES_STORAGE_KEY, state.favorites);
  }

  if (state.recent) {
    writeIds(NAV_RECENT_STORAGE_KEY, state.recent);
  }
};

export const toggleFavoriteId = (favorites: string[], itemId: string, limit: number = 10): string[] => {
  const next = favorites.includes(itemId)
    ? favorites.filter((currentId) => currentId !== itemId)
    : [itemId, ...favorites].slice(0, limit);

  saveUserWorkspace({ favorites: next });
  return next;
};

export const pushRecentId = (recent: string[], itemId: string, limit: number = 10): string[] => {
  const next = [itemId, ...recent.filter((currentId) => currentId !== itemId)].slice(0, limit);
  saveUserWorkspace({ recent: next });
  return next;
};

export const isShellV2Enabled = (): boolean => {
  const flag = import.meta.env.VITE_ENABLE_SHELL_V2;

  if (flag === 'true') {
    return true;
  }

  if (flag === 'false') {
    return false;
  }

  return !import.meta.env.PROD;
};
