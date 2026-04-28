/**
 * Типи для Фабрики Автоматизації — Knowledge Map, Патерни, Тренування
 * FABRYKA v2.0 – AUTONOMOUS CORE розширення
 */

// ─── FABRYKA v2.0 — Системний режим ─────────────────────────────────────────

/** режим роботи LLM оркестратора */
export type SystemMode = 'AUTONOMOUS' | 'API';

/** Правило авто-перемикання режиму */
export interface AutoSwitchRule {
  condition: string;
  switch_to: SystemMode | LlmTriStateMode;
  triggered: boolean;
}

/** Запис каскаду моделей: ollama → groq → gemini */
export type LlmActiveMode = 'API' | 'AUTONOMOUS' | 'OFFLINE';
export type LlmTriStateMode = 'SOVEREIGN' | 'HYBRID' | 'CLOUD';
export type LlmProvider = 'ollama' | 'groq' | 'gemini' | 'mistral' | 'azure' | 'zai';

export interface LlmCascadeEntry {
  id: string;
  name: string;
  provider: LlmProvider;
  role: 'lead_architect' | 'surgical_coder' | 'light_parser' | 'primary' | 'fallback_fast' | 'fallback_smart' | 'fallback_azure' | 'fallback_local';
  online: boolean;
  latency_ms: number | null;
  model_tag: string;
}

/** Поточний стан LLM режиму */
export interface LlmModeState {
  active: SystemMode;
  active_model: string;
  active_provider: LlmProvider;
  active_cascade_level: 1 | 2 | 3 | 4; // 1: Free, 2: Azure, 3: Local, 4: Hardware Fallback
  tri_state_mode: LlmTriStateMode;
  auto_switch_enabled: boolean;
  cascade: LlmCascadeEntry[];
  rules: AutoSwitchRule[];
}

// ─── VRAM Scheduler ──────────────────────────────────────────────────────────

/**  озподіл VRAM (GTX 1080, 8GB) */
export interface VramAllocation {
  llm_gb: number;
  rendering_gb: number;
  buffer_gb: number;
  total_gb: number;
}

/** Поточний стан VRAM */
export interface VramMetrics {
  used_percent: number;
  allocation: VramAllocation;
  warning: boolean;
  active_models: string[];
}

// ─── Fitness / KPI Engine ────────────────────────────────────────────────────

/** KPI метрики бекенду */
export interface BackendKpi {
  latency_p95_ms: number;
  latency_threshold_ms: number;
  error_rate_percent: number;
}

/** KPI метрики фронтенду */
export interface FrontendKpi {
  fps: number;
  memory_mb: number;
  memory_limit_mb: number;
}

/** KPI метрики LLM */
export interface LlmKpi {
  tokens_per_sec: number;
  baseline_tps: number;
  hallucination_score: number;
  hallucination_threshold: number;
}

/** KPI інфраструктури */
export interface InfraKpi {
  cpu_load_percent: number;
  vram_used_percent: number;
}

/** Зведені метрики Fitness Engine */
export interface FitnessMetrics {
  backend: BackendKpi;
  frontend: FrontendKpi;
  llm: LlmKpi;
  infra: InfraKpi;
  score: number;
  threshold: number;
  passed: boolean;
}

// ─── Risk Engine ─────────────────────────────────────────────────────────────

/**  івень ризику зміни */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Подія ризику */
export interface RiskEvent {
  id: string;
  commit_hash: string;
  level: RiskLevel;
  reason: string;
  action: 'auto_merge' | 'canary' | 'require_human';
  timestamp: string;
  resolved: boolean;
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

/** Прапорець функцій */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percent: number;
  storage: 'postgresql' | 'local';
}

// ─── Chaos Engineering ───────────────────────────────────────────────────────

/** Сценарій Chaos Engineering */
export type ChaosScenarioType = 'kill_pod' | 'network_delay' | 'memory_pressure' | 'gpu_overload' | 'gemini_429' | 'sandbox_crash';

