/**
 * Утиліти нормалізації даних для модуля Antigravity AGI.
 * Перетворюють сирі відповіді API на типізовані UI-снепшоти.
 */

import type {
  AgentCardSnapshot,
  AgentStatus,
  AgentSubtask,
  AgentTask,
  AgentTaskLog,
  AgentTaskPriority,
  AgentTaskStatus,
  AgentType,
  AntigravityOrchestratorStatus,
  AntigravitySnapshot,
  LlmGatewayStatus,
  SandboxStatus,
} from './antigravityView.types';

// ─── Словники локалізації ─────────────────────────────────────────────────────

/** Українські назви агентів */
const AGENT_LABELS: Record<AgentType, string> = {
  architect: 'Агент-Архітектор',
  surgeon: 'Агент-Хірург',
  qa_browser: 'QA Браузер',
  qa_devtools: 'QA DevTools',
};

/** Технологія кожного агента */
const AGENT_TECHNOLOGIES: Record<AgentType, string> = {
  architect: 'OpenHands SDK',
  surgeon: 'Aider + Git',
  qa_browser: 'Browser-Use + Playwright',
  qa_devtools: 'Chrome CDP Protocol',
};

/** Опис функції кожного агента */
const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  architect: 'Генерує структуру проєкту, декомпозує задачі на підзадачі, проєктує архітектуру',
  surgeon: 'Виконує рефакторинг коду, авто-коміти у Git, AST-аналіз патчів',
  qa_browser: 'Браузерна автоматизація, LLM-керування, скріншоти та кліки',
  qa_devtools: 'Доступ до консолі, мережевого трафіку та performance trace',
};

/** Колір акценту для кожного агента */
const AGENT_TONES: Record<AgentType, AgentCardSnapshot['tone']> = {
  architect: 'gold',
  surgeon: 'amber',
  qa_browser: 'emerald',
  qa_devtools: 'sky',
};

/** Локалізації статусу задачі */
const TASK_STATUS_LABELS: Record<AgentTaskStatus, string> = {
  pending: 'В черзі',
  in_progress: 'Виконується',
  waiting_for_input: 'Очікує введення',
  completed: 'Завершено',
  failed: 'Помилка',
  cancelled: 'Скасовано',
};

/** Локалізації пріоритету */
const TASK_PRIORITY_LABELS: Record<AgentTaskPriority, string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
  critical: 'Критичний',
};

/** Локалізації статусу LLM Gateway */
const LLM_STATUS_LABELS: Record<LlmGatewayStatus, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  degraded: 'Деградація',
};

/** Локалізації статусу Sandbox */
const SANDBOX_STATUS_LABELS: Record<SandboxStatus, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  initializing: 'Ініціалізація',
};

// ─── Допоміжні функції ────────────────────────────────────────────────────────

/** Повертає українську назву агента */
export function getAgentLabel(type: AgentType): string {
  return AGENT_LABELS[type] ?? type;
}

/** Повертає технологію агента */
export function getAgentTechnology(type: AgentType): string {
  return AGENT_TECHNOLOGIES[type] ?? '—';
}

/** Колір тону для UI залежно від статусу задачі */
export function getStatusTone(
  status: AgentTaskStatus,
): 'amber' | 'emerald' | 'rose' | 'slate' {
  switch (status) {
    case 'in_progress':
    case 'waiting_for_input':
      return 'amber';
    case 'completed':
      return 'emerald';
    case 'failed':
      return 'rose';
    default:
      return 'slate';
  }
}

/** Форматує витрати USD */
export function formatSpentUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value === 0) return 'FREE';
  return `$${value.toFixed(2)}`;
}


/** Локалізована мітка статусу задачі */
export function getTaskStatusLabel(status: AgentTaskStatus): string {
  return TASK_STATUS_LABELS[status] ?? status;
}

/** Локалізована мітка пріоритету */
export function getTaskPriorityLabel(priority: AgentTaskPriority): string {
  return TASK_PRIORITY_LABELS[priority] ?? priority;
}

/** Локалізована мітка статусу LLM */
export function getLlmStatusLabel(status: LlmGatewayStatus): string {
  return LLM_STATUS_LABELS[status] ?? status;
}

/** Локалізована мітка статусу Sandbox */
export function getSandboxStatusLabel(status: SandboxStatus): string {
  return SANDBOX_STATUS_LABELS[status] ?? status;
}

// ─── Нормалізація оркестратора ────────────────────────────────────────────────

