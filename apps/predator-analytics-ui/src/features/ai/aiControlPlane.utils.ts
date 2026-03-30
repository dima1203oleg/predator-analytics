import type { EngineInfo } from '@/services/api/dashboard';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';

type UnknownRecord = Record<string, unknown>;

export type AIControlTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

export interface AIControlMetricCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: AIControlTone;
}

export interface AIControlEngineRecord {
  id: string;
  title: string;
  keyLabel: string;
  statusLabel: string;
  scoreLabel: string;
  trendLabel: string;
  throughputLabel: string;
  latencyLabel: string;
  loadLabel: string;
  detailLabel: string;
  tone: AIControlTone;
}

export interface AIControlLogRecord {
  id: string;
  timestampLabel: string;
  serviceLabel: string;
  levelLabel: string;
  message: string;
  tone: AIControlTone;
}

export interface AIControlSnapshot {
  activeCount: number;
  degradedCount: number;
  offlineCount: number;
  lastUpdatedLabel: string | null;
  metrics: AIControlMetricCard[];
  engines: AIControlEngineRecord[];
  logs: AIControlLogRecord[];
  hasAnyData: boolean;
}

const ENGINE_LABELS: Record<string, string> = {
  neural_behavioral: 'Поведінкове ядро',
  behavioral: 'Поведінкове ядро',
  institutional_core: 'Інституційне ядро',
  institutional: 'Інституційне ядро',
  influence_mapping: 'Мапування впливу',
  influence: 'Мапування впливу',
  structural_vault: 'Структурний рушій',
  structural: 'Структурний рушій',
  predictive_matrix: 'Прогностична матриця',
  predictive: 'Прогностична матриця',
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const formatCount = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatPercent = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatLatency = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} мс`;

const formatPair = (left?: number | null, right?: number | null): string =>
  left == null || right == null || !Number.isFinite(left) || !Number.isFinite(right)
    ? 'Н/д'
    : `${Math.round(left).toLocaleString('uk-UA')} / ${Math.round(right).toLocaleString('uk-UA')}`;

const formatDateTime = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeLevel = (value: string | null): { label: string; tone: AIControlTone } => {
  const normalized = value?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'error':
    case 'failed':
    case 'critical':
      return { label: 'ПОМИЛКА', tone: 'rose' };
    case 'warn':
    case 'warning':
      return { label: 'УВАГА', tone: 'amber' };
    case 'ok':
    case 'success':
      return { label: 'НОРМА', tone: 'emerald' };
    default:
      return { label: 'ІНФО', tone: 'sky' };
  }
};

const normalizeEngineStatus = (value: string | null): { label: string; tone: AIControlTone; bucket: 'active' | 'degraded' | 'offline' } => {
  const normalized = value?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'optimal':
    case 'active':
    case 'healthy':
      return { label: 'Оптимально', tone: 'emerald', bucket: 'active' };
    case 'calibrating':
    case 'degraded':
      return { label: 'Калібрування', tone: 'amber', bucket: 'degraded' };
    case 'offline':
    case 'failed':
    case 'error':
      return { label: 'Недоступний', tone: 'rose', bucket: 'offline' };
    default:
      return { label: 'Н/д', tone: 'slate', bucket: 'offline' };
  }
};

const normalizeEngineEntries = (value: unknown): Array<{ key: string; engine: EngineInfo | UnknownRecord }> => {
  if (Array.isArray(value)) {
    return value
      .filter(isRecord)
      .map((engine, index) => ({
        key: readString(engine.id) ?? `engine-${index + 1}`,
        engine,
      }));
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, engine]) => isRecord(engine))
      .map(([key, engine]) => ({
        key,
        engine,
      }));
  }

  return [];
};

const buildEngineRecord = (
  key: string,
  engine: EngineInfo | UnknownRecord,
  index: number,
): AIControlEngineRecord => {
  const statusMeta = normalizeEngineStatus(readString(engine.status));
  const score = readNumber(engine.score);
  const throughput = readNumber(engine.throughput);
  const latency = readNumber(engine.latency);
  const load = readNumber(engine.load);
  const trend = readString(engine.trend);
  const engineId = readString(engine.id) ?? key;
  const title = ENGINE_LABELS[key] ?? ENGINE_LABELS[engineId] ?? `Рушій ${index + 1}`;

  return {
    id: engineId,
    title,
    keyLabel: key,
    statusLabel: statusMeta.label,
    scoreLabel: formatPercent(score),
    trendLabel: trend ?? 'Н/д',
    throughputLabel: formatCount(throughput),
    latencyLabel: formatLatency(latency),
    loadLabel: formatPercent(load),
    detailLabel:
      score != null || throughput != null || latency != null || load != null
        ? 'Картка показує лише поля, які реально повернув `/system/engines`.'
        : 'Контракт `/system/engines` не повернув телеметрію для цього рушія.',
    tone: statusMeta.tone,
  };
};

const buildLogRecords = (value: unknown): AIControlLogRecord[] => {
  const entries = Array.isArray(value)
    ? value
    : isRecord(value)
      ? (
          (Array.isArray(value.logs) ? value.logs : null) ??
          (Array.isArray(value.items) ? value.items : null) ??
          []
        )
      : [];

  return entries
    .filter(isRecord)
    .map((entry, index) => {
      const levelMeta = normalizeLevel(readString(entry.level));
      return {
        id: readString(entry.id) ?? `log-${index + 1}`,
        timestampLabel: formatDateTime(readString(entry.timestamp)) ?? 'Н/д',
        serviceLabel: readString(entry.service) ?? 'Система',
        levelLabel: levelMeta.label,
        message: readString(entry.message) ?? 'Немає тексту повідомлення',
        tone: levelMeta.tone,
      };
    })
    .filter((entry) => entry.message !== 'Немає тексту повідомлення')
    .slice(0, 40);
};

const readLatestLogTimestamp = (value: unknown): string | null => {
  const entries = Array.isArray(value)
    ? value
    : isRecord(value)
      ? (
          (Array.isArray(value.logs) ? value.logs : null) ??
          (Array.isArray(value.items) ? value.items : null) ??
          []
        )
      : [];

  for (const entry of entries) {
    if (isRecord(entry)) {
      const timestamp = readString(entry.timestamp);
      if (timestamp) {
        return timestamp;
      }
    }
  }

  return null;
};

export const normalizeAIControlPlaneSnapshot = (
  enginesPayload: unknown,
  systemStatus: SystemStatusResponse | null,
  systemStats: SystemStatsResponse | null,
  logsPayload: unknown,
): AIControlSnapshot => {
  const engineEntries = normalizeEngineEntries(enginesPayload);
  const engines = engineEntries.map(({ key, engine }, index) => buildEngineRecord(key, engine, index));
  const logs = buildLogRecords(logsPayload);

  const activeCount = engineEntries.filter(({ engine }) => normalizeEngineStatus(readString(engine.status)).bucket === 'active').length;
  const degradedCount = engineEntries.filter(({ engine }) => normalizeEngineStatus(readString(engine.status)).bucket === 'degraded').length;
  const offlineCount = engineEntries.filter(({ engine }) => normalizeEngineStatus(readString(engine.status)).bucket === 'offline').length;

  const scores = engineEntries
    .map(({ engine }) => readNumber(engine.score))
    .filter((value): value is number => value != null);
  const latencies = engineEntries
    .map(({ engine }) => readNumber(engine.latency))
    .filter((value): value is number => value != null);
  const throughputTotal = engineEntries
    .map(({ engine }) => readNumber(engine.throughput) ?? 0)
    .reduce((sum, value) => sum + value, 0);

  const averageScore = scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
  const averageLatency = systemStats?.avg_latency ?? (latencies.length > 0 ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null);
  const latestLogTimestamp = readLatestLogTimestamp(logsPayload);

  const lastUpdatedLabel =
    formatDateTime(systemStats?.timestamp) ??
    formatDateTime(systemStatus?.timestamp) ??
    formatDateTime(latestLogTimestamp);

  return {
    activeCount,
    degradedCount,
    offlineCount,
    lastUpdatedLabel,
    metrics: [
      {
        id: 'engines',
        label: 'Активні рушії',
        value: engineEntries.length > 0 ? formatPair(activeCount, engineEntries.length) : 'Н/д',
        hint: 'Обчислено з реального статусу `/system/engines`.',
        tone: activeCount > 0 ? 'emerald' : 'slate',
      },
      {
        id: 'score',
        label: 'Середній бал',
        value: formatPercent(averageScore),
        hint: 'Середнє значення `score` по доступних рушіях.',
        tone: averageScore != null ? 'sky' : 'slate',
      },
      {
        id: 'latency',
        label: 'Середня затримка',
        value: formatLatency(averageLatency),
        hint: 'Підтверджено `/system/stats.avg_latency` або середнім по рушіях.',
        tone: averageLatency != null ? 'amber' : 'slate',
      },
      {
        id: 'throughput',
        label: 'Сумарний потік',
        value: engineEntries.length > 0 ? formatCount(throughputTotal) : 'Н/д',
        hint: 'Сума `throughput` з `/system/engines` без домальованих одиниць.',
        tone: throughputTotal > 0 ? 'emerald' : 'slate',
      },
      {
        id: 'services',
        label: 'Справні сервіси',
        value: formatPair(systemStatus?.summary.healthy, systemStatus?.summary.total),
        hint: 'Підтверджено `/system/status.summary`.',
        tone: systemStatus ? 'sky' : 'slate',
      },
    ],
    engines,
    logs,
    hasAnyData: Boolean(engineEntries.length > 0 || logs.length > 0 || systemStatus || systemStats),
  };
};