export interface ChaosScenario {
  id: ChaosScenarioType;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  duration_sec: number;
}

export interface ChaosLogEntry {
  id: string;
  scenario: ChaosScenarioType;
  started_at: string;
  status: 'running' | 'completed' | 'failed';
  outcome: string;
}

// ─── EvolutionAgent ──────────────────────────────────────────────────────────

/** Трендрефективності компонента */
export interface EvolutionTrend {
  component: string;
  direction: 'improving' | 'degrading' | 'stable';
  delta_percent: number;
  last_checked: string;
}

/** Пропозиція рефакторингу */
export interface RefactorProposal {
  id: string;
  component: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

/** Стан EvolutionAgent */
export interface EvolutionAgentState {
  is_running: boolean;
  last_analysis: string | null;
  trends: EvolutionTrend[];
  proposals: RefactorProposal[];
  logs: string[];
}

// ─── Knowledge Map ──────────────────────────────────────────────────────────

/** Тип компонента для патернів */
export type ComponentType = 'web_ui' | 'backend' | 'api' | 'analytics' | 'core';

/** Тип патерну */
export type PatternType = 'performance' | 'stability' | 'ux' | 'security' | 'other';

/** Патерн зі Knowledge Map */
export interface KnowledgePattern {
  id?: string;
  hash: string;
  component: ComponentType;
  pattern_description: string;
  pattern_type: PatternType;
  score: number;
  gold: boolean;
  timestamp: string;
  tags: string[];
  source_run_id: string;
}

/** Статистика Factory Studio */
export interface FactoryStats {
  total_runs: number;
  total_patterns: number;
  gold_patterns: number;
  avg_score: number;
  last_run?: string;
}

// ─── Neural Training ────────────────────────────────────────────────────────

/** Статус нейронного тренування */
export interface NeuralTrainingStatus {
  status: 'IDLE' | 'TRAINING' | 'COMPLETED';
  progress: number;
  activeModel: string;
  startTime: string | null;
  logs: string[];
}

/** Точка даних епохи тренування (для графіків) */
export interface TrainingEpochData {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss: number;
}

// ─── FABRYKA v5.0 — Autonomous Swarm & Sandbox ──────────────────────────────

/**  оль агента у рої */
export type SwarmAgentRole = 'PLANNER' | 'CODER' | 'QA_BVR' | 'SECURITY_SENTRY' | 'OSINT_HARVESTER';

/** Статус агента */
export type SwarmAgentStatus = 'IDLE' | 'THINKING' | 'EXECUTING' | 'WAITING_FOR_UPSTREAM' | 'ERROR';

/** Агент у рої (Swarm Agent) */
export interface SwarmAgent {
  id: string;
  name: string;
  role: SwarmAgentRole;
  status: SwarmAgentStatus;
  active_task?: string;
  vram_usage_gb: number;
  last_activity: string;
}

/** Крок міркування (Reasoning Step) */
export interface ReasoningStep {
  id: string;
  agent_id: string;
  timestamp: string;
  thought: string; // Вміст <thinking>
  action?: string; // Що агент вирішив зробити
  confidence: number;
}

/** Сесія в пісочниці (E2B Sandbox) */
export interface SandboxSession {
  id: string;
  status: 'PROVISIONING' | 'ACTIVE' | 'TERMINATED' | 'CRASHED';
  runtime: 'python3.12' | 'nodejs20';
  logs: string[];
  vram_guard_active: boolean;
}

// ─── Pipeline / Ingest ──────────────────────────────────────────────────────

/** Метрики для інгестії */
export interface PipelineMetrics {
  coverage: number;
  pass_rate: number;
  performance: number;
  chaos_resilience: number;
  business_kpi: number;
}

/** результат інгестії */
export interface IngestResult {
  status: 'accepted' | 'ignored' | 'created';
  pattern_hash?: string;
  score?: number;
  reason?: string;
  correlation_id?: string;
  error?: string;
}