/** Безпечно парсить AgentType */
function parseAgentType(raw: unknown): AgentType {
  const valid: AgentType[] = ['architect', 'surgeon', 'qa_browser', 'qa_devtools'];
  return valid.includes(raw as AgentType) ? (raw as AgentType) : 'architect';
}

/** Нормалізує один AgentStatus */
function normalizeAgentStatus(raw: unknown): AgentStatus {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    type: parseAgentType(r['type']),
    name: typeof r['name'] === 'string' ? r['name'] : getAgentLabel(parseAgentType(r['type'])),
    is_busy: Boolean(r['is_busy']),
    current_task_id: typeof r['current_task_id'] === 'string' ? r['current_task_id'] : null,
    tasks_completed: Number.isFinite(Number(r['tasks_completed'])) ? Number(r['tasks_completed']) : 0,
  };
}

/** Нормалізує статус оркестратора з сирих даних API */
export function normalizeOrchestratorStatus(
  raw: unknown,
): AntigravityOrchestratorStatus {
  if (!raw || typeof raw !== 'object') {
    return createEmptyOrchestratorStatus();
  }

  const r = raw as Record<string, unknown>;

  // Агенти — або з API, або дефолтний список усіх 4-х типів
  const rawAgents = Array.isArray(r['agents']) ? r['agents'] : [];
  const agents: AgentStatus[] =
    rawAgents.length > 0
      ? rawAgents.map(normalizeAgentStatus)
      : (['architect', 'surgeon', 'qa_browser', 'qa_devtools'] as AgentType[]).map((type) => ({
          type,
          name: getAgentLabel(type),
          is_busy: false,
          current_task_id: null,
          tasks_completed: 0,
        }));

  return {
    is_running: Boolean(r['is_running']),
    active_tasks: Number.isFinite(Number(r['active_tasks'])) ? Number(r['active_tasks']) : 0,
    completed_tasks: Number.isFinite(Number(r['completed_tasks'])) ? Number(r['completed_tasks']) : 0,
    failed_tasks: Number.isFinite(Number(r['failed_tasks'])) ? Number(r['failed_tasks']) : 0,
    total_spent_usd: Number.isFinite(Number(r['total_spent_usd'])) ? Number(r['total_spent_usd']) : 0,
    budget_limit_usd: Number.isFinite(Number(r['budget_limit_usd'])) ? Number(r['budget_limit_usd']) : 100,
    llm_gateway_status: (['online', 'offline', 'degraded'].includes(r['llm_gateway_status'] as string)
      ? r['llm_gateway_status']
      : 'offline') as LlmGatewayStatus,
    sandbox_status: (['online', 'offline', 'initializing'].includes(r['sandbox_status'] as string)
      ? r['sandbox_status']
      : 'offline') as SandboxStatus,
    agents,
    active_model: typeof r['active_model'] === 'string' ? r['active_model'] : null,
    last_update: typeof r['last_update'] === 'string' ? r['last_update'] : null,
  };
}

/** Порожній статус оркестратора */
export function createEmptyOrchestratorStatus(): AntigravityOrchestratorStatus {
  return {
    is_running: false,
    active_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    total_spent_usd: 0,
    budget_limit_usd: 100,
    llm_gateway_status: 'offline',
    sandbox_status: 'offline',
    agents: (['architect', 'surgeon', 'qa_browser', 'qa_devtools'] as AgentType[]).map((type) => ({
      type,
      name: getAgentLabel(type),
      is_busy: false,
      current_task_id: null,
      tasks_completed: 0,
    })),
    active_model: null,
    last_update: null,
  };
}

// ─── Нормалізація задач ───────────────────────────────────────────────────────
const validStatuses: AgentTaskStatus[] = [
  'pending', 'in_progress', 'waiting_for_input', 'completed', 'failed', 'cancelled',
];
const validPriorities: AgentTaskPriority[] = ['low', 'medium', 'high', 'critical'];

/** Нормалізує одну підзадачу */
function normalizeSubtask(raw: unknown): AgentSubtask {
  const r = (raw ?? {}) as Record<string, unknown>;
    const rawStatus = r['status'] as string;
    const finalStatus = rawStatus === 'running' ? 'in_progress' : rawStatus;

    return {
      id: typeof r['id'] === 'string' ? r['id'] : String(Math.random()),
      agent_type: parseAgentType(r['agent_type']),
      description: typeof r['description'] === 'string' ? r['description'] : '—',
      status: validStatuses.includes(finalStatus as AgentTaskStatus)
        ? (finalStatus as AgentTaskStatus)
        : 'pending',
      started_at: typeof r['started_at'] === 'string' ? r['started_at'] : null,
      completed_at: typeof r['completed_at'] === 'string' ? r['completed_at'] : null,
    };
}

