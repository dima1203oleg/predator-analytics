/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Підхоплюємо базовий URL з Vite ENV або використовуємо порожній рядок
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  
  // Тимчасовий обхід авторизації для розробки (test-token).
  // TODO: Замінити на реальний токен після створення екрану логіну.
  const token = localStorage.getItem('predator_token') || 'test-token';
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};
