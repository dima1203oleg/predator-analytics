/**
 * Типи для модуля Antigravity AGI — автономного ядра розробки ПЗ.
 * Базується на ТЗ Google Antigravity Coder v1.0 (Enterprise MVP).
 *
 * Оркестратор координує 4 спеціалізованих агенти:
 *   - Архітектор (OpenHands SDK)
 *   - Хірург (Aider + Git)
 *   - QA Браузер (Browser-Use + Playwright)
 *   - QA DevTools (Chrome CDP)
 */

// ─── Агенти ──────────────────────────────────────────────────────────────────

/** Тип агента у AGI-оркестраторі */
export type AgentType = 'architect' | 'surgeon' | 'qa_browser' | 'qa_devtools';

/** Статус агента */
export interface AgentStatus {
  type: AgentType;
  /** Назва агента (повертається бекендом) */
  name: string;
  /** Чи виконує агент задачу */
  is_busy: boolean;
  /** ID поточної задачі */
  current_task_id?: string | null;
  /** Кількість завершених задач */
  tasks_completed: number;
}

// ─── Задачі ──────────────────────────────────────────────────────────────────

/** Пріоритет AGI-задачі */
export type AgentTaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Статус виконання задачі */
export type AgentTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'waiting_for_input'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Підзадача конкретного агента */
export interface AgentSubtask {
  id: string;
  agent_type: AgentType;
  description: string;
  status: AgentTaskStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

/** AGI-задача (відповідь ендпоїнту /antigravity/tasks/:id) */
export interface AgentTask {
  task_id: string;
  description: string;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  created_at: string;
  updated_at: string;
  /** Поточний крок або повідомлення про статус */
  progress?: string | null;
  /** Фактичні витрати на LLM API */
  spent_usd?: number | null;
  /** Ліміт витрат для цієї задачі */
  max_budget_usd?: number | null;
  /** Підзадачі агентів */
  subtasks?: AgentSubtask[];
}

/** Запит на створення нової AGI-задачі */
export interface CreateAgentTaskPayload {
  description: string;
  priority: AgentTaskPriority;
  /** Ліміт витрат у USD (необов'язково) */
  max_budget_usd?: number | null;
  /** Додатковий контекст */
  context?: Record<string, string>;
}

// ─── Оркестратор ─────────────────────────────────────────────────────────────

/** Статус LLM Gateway */
export type LlmGatewayStatus = 'online' | 'offline' | 'degraded';

/** Статус пісочниці */
export type SandboxStatus = 'online' | 'offline' | 'initializing';

/** Статус оркестратора AGI-системи */
export interface AntigravityOrchestratorStatus {
  /** Чи активний оркестратор */
  is_running: boolean;
  /** Кількість активних задач */
  active_tasks: number;
  /** Кількість завершених задач */
  completed_tasks: number;
  /** Кількість задач з помилками */
  failed_tasks: number;
  /** Загальні витрати на LLM API (USD) */
  total_spent_usd: number;
  /** Глобальний бюджетний ліміт (USD) */
  budget_limit_usd: number;
  /** Статус LiteLLM Gateway */
  llm_gateway_status: LlmGatewayStatus;
  /** Статус Kata Containers Sandbox */
  sandbox_status: SandboxStatus;
  /** Список агентів та їх стан */
  agents: AgentStatus[];
  /** Поточна LLM-модель */
  active_model?: string | null;
  /** Час останнього оновлення */
  last_update?: string | null;
}

// ─── Лог-записи ──────────────────────────────────────────────────────────────

/** Запис логу для конкретної задачі */
export interface AgentTaskLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  agent_type?: AgentType | null;
  message: string;
}

// ─── UI-нормалізовані типи ────────────────────────────────────────────────────

/** Нормалізована картка агента для UI */
export interface AgentCardSnapshot {
  type: AgentType;
  /** Локалізована назва агента */
  label: string;
  /** Технологія (OpenHands / Aider / Browser-Use / Chrome CDP) */
  technology: string;
  /** Функція агента */
  description: string;
  isBusy: boolean;
  currentTaskId?: string | null;
  tasksCompleted: number;
  /** Колір акценту для дизайн-системи */
  tone: 'amber' | 'emerald' | 'rose' | 'sky' | 'gold' | 'slate';
}

/** Нормалізований стан оркестратора для UI */
export interface AntigravitySnapshot {
  isRunning: boolean;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  budgetUsedPercent: number;
  spentLabel: string;
  limitLabel: string;
  llmStatus: LlmGatewayStatus;
  sandboxStatus: SandboxStatus;
  activeModel: string;
  lastUpdateLabel: string;
  agents: AgentCardSnapshot[];
}
