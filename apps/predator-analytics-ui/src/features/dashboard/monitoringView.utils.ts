import type { JobStatusResponse } from '@/services/api/ingestion';

export interface MetricPoint {
    label: string;
    value: number;
}

export interface MonitoringLogRecord {
    id: string;
    timestampLabel: string;
    service: string;
    level: string;
    message: string;
    latencyLabel: string | null;
}

export type StatusTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

export interface PipelineJobRecord {
    id: string;
    title: string;
    statusLabel: string;
    stageLabel: string;
    progress: number | null;
    progressLabel: string;
    startedAtLabel: string;
    processedLabel: string | null;
    tone: StatusTone;
    isActive: boolean;
}

export interface ClusterEntityRecord {
    id: string;
    name: string;
    statusLabel: string;
    tone: StatusTone;
    detail: string | null;
    cpu_percent?: number | string;
    memory_percent?: number | string;
}

export interface ClusterSnapshot {
    statusLabel: string;
    nodeCount: number | null;
    podCount: number | null;
    nodes: ClusterEntityRecord[];
    pods: ClusterEntityRecord[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toString();
    }

    return null;
};

const readNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(',', '.').trim();
        const parsed = Number(normalized);

        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

const toArray = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value.filter(isRecord) : [];

const STATUS_META: Record<string, { label: string; tone: StatusTone; isActive: boolean }> = {
    healthy: { label: 'Справно', tone: 'emerald', isActive: true },
    ok: { label: 'Справно', tone: 'emerald', isActive: true },
    online: { label: 'Онлайн', tone: 'emerald', isActive: true },
    running: { label: 'У роботі', tone: 'emerald', isActive: true },
    ready: { label: 'Готово', tone: 'emerald', isActive: false },
    success: { label: 'Завершено', tone: 'emerald', isActive: false },
    completed: { label: 'Завершено', tone: 'emerald', isActive: false },
    degraded: { label: 'Деградовано', tone: 'amber', isActive: true },
    warning: { label: 'Попередження', tone: 'amber', isActive: true },
    warn: { label: 'Попередження', tone: 'amber', isActive: true },
    syncing: { label: 'Синхронізація', tone: 'amber', isActive: true },
    pending: { label: 'Очікування', tone: 'slate', isActive: true },
    queued: { label: 'Черга', tone: 'slate', isActive: true },
    created: { label: 'Створено', tone: 'slate', isActive: true },
    processing: { label: 'Обробка', tone: 'sky', isActive: true },
    indexing: { label: 'Індексація', tone: 'sky', isActive: true },
    vectorizing: { label: 'Векторизація', tone: 'sky', isActive: true },
    failed: { label: 'Помилка', tone: 'rose', isActive: false },
    error: { label: 'Помилка', tone: 'rose', isActive: false },
    critical: { label: 'Критично', tone: 'rose', isActive: true },
    offline: { label: 'Недоступно', tone: 'rose', isActive: false },
    unknown: { label: 'Невідомо', tone: 'slate', isActive: false },
};

export const getStatusMeta = (rawStatus?: string | null): { label: string; tone: StatusTone; isActive: boolean } => {
    const key = rawStatus?.trim().toLowerCase() ?? 'unknown';
    return STATUS_META[key] ?? { label: prettifyToken(rawStatus) ?? 'Невідомо', tone: 'slate', isActive: false };
};

const STAGE_LABELS: Record<string, string> = {
    created: 'Створення',
    upload: 'Завантаження',
    source_checked: 'Перевірка джерела',
    ingested: 'Інгест виконано',
    decode: 'Декодування',
    parse: 'Парсинг',
    parsed: 'Парсинг завершено',
    validate: 'Валідація',
    validated: 'Валідацію завершено',
    normalize: 'Нормалізація',
    normalized: 'Нормалізацію завершено',
    transform: 'Трансформація',
    transformed: 'Трансформацію завершено',
    extract_content: 'Витяг тексту',
    chunk: '� озбиття на блоки',
    resolve_entities: 'Виділення сутностей',
    load_sql: 'Запис у SQL',
    routing_sql: 'Маршрутизація SQL',
    routing_graph: 'Маршрутизація графа',
    routing_search: 'Маршрутизація пошуку',
    routing_vector: 'Маршрутизація векторів',
    build_graph: 'Побудова графа',
    index_search: 'Індексація пошуку',
    vectorize: 'Векторизація',
    promoting: 'Промоція',
    ready: 'Готово',
    completed: 'Завершено',
    failed: 'Помилка',
    running: 'В роботі',
};

