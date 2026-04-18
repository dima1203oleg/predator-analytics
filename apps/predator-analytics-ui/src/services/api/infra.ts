import { apiClient } from './config';

/**
 * API клієнт для моніторингу інфраструктури.
 * Підключає ендпоінти /system/infrastructure та /system/engines,
 * які раніше існували в mock-api, але не були підключені до UI.
 */
export const infraApi = {
  /** Статус вузлів (NVIDIA, MacBook, Colab) та їх ресурси */
  getNodes: async () => {
    return (await apiClient.get('/system/nodes')).data;
  },

  /** Статус усіх компонентів інфраструктури (PostgreSQL, OpenSearch, Qdrant, ...) */
  getInfrastructure: async () => {
    return (await apiClient.get('/system/infrastructure')).data;
  },

  /** AI двигуни (моделі, версії, статус) */
  getEngines: async () => {
    const res = await apiClient.get('/system/engines');
    return Array.isArray(res.data) ? res.data : (res.data?.engines ?? []);
  },

  /** Загальний статус системи */
  getSystemStatus: async () => {
    return (await apiClient.get('/system/status')).data;
  },

  /** Потік системних логів */
  getSystemLogs: async (limit: number = 50) => {
    const res = await apiClient.get(`/system/logs/stream?limit=${limit}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Прогнози (з premium) — ще не підключені */
  getPredictions: async () => {
    const res = await apiClient.get('/premium/predictions');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Прогноз цін товарів (з premium) — ще не підключений */
  getCommodityForecast: async () => {
    const res = await apiClient.get('/premium/commodity-forecast');
    return Array.isArray(res.data) ? res.data : [];
  },
};
