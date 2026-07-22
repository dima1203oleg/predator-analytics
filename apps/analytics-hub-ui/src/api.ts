/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Підхоплюємо базовий URL з Vite ENV або використовуємо порожній рядок
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  
  // Add fallback to test-token for local development
  let token = localStorage.getItem('predator_token');
  if (!token && import.meta.env.MODE === 'development') {
    token = 'test-token';
  }
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // If unauthorized, clear token and emit event for UI to react
      localStorage.removeItem('predator_token');
      window.dispatchEvent(new Event('predator:logout'));
      throw new Error('Сесія закінчилась (401). Будь ласка, увійдіть знову.');
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const fetchGeoEntities = async () => {
  const response = await apiFetch('/api/v1/geo/entities');
  if (!response.ok) {
    throw new Error('Failed to fetch geo entities');
  }
  return response.json();
};

export const fetchEntityTimeline = async (entityId: string) => {
  const response = await apiFetch(`/api/v1/osint/entity/${entityId}/timeline`);
  if (!response.ok) {
    throw new Error('Failed to fetch entity timeline');
  }
  return response.json();
};
