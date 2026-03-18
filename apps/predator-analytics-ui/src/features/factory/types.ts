/**
 * Типи для Фабрики Автоматизації — Knowledge Map, Патерни, Тренування
 */

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

// ─── Pipeline / Ingest ──────────────────────────────────────────────────────

/** Метрики для інгестії */
export interface PipelineMetrics {
  coverage: number;
  pass_rate: number;
  performance: number;
  chaos_resilience: number;
  business_kpi: number;
}

/** Результат інгестії */
export interface IngestResult {
  status: 'accepted' | 'ignored' | 'created';
  pattern_hash?: string;
  score?: number;
  reason?: string;
  correlation_id?: string;
  error?: string;
}