/** Нормалізує одну AGI-задачу */
function normalizeTask(raw: unknown): AgentTask {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawStatus = r['status'] as string;
  const finalStatus = rawStatus === 'running' ? 'in_progress' : rawStatus;

  let progressLabel: string | null = null;
  if (typeof r['progress'] === 'string') {
    progressLabel = r['progress'];
  } else if (typeof r['progress'] === 'number') {
    progressLabel = `${r['progress']}%`;
  }

  return {
    task_id: typeof r['task_id'] === 'string' ? r['task_id'] : String(Math.random()),
    description: typeof r['description'] === 'string' ? r['description'] : '—',
    status: validStatuses.includes(finalStatus as AgentTaskStatus)
      ? (finalStatus as AgentTaskStatus)
      : 'pending',
    priority: validPriorities.includes(r['priority'] as AgentTaskPriority)
      ? (r['priority'] as AgentTaskPriority)
      : 'medium',
    created_at: typeof r['created_at'] === 'string' ? r['created_at'] : new Date().toISOString(),
    updated_at: typeof r['updated_at'] === 'string' ? r['updated_at'] : new Date().toISOString(),
    progress: progressLabel,
    spent_usd: Number.isFinite(Number(r['spent_usd'])) ? Number(r['spent_usd']) : null,
    max_budget_usd: Number.isFinite(Number(r['max_budget_usd'])) ? Number(r['max_budget_usd']) : null,
    subtasks: Array.isArray(r['subtasks']) ? r['subtasks'].map(normalizeSubtask) : [],
  };
}

/** Нормалізує масив AGI-задач */
export function normalizeTaskList(raw: unknown): AgentTask[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTask);
}

// ─── Нормалізація логів ───────────────────────────────────────────────────────

/** Нормалізує масив логів задачі */
export function normalizeTaskLogs(raw: unknown): AgentTaskLog[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const validLevels = ['info', 'warn', 'error', 'debug'] as const;
    return {
      id: typeof r['id'] === 'string' ? r['id'] : `log-${idx}`,
      timestamp: typeof r['timestamp'] === 'string' ? r['timestamp'] : new Date().toISOString(),
      level: validLevels.includes(r['level'] as typeof validLevels[number])
        ? (r['level'] as AgentTaskLog['level'])
        : 'info',
      agent_type: ['architect', 'surgeon', 'qa_browser', 'qa_devtools'].includes(r['agent_type'] as string)
        ? (r['agent_type'] as AgentType)
        : null,
      message: typeof r['message'] === 'string' ? r['message'] : '—',
    };
  });
}

// ─── Нормалізація UI-снепшоту ─────────────────────────────────────────────────

/** Будує UI-снепшот оркестратора для рендерингу */
export function buildAntigravitySnapshot(
  status: AntigravityOrchestratorStatus,
): AntigravitySnapshot {
  const used = status.total_spent_usd;
  const limit = status.budget_limit_usd > 0 ? status.budget_limit_usd : 100;
  const budgetPercent = Math.min(100, Math.round((used / limit) * 100));

  const lastUpdateLabel = status.last_update
    ? new Date(status.last_update).toLocaleString('uk-UA')
    : 'Не синхронізовано';

  const agents: AgentCardSnapshot[] = status.agents.map((a) => ({
    type: a.type,
    label: getAgentLabel(a.type),
    technology: getAgentTechnology(a.type),
    description: AGENT_DESCRIPTIONS[a.type] ?? '—',
    isBusy: a.is_busy,
    currentTaskId: a.current_task_id,
    tasksCompleted: a.tasks_completed,
    tone: AGENT_TONES[a.type] ?? 'slate',
  }));

  return {
    isRunning: status.is_running,
    activeTasks: status.active_tasks,
    completedTasks: status.completed_tasks,
    failedTasks: status.failed_tasks,
    budgetUsedPercent: budgetPercent,
    spentLabel: formatSpentUsd(used),
    limitLabel: formatSpentUsd(limit),
    llmStatus: status.llm_gateway_status,
    sandboxStatus: status.sandbox_status,
    activeModel: status.active_model ?? 'Gemini 2.0 Flash (Free)',

    lastUpdateLabel,
    agents,
  };
}