const prettifyToken = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const normalized = value.replace(/[_-]+/g, ' ').trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const buildTimestampLabel = (timestamp?: string | null): string => {
    if (!timestamp) {
        return 'Н/д';
    }

    const parsed = new Date(timestamp);

    if (Number.isNaN(parsed.getTime())) {
        return 'Н/д';
    }

    return parsed.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const buildShortTimeLabel = (timestamp?: string | null): string => {
    if (!timestamp) {
        return 'Зараз';
    }

    const parsed = new Date(timestamp);

    if (Number.isNaN(parsed.getTime())) {
        return 'Зараз';
    }

    return parsed.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatPercent = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

export const formatCount = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

export const formatLatency = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} мс`;

export const formatBytes = (value?: number | null): string => {
    if (value == null || !Number.isFinite(value) || value < 0) {
        return 'Н/д';
    }

    const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    let size = value;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    const precision = size >= 100 || unitIndex === 0 ? 0 : 1;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

export const appendMetricPoint = (
    history: MetricPoint[],
    value?: number | null,
    timestamp?: string | null,
    limit: number = 12,
): MetricPoint[] => {
    if (value == null || !Number.isFinite(value)) {
        return history;
    }

    const nextPoint = {
        label: buildShortTimeLabel(timestamp),
        value: Math.max(0, Math.min(100, Math.round(value))),
    };

    return [...history, nextPoint].slice(-limit);
};

export const normalizeSystemLogs = (input: unknown): MonitoringLogRecord[] => {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .filter(isRecord)
        .map((log, index) => {
            const timestamp =
                readString(log.timestamp) ??
                readString(log.created_at) ??
                readString(log.time);
            const service = readString(log.service) ?? 'SYSTEM';
            const level = (readString(log.level) ?? 'INFO').toUpperCase();
            const message =
                readString(log.message) ??
                readString(log.msg) ??
                'Подія без тексту';
            const latencyValue =
                readNumber(log.latency_ms) ??
                readNumber(log.duration_ms) ??
                readNumber(log.latency);

            return {
                id: readString(log.id) ?? `${timestamp ?? 'no-time'}:${service}:${index}`,
                timestampLabel: buildTimestampLabel(timestamp),
                sortTimestamp: timestamp ? new Date(timestamp).getTime() : 0,
                service: service.toUpperCase(),
                level,
                message,
                latencyLabel: latencyValue == null ? null : formatLatency(latencyValue),
            };
        })
        .sort((left, right) => right.sortTimestamp - left.sortTimestamp)
        .map(({ sortTimestamp: _sortTimestamp, ...log }) => log);
};

const buildJobTitle = (job: Record<string, unknown>): string => {
    const fileName =
        readString(job.file_name) ??
        readString(job.source_file) ??
        readString(job.name);
    const sourceType = readString(job.pipeline_type) ?? readString(job.source_type);
    const jobId = readString(job.job_id) ?? readString(job.id);

    if (fileName) {
        return fileName;
    }

    if (sourceType) {
        return `Потік ${prettifyToken(sourceType)}`;
    }

    if (jobId) {
        return `Завдання ${jobId}`;
    }

    return 'Невідоме завдання';
};

const buildProcessedLabel = (job: Record<string, unknown>): string | null => {
    const total =
        readNumber(job.total_records) ??
        readNumber(job.records_total);
    const successful =
        readNumber(job.successful_records) ??
        readNumber(job.records_processed);
    const failed = readNumber(job.failed_records);

    if (total != null && successful != null) {
        return `${formatCount(successful)} з ${formatCount(total)} записів`;
    }

    if (successful != null || failed != null) {
        return `${formatCount(successful ?? 0)} успішно / ${formatCount(failed ?? 0)} помилок`;
    }

    return null;
};

export const normalizePipelineJobs = (input: unknown): PipelineJobRecord[] => {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .filter(isRecord)
        .map((job) => {
            const rawStatus = readString(job.status) ?? readString(job.state) ?? 'unknown';
            const statusMeta = getStatusMeta(rawStatus);
            const rawStage =
                readString(job.stage) ??
                readString(isRecord(job.progress) ? job.progress.stage : null) ??
                rawStatus;
            const stageKey = rawStage.trim().toLowerCase();
            const stageLabel = STAGE_LABELS[stageKey] ?? prettifyToken(rawStage) ?? 'Немає підтвердженого етапу';
            const progress =
                readNumber(job.progress_pct) ??
                readNumber(isRecord(job.progress) ? job.progress.percent : null);
            const startedAt =
                readString(job.started_at) ??
                readString(job.created_at) ??
                readString(job.completed_at);

            return {
                id: readString(job.job_id) ?? readString(job.id) ?? buildJobTitle(job),
                title: buildJobTitle(job),
                statusLabel: statusMeta.label,
                stageLabel,
                sortTimestamp: startedAt ? new Date(startedAt).getTime() : 0,
                progress: progress == null || !Number.isFinite(progress) ? null : Math.max(0, Math.min(100, Math.round(progress))),
                progressLabel:
                    progress == null || !Number.isFinite(progress)
                        ? 'Н/д'
                        : `${Math.max(0, Math.min(100, Math.round(progress)))}%`,
                startedAtLabel: buildTimestampLabel(startedAt),
                processedLabel: buildProcessedLabel(job),
                tone: statusMeta.tone,
                isActive: statusMeta.isActive,
            };
        })
        .sort((left, right) => right.sortTimestamp - left.sortTimestamp)
        .map(({ sortTimestamp: _sortTimestamp, ...job }) => job);
};

const buildClusterEntity = (entity: Record<string, unknown>, index: number, fallbackPrefix: string): ClusterEntityRecord => {
    const name =
        readString(entity.name) ??
        readString(entity.id) ??
        `${fallbackPrefix} ${index + 1}`;
    const rawStatus =
        readString(entity.status) ??
        readString(entity.phase) ??
        readString(entity.state) ??
        'unknown';
    const statusMeta = getStatusMeta(rawStatus);

    const detailParts = [
        readString(entity.ready),
        readString(entity.cpu),
        readString(entity.memory),
        readString(entity.age),
    ].filter(Boolean);

    return {
        id: readString(entity.id) ?? `${fallbackPrefix.toLowerCase()}-${index}`,
        name,
        statusLabel: statusMeta.label,
        tone: statusMeta.tone,
        detail: detailParts.length > 0 ? detailParts.join(' • ') : null,
        cpu_percent: readNumber(entity.cpu_percent) ?? readNumber(entity.cpu) ?? 0,
        memory_percent: readNumber(entity.memory_percent) ?? readNumber(entity.memory) ?? 0,
    };
};

export const normalizeClusterSnapshot = (input: unknown): ClusterSnapshot => {
    if (!isRecord(input)) {
        return {
            statusLabel: 'Кластерні дані відсутні',
            nodeCount: null,
            podCount: null,
            nodes: [],
            pods: [],
        };
    }

    const nodeList = buildClusterList(input.nodes, 'Вузол');
    const podList = buildClusterList(input.pods, 'Под');
    const rawStatus =
        readString(input.status) ??
        readString(input.cluster_status) ??
        readString(input.health) ??
        'unknown';
    const hasNodes = Array.isArray(input.nodes) || readNumber(input.nodes) != null;
    const hasPods = Array.isArray(input.pods) || readNumber(input.pods) != null;

    return {
        statusLabel: getStatusMeta(rawStatus).label,
        nodeCount: hasNodes ? readNumber(input.nodes) ?? nodeList.length : null,
        podCount: hasPods ? readNumber(input.pods) ?? podList.length : null,
        nodes: nodeList,
        pods: podList,
    };
};

const buildClusterList = (value: unknown, fallbackPrefix: string): ClusterEntityRecord[] =>
    toArray(value).map((entity, index) => buildClusterEntity(entity, index, fallbackPrefix));

export const formatDateTime = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    return buildTimestampLabel(value);
};

export const hasVisibleClusterData = (cluster: ClusterSnapshot): boolean =>
    cluster.nodeCount != null || cluster.podCount != null || cluster.nodes.length > 0 || cluster.pods.length > 0;

export const normalizeJobStatusResponse = (jobs: JobStatusResponse[]): PipelineJobRecord[] =>
    normalizePipelineJobs(jobs);
