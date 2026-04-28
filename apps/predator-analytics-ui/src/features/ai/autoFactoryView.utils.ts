import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';

type UnknownRecord = Record<string, unknown>;

export type AutoFactoryTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'gold';

export interface AutoFactoryMetricCard {
  label: string;
  value: string;
  hint: string;
  tone: AutoFactoryTone;
}

export interface AutoFactoryPipelineStage {
  id: string;
  label: string;
  detail: string;
  status: 'done' | 'active' | 'pending';
  tone: AutoFactoryTone;
}

export interface AutoFactoryBugRecord {
  id: string;
  title: string;
  componentLabel: string;
  detailLabel: string;
  riskLabel: string;
  statusLabel: string;
  councilLabel: string;
  progress: number | null;
  progressLabel: string;
  tone: AutoFactoryTone;
}

export interface AutoFactoryLogRecord {
  id: string;
  timestampLabel: string;
  levelLabel: string;
  message: string;
  tone: AutoFactoryTone;
}

export interface AutoFactoryEngineRecord {
  id: string;
  title: string;
  statusLabel: string;
  detailLabel: string;
  tone: AutoFactoryTone;
}

export interface AutoFactoryReliabilityBar {
  id: string;
  label: string;
  value: number | null;
  valueLabel: string;
  hint: string;
  tone: AutoFactoryTone;
}

export interface AutoFactorySnapshot {
  isRunning: boolean;
  statusLabel: string;
  cycleLabel: string;
  improvementsLabel: string;
  avgScoreLabel: string;
  lastUpdatedLabel: string | null;
  metrics: AutoFactoryMetricCard[];
  pipeline: AutoFactoryPipelineStage[];
  bugs: AutoFactoryBugRecord[];
  logs: AutoFactoryLogRecord[];
  engines: AutoFactoryEngineRecord[];
  reliability: AutoFactoryReliabilityBar[];
  hasAnyData: boolean;
}

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

