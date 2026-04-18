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

  // ─── Autonomous Improvement & Bug Fixing ──────────────────────────────────

  /** Отримати список виявлених багів */
  getBugs: async () => {
    const res = await apiClient.get('/factory/bugs');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Запустити виправлення бага */
  fixBug: async (bugId: string) => {
    return (await apiClient.post(`/factory/bugs/${bugId}/fix`)).data;
  },

  /** Отримати статус циклу вдосконалення */
  getInfiniteStatus: async () => {
    return (await apiClient.get('/factory/infinite/status')).data;
  },

  /** Запустити цикл вдосконалення на бекенді */
  startInfinite: async () => {
    return (await apiClient.post('/factory/infinite/start')).data;
  },

  /** Зупинити цикл вдосконалення на бекенді */
  stopInfinite: async () => {
    return (await apiClient.post('/factory/infinite/stop')).data;
  },

  /** Отримати останні логи вдосконалення */
  getLogs: async () => {
    return (await apiClient.get('/factory/logs')).data;
  },

  // ─── Antigravity AGI Orchestrator ─────────────────────────────────────────

  /** Отримати статус AGI-оркестратора (агенти, бюджет, LLM Gateway, Sandbox) */
  getAntigravityStatus: async () => {
    return (await apiClient.get('/antigravity/status')).data;
  },

  /** Отримати список AGI-задач */
  getAntigravityTasks: async () => {
    const res = await apiClient.get('/antigravity/tasks');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Створити нову AGI-задачу */
  createAntigravityTask: async (payload: {
    description: string;
    priority: string;
    max_budget_usd?: number | null;
    context?: Record<string, string>;
  }) => {
    return (await apiClient.post('/antigravity/tasks', payload)).data;
  },

  /** Отримати деталі конкретної AGI-задачі з підзадачами */
  getAntigravityTaskById: async (taskId: string) => {
    return (await apiClient.get(`/antigravity/tasks/${taskId}`)).data;
  },

  /** Скасувати AGI-задачу */
  cancelAntigravityTask: async (taskId: string) => {
    return (await apiClient.post(`/antigravity/tasks/${taskId}/cancel`)).data;
  },

  /** Отримати логи конкретної AGI-задачі */
  getAntigravityTaskLogs: async (taskId: string) => {
    const res = await apiClient.get(`/antigravity/tasks/${taskId}/logs`);
    return Array.isArray(res.data) ? res.data : [];
  },
};
