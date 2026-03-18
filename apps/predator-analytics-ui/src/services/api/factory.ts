import { apiClient, v45Client } from './config';

/**
 * API клієнт для Фабрики Автоматизації та Knowledge Map.
 * Підключає ендпоінти з Factory Core Engine + Neural Training.
 */
export const factoryApi = {
  // ─── Knowledge Map ────────────────────────────────────────────────────────
  
  /** Отримати золоті патерни (score ≥ 92) */
  getGoldPatterns: async () => {
    const res = await apiClient.get('/factory/patterns/gold');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Отримати усі патерни */
  getPatterns: async () => {
    const res = await apiClient.get('/factory/patterns');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Отримати статистику Фабрики (total_runs, total_patterns, gold_patterns, avg_score) */
  getStats: async () => {
    return (await apiClient.get('/factory/stats')).data;
  },

  /** Інгестія результату пайплайну */
  ingest: async (payload: {
    run_id: string;
    component: string;
    metrics: Record<string, number>;
    changes: Record<string, unknown>;
    timestamp: string;
    branch?: string;
    commit_sha?: string;
  }) => {
    return (await apiClient.post('/factory/ingest', payload)).data;
  },

  // ─── Neural Training ──────────────────────────────────────────────────────

  /** Статус нейронного тренування (IDLE | TRAINING | COMPLETED) */
  getTrainingStatus: async () => {
    return (await apiClient.get('/neural/training/status')).data;
  },

  /** Статистика тренування — epoch, loss, accuracy, val_loss */
  getTrainingStats: async () => {
    const res = await apiClient.get('/neural/training/stats');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Запустити нейронне тренування */
  startTraining: async (model: string = 'Predator-v45-X-Core') => {
    return (await apiClient.post('/neural/training/start', { model })).data;
  },

  /** Зупинити нейронне тренування */
  stopTraining: async () => {
    return (await apiClient.post('/neural/training/stop')).data;
  },
};