const toRecordArray = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const formatCount = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatPercent = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatLatency = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} мс`;

const normalizeSeverityLabel = (value: string | null): string => {
  const normalized = value?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'critical':
      return 'Критичний';
    case 'high':
      return 'Високий';
    case 'medium':
      return 'Середній';
    case 'low':
      return 'Низький';
    default:
      return value?.trim().length ? value.trim().toUpperCase() : 'Н/д';
  }
};

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

const normalizeRatioPercent = (value?: number | null): number | null => {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
};

const getStatusMeta = (status?: string | null): { label: string; tone: AutoFactoryTone } => {
  const normalized = status?.trim().toLowerCase() ?? 'unknown';

  if (['running', 'active', 'processing', 'in_progress'].includes(normalized)) {
    return { label: 'У роботі', tone: 'amber' };
  }

  if (['done', 'completed', 'success', 'fixed', 'healthy', 'ok'].includes(normalized)) {
    return { label: 'Завершено', tone: 'emerald' };
  }

  if (['queued', 'pending', 'idle', 'created'].includes(normalized)) {
    return { label: 'Очікування', tone: 'slate' };
  }

  if (['error', 'failed', 'critical'].includes(normalized)) {
    return { label: 'Помилка', tone: 'amber' };
  }

  return { label: 'Невідомо', tone: 'slate' };
};

const buildPipeline = (
  isRunning: boolean,
  phase: string | null,
  cycles: number | null,
  improvements: number | null,
  lastUpdatedLabel: string | null,
): AutoFactoryPipelineStage[] => {
  const order = ['observe', 'orient', 'decide', 'act'];
  const activeIndex = phase ? order.indexOf(phase.toLowerCase()) : -1;

  return [
    {
      id: 'observe',
      label: 'Спостереження',
      detail: cycles == null ? 'Кількість циклів не підтверджена' : `Циклів завершено: ${formatCount(cycles)}`,
      status: activeIndex > 0 ? 'done' : activeIndex === 0 && isRunning ? 'active' : 'pending',
      tone: activeIndex > 0 ? 'emerald' : activeIndex === 0 && isRunning ? 'amber' : 'slate',
    },
    {
      id: 'orient',
      label: 'Орієнтація',
      detail: isRunning ? 'Бекенд аналізує контекст поточного циклу' : 'Очікує активний цикл',
      status: activeIndex > 1 ? 'done' : activeIndex === 1 && isRunning ? 'active' : 'pending',
      tone: activeIndex > 1 ? 'emerald' : activeIndex === 1 && isRunning ? 'amber' : 'slate',
    },
    {
      id: 'decide',
      label: '� ішення',
      detail: improvements == null ? 'Кількість покращень не підтверджена' : `Покращень зафіксовано: ${formatCount(improvements)}`,
      status: activeIndex > 2 ? 'done' : activeIndex === 2 && isRunning ? 'active' : 'pending',
      tone: activeIndex > 2 ? 'emerald' : activeIndex === 2 && isRunning ? 'amber' : 'slate',
    },
    {
      id: 'act',
      label: 'Виконання',
      detail: lastUpdatedLabel ? `Останнє оновлення: ${lastUpdatedLabel}` : 'Бекенд не повернув час виконання',
      status: activeIndex === 3 && isRunning ? 'active' : activeIndex > 3 || (!isRunning && activeIndex >= 0) ? 'done' : 'pending',
      tone: activeIndex === 3 && isRunning ? 'amber' : activeIndex > 3 || (!isRunning && activeIndex >= 0) ? 'emerald' : 'slate',
    },
    {
      id: 'reflect',
      label: '� ефлексія',
      detail: !isRunning && improvements != null && improvements > 0 ? 'Цикл завершився, артефакти зафіксовано' : 'Очікує завершення активного циклу',
      status: !isRunning && improvements != null && improvements > 0 ? 'done' : 'pending',
      tone: !isRunning && improvements != null && improvements > 0 ? 'emerald' : 'slate',
    },
  ];
};

const buildBugRecord = (bug: UnknownRecord, index: number): AutoFactoryBugRecord => {
  const rawStatus = readString(bug.status);
  const statusMeta = getStatusMeta(rawStatus);
  const severity = normalizeSeverityLabel(readString(bug.severity));
  const progress = readNumber(bug.fixProgress) ?? readNumber(bug.progress);

  return {
    id: readString(bug.id) ?? `bug-${index}`,
    title: readString(bug.description) ?? readString(bug.title) ?? `Проблема ${index + 1}`,
    componentLabel: readString(bug.component) ?? 'Н/д',
    detailLabel: readString(bug.file) ?? readString(bug.reason) ?? 'Немає підтвердженої деталізації',
    riskLabel: severity,
    statusLabel: statusMeta.label,
    councilLabel: readString(bug.council) ?? 'Н/д',
    progress: progress == null ? null : Math.max(0, Math.min(100, Math.round(progress))),
    progressLabel: progress == null ? 'Н/д' : `${Math.max(0, Math.min(100, Math.round(progress)))}%`,
    tone:
      severity === 'Критичний' || severity === 'Високий'
        ? 'rose'
        : statusMeta.tone,
  };
};

const inferLogMeta = (message: string): { levelLabel: string; tone: AutoFactoryTone } => {
  const upper = message.toUpperCase();

  if (upper.includes('ERROR') || upper.includes('FAIL')) {
    return { levelLabel: 'ПОМИЛКА', tone: 'amber' };
  }

  if (upper.includes('WARN') || upper.includes('LATENCY')) {
    return { levelLabel: 'УВАГА', tone: 'amber' };
  }

  if (upper.includes('OK') || upper.includes('SUCCESS') || upper.includes('FIXED')) {
    return { levelLabel: 'НО� МА', tone: 'emerald' };
  }

  return { levelLabel: 'ІНФО', tone: 'sky' };
};

const normalizeLogLevelLabel = (value: string | null, fallback: string): string => {
  const normalized = value?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'error':
    case 'failed':
    case 'critical':
      return 'ПОМИЛКА';
    case 'warn':
    case 'warning':
      return 'УВАГА';
    case 'ok':
    case 'success':
    case 'fixed':
    case 'healthy':
      return 'НО� МА';
    case 'info':
      return 'ІНФО';
    default:
      return fallback;
  }
};

const buildLogRecords = (status: unknown, factoryLogs: unknown): AutoFactoryLogRecord[] => {
  const statusRecord = isRecord(status) ? status : null;
  const records: AutoFactoryLogRecord[] = [];

  if (statusRecord && Array.isArray(statusRecord.logs)) {
    statusRecord.logs
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .forEach((entry, index) => {
        const meta = inferLogMeta(entry);
        records.push({
          id: `status-log-${index}`,
          timestampLabel: 'Живий стан',
          levelLabel: meta.levelLabel,
          message: entry,
          tone: meta.tone,
        });
      });
  }

  const flattenedFactoryLogs = Array.isArray(factoryLogs)
    ? factoryLogs
    : isRecord(factoryLogs)
      ? (
          (Array.isArray(factoryLogs.logs) ? factoryLogs.logs : null) ??
          (Array.isArray(factoryLogs.items) ? factoryLogs.items : null) ??
          []
        )
      : [];

  flattenedFactoryLogs.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const meta = inferLogMeta(entry);
      records.push({
        id: `factory-log-${index}`,
        timestampLabel: 'Factory API',
        levelLabel: meta.levelLabel,
        message: entry,
        tone: meta.tone,
      });
      return;
    }

    if (!isRecord(entry)) {
      return;
    }

    const message =
      readString(entry.message) ??
      readString(entry.msg) ??
      readString(entry.line);

    if (!message) {
      return;
    }

    const meta = inferLogMeta(message);
    records.push({
      id: readString(entry.id) ?? `factory-log-${index}`,
      timestampLabel:
        formatDateTime(readString(entry.timestamp) ?? readString(entry.created_at)) ??
        'Factory API',
      levelLabel: normalizeLogLevelLabel(readString(entry.level), meta.levelLabel),
      message,
      tone: meta.tone,
    });
  });

  return records.slice(-80);
};

export const normalizeAutoFactorySnapshot = (
  status: unknown,
  bugs: unknown,
  goldPatterns: unknown,
  factoryStats: unknown,
  factoryLogs: unknown,
  systemStats: SystemStatsResponse | null,
  systemStatus: SystemStatusResponse | null,
): AutoFactorySnapshot => {
  const statusRecord = isRecord(status) ? status : null;
  const statsRecord = isRecord(factoryStats) ? factoryStats : null;
  const bugRecords = toRecordArray(bugs).map((bug, index) => buildBugRecord(bug, index));
  const goldPatternCount =
    Array.isArray(goldPatterns)
      ? goldPatterns.length
      : readNumber(isRecord(goldPatterns) ? goldPatterns.total : null) ?? 0;
  const cycles = readNumber(statusRecord?.cycles_completed);
  const improvements = readNumber(statusRecord?.improvements_made);
  const avgScore = readNumber(statsRecord?.avg_score);
  const totalPatterns = readNumber(statsRecord?.total_patterns);
  const lastUpdatedLabel = formatDateTime(readString(statusRecord?.last_update));
  const isRunning = Boolean(statusRecord?.is_running);
  const activeFixes = bugRecords.filter((bug) => bug.statusLabel === 'У роботі').length;
  const fixedBugs = bugRecords.filter((bug) => bug.statusLabel === 'Завершено').length;
  const totalServices = systemStatus?.summary.total ?? null;
  const healthyServices = systemStatus?.summary.healthy ?? null;
  const serviceHealthPercent =
    totalServices && healthyServices != null && totalServices > 0
      ? (healthyServices / totalServices) * 100
      : null;
  const goldSharePercent =
    totalPatterns != null && totalPatterns > 0
      ? (goldPatternCount / totalPatterns) * 100
      : null;
  const bugResolutionPercent =
    bugRecords.length > 0
      ? (fixedBugs / bugRecords.length) * 100
      : null;

  return {
    isRunning,
    statusLabel: isRunning ? 'Активний цикл' : 'Очікування',
    cycleLabel: formatCount(cycles),
    improvementsLabel: formatCount(improvements),
    avgScoreLabel: formatPercent(avgScore),
    lastUpdatedLabel,
    metrics: [
      {
        label: 'Циклів OODA',
        value: formatCount(cycles),
        hint: 'Підтверджено `/factory/infinite/status.cycles_completed`.',
        tone: 'sky',
      },
      {
        label: 'Середній бал контуру',
        value: formatPercent(avgScore),
        hint: 'Підтверджено `/factory/stats.avg_score`.',
        tone: 'emerald',
      },
      {
        label: 'Активні виправлення',
        value: formatCount(activeFixes),
        hint: 'Обчислено з реальної черги `/factory/bugs`.',
        tone: activeFixes > 0 ? 'amber' : 'slate',
      },
      {
        label: 'Еталонні патерни',
        value: formatCount(goldPatternCount),
        hint: 'Підтверджено `/factory/patterns/gold` або `/factory/stats.total_patterns`.',
        tone: goldPatternCount > 0 ? 'emerald' : 'slate',
      },
      {
        label: 'Середня затримка',
        value: formatLatency(systemStats?.avg_latency ?? null),
        hint: 'Підтверджено `/system/stats.avg_latency`.',
        tone: 'amber',
      },
    ],
    pipeline: buildPipeline(
      isRunning,
      readString(statusRecord?.current_phase),
      cycles,
      improvements,
      lastUpdatedLabel,
    ),
    bugs: bugRecords,
    logs: buildLogRecords(status, factoryLogs),
    engines: [
      {
        id: 'ooda',
        title: 'Контур OODA',
        statusLabel: isRunning ? 'Активний' : 'Очікування',
        detailLabel:
          readString(statusRecord?.current_phase)
            ? `Поточна фаза: ${readString(statusRecord?.current_phase)?.toUpperCase()}`
            : 'Фаза не підтверджена бекендом',
        tone: isRunning ? 'amber' : 'slate',
      },
      {
        id: 'bugs',
        title: 'Черга виправлень',
        statusLabel: bugRecords.length > 0 ? 'Підтверджено' : 'Порожньо',
        detailLabel:
          bugRecords.length > 0
            ? `${formatCount(bugRecords.length)} записів у /factory/bugs`
            : 'Бекенд не повернув баги для цього контуру',
        tone: bugRecords.length > 0 ? 'amber' : 'slate',
      },
      {
        id: 'telemetry',
        title: 'Системна телеметрія',
        statusLabel: systemStatus ? 'Підключено' : 'Н/д',
        detailLabel:
          systemStatus
            ? `${formatCount(systemStatus.summary.healthy)} з ${formatCount(systemStatus.summary.total)} сервісів справні`
            : 'Немає підтвердження з /system/status',
        tone: systemStatus ? 'sky' : 'slate',
      },
    ],
    reliability: [
      {
        id: 'avg-score',
        label: 'Середній score',
        value: normalizeRatioPercent(avgScore),
        valueLabel: formatPercent(avgScore),
        hint: 'Агрегат Factory API.',
        tone: 'emerald',
      },
      {
        id: 'health',
        label: 'Справні сервіси',
        value: normalizeRatioPercent(serviceHealthPercent),
        valueLabel: formatPercent(serviceHealthPercent),
        hint: 'Частка справних сервісів з `/system/status.summary`.',
        tone: 'sky',
      },
      {
        id: 'gold-share',
        label: 'Частка еталонних патернів',
        value: normalizeRatioPercent(goldSharePercent),
        valueLabel: formatPercent(goldSharePercent),
        hint: 'Частка еталонних патернів від усіх патернів.',
        tone: 'amber',
      },
      {
        id: 'bug-resolution',
        label: 'Закриття багів',
        value: normalizeRatioPercent(bugResolutionPercent),
        valueLabel: formatPercent(bugResolutionPercent),
        hint: 'Частка завершених елементів черги `/factory/bugs`.',
        tone: 'amber',
      },
    ],
    hasAnyData: Boolean(
      statusRecord ||
      bugRecords.length > 0 ||
      goldPatternCount > 0 ||
      statsRecord ||
      systemStats ||
      systemStatus,
    ),
  };
};
