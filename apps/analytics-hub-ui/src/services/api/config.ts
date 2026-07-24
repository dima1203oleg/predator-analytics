/**
 * Централізована конфігурація API — єдине місце для визначення API_BASE_URL.
 * Усі компоненти мають імпортувати звідси, а не визначати свій fallback.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Простий API-клієнт з авторизацією
 */
export const apiClient = {
  get: async (path: string) => {
    const token = localStorage.getItem('predator_token') || '';
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    return res.json();
  },
  post: async (path: string, body?: unknown) => {
    const token = localStorage.getItem('predator_token') || '';
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  },
};

/**
 * v45Client — сумісність зі старим API
 */
export const v45Client = apiClient;
