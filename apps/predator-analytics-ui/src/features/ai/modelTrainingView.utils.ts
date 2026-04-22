import type { SystemStatsResponse } from '@/services/api/system';

type UnknownRecord = Record<string, unknown>;

export type TrainingTone = 'emerald' | 'amber' | 'slate' | 'rose';
export type TrainingStatusKey = 'IDLE' | 'TRAINING' | 'COMPLETED' | 'ERROR';

export interface TrainingMetricPoint {
    epoch: number;
    label: string;
    accuracy: number | null;
    loss: number | null;
}

export interface TrainingRunRecord {
    id: string;
    title: string;
    statusLabel: string;
    progressLabel: string;
    accuracyLabel: string;
    lossLabel: string;
    timestampLabel: string;
    tone: TrainingTone;
}

export interface TrainingSessionCard {
    statusKey: TrainingStatusKey;
    statusLabel: string;
    tone: TrainingTone;
    isRunning: boolean;
    modelLabel: string;
    progress: number | null;
    progressLabel: string;
    epochLabel: string;
    lossLabel: string;
    queueLabel: string;
    startedAtLabel: string;
    message: string;
}

export interface TrainingResourceCard {
    cpuLabel: string;
    memoryLabel: string;
    taskLabel: string;
    latencyLabel: string;
}

export interface TrainingSnapshot {
    session: TrainingSessionCard;
    resources: TrainingResourceCard;
    metrics: TrainingMetricPoint[];
    runs: TrainingRunRecord[];
    logs: string[];
    accuracyHeadline: string;
    statusHeadline: string;
    lastUpdatedLabel: string | null;
    hasAnyData: boolean;
}

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
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

const toRecordArray = (value: unknown): UnknownRecord[] => {
    if (Array.isArray(value)) {
        return value.filter(isRecord);
    }

    return [];
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

const formatPercent = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatProgress = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatLoss = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : value.toFixed(value < 1 ? 4 : 2);

const normalizeRatioPercent = (value?: number | null): number | null => {
    if (value == null || !Number.isFinite(value)) {
        return null;
    }

    const percent = value <= 1 ? value * 100 : value;
    return Math.max(0, Math.min(100, percent));
};

const buildQueueLabel = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} в черзі`;

const extractNestedRecords = (input: unknown): UnknownRecord[] => {
    if (Array.isArray(input)) {
        return input.filter(isRecord);
    }

    if (!isRecord(input)) {
        return [];
    }

    const nestedKeys = ['items', 'history', 'jobs', 'results', 'data'];

    for (const key of nestedKeys) {
        const nested = input[key];

        if (Array.isArray(nested)) {
            return nested.filter(isRecord);
        }
    }

    return [];
};

const getStatusKey = (status: unknown): TrainingStatusKey => {
    if (typeof status === 'boolean') {
        return status ? 'TRAINING' : 'IDLE';
    }

    const normalized = readString(status)?.toLowerCase() ?? '';

    if (['running', 'training', 'active', 'processing', 'queued'].includes(normalized)) {
        return 'TRAINING';
    }

    if (['completed', 'converged', 'done', 'success', 'succeeded'].includes(normalized)) {
        return 'COMPLETED';
    }

    if (['error', 'failed', 'failure'].includes(normalized)) {
        return 'ERROR';
    }

    return 'IDLE';
};

const getStatusMeta = (statusKey: TrainingStatusKey): { label: string; tone: TrainingTone; isRunning: boolean } => {
    if (statusKey === 'TRAINING') {
        return { label: 'У навчанні', tone: 'amber', isRunning: true };
    }

    if (statusKey === 'COMPLETED') {
        return { label: 'Завершено', tone: 'emerald', isRunning: false };
    }

    if (statusKey === 'ERROR') {
        return { label: 'Помилка', tone: 'amber', isRunning: false };
    }

    return { label: 'Очікування', tone: 'slate', isRunning: false };
};

const buildMetricPoint = (record: UnknownRecord, index: number): TrainingMetricPoint | null => {
    const metrics = isRecord(record.metrics) ? record.metrics : {};
    const accuracy =
        normalizeRatioPercent(
            readNumber(metrics.accuracy) ??
            readNumber(record.accuracy),
        );
    const loss =
        readNumber(metrics.loss) ??
        readNumber(record.loss);
    const epoch =
        readNumber(metrics.epoch) ??
        readNumber(record.epoch) ??
        index + 1;

    if (accuracy == null && loss == null) {
        return null;
    }

    return {
        epoch: Math.round(epoch),
        label: `Епоха ${Math.round(epoch)}`,
        accuracy,
        loss,
    };
};

const uniqueById = (records: TrainingRunRecord[]): TrainingRunRecord[] => {
    const seen = new Set<string>();

    return records.filter((record) => {
        if (seen.has(record.id)) {
            return false;
        }

        seen.add(record.id);
        return true;
    });
};

const buildRunRecord = (record: UnknownRecord, index: number): (TrainingRunRecord & { sortTimestamp: number }) | null => {
    const metrics = isRecord(record.metrics) ? record.metrics : {};
    const id =
        readString(record.id) ??
        readString(record.job_id) ??
        `training-run-${index}`;
    const title =
        readString(record.name) ??
        readString(record.model_name) ??
        readString(record.target) ??
        readString(record.activeModel) ??
        'Невідомий запуск';
    const statusKey = getStatusKey(
        readString(record.status) ??
        readString(record.state) ??
        record.isTraining,
    );
    const statusMeta = getStatusMeta(statusKey);
    const accuracy = normalizeRatioPercent(
        readNumber(metrics.accuracy) ??
        readNumber(record.accuracy),
    );
    const loss =
        readNumber(metrics.loss) ??
        readNumber(record.loss);
    const progress =
        readNumber(record.progress) ??
        readNumber(record.progress_pct);
    const timestamp =
        readString(record.updated_at) ??
        readString(record.started_at) ??
        readString(record.startedAt) ??
        readString(record.created_at) ??
        readString(record.timestamp);
    const parsedTimestamp = timestamp ? new Date(timestamp).getTime() : Number.NEGATIVE_INFINITY;

    return {
        id,
        title,
        statusLabel: statusMeta.label,
        progressLabel: formatProgress(progress),
        accuracyLabel: formatPercent(accuracy),
        lossLabel: formatLoss(loss),
        timestampLabel: formatDateTime(timestamp) ?? 'Н/д',
        tone: statusMeta.tone,
        sortTimestamp: Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY,
    };
};

const extractLogs = (status: unknown, jobs: UnknownRecord[], history: UnknownRecord[]): string[] => {
    const statusRecord = isRecord(status) ? status : null;

    if (statusRecord) {
        const directLogs = statusRecord.logs;

        if (Array.isArray(directLogs)) {
            const logs = directLogs.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);

            if (logs.length > 0) {
                return logs;
            }
        }
    }

    const derived = [...jobs, ...history]
        .flatMap((record) => {
            const chunks: string[] = [];
            const timestamp =
                formatDateTime(
                    readString(record.updated_at) ??
                    readString(record.started_at) ??
                    readString(record.startedAt) ??
                    readString(record.created_at) ??
                    readString(record.timestamp),
                ) ?? null;
            const message = readString(record.message) ?? readString(record.summary);
            const error = readString(record.error);
            const statusText = readString(record.status);

            if (message) {
                chunks.push(timestamp ? `[${timestamp}] ${message}` : message);
            }

            if (error) {
                chunks.push(timestamp ? `[${timestamp}] ${error}` : error);
            }

            if (!message && !error && statusText) {
                const title =
                    readString(record.name) ??
                    readString(record.model_name) ??
                    readString(record.target) ??
                    'Запуск';
                chunks.push(timestamp ? `[${timestamp}] ${title}: ${statusText}` : `${title}: ${statusText}`);
            }

            return chunks;
        })
        .slice(0, 40);

    return derived;
};

export const normalizeModelTrainingSnapshot = (
    status: unknown,
    history: unknown,
    jobs: unknown,
    systemStats: SystemStatsResponse | null,
): TrainingSnapshot => {
    const historyRecords = extractNestedRecords(history);
    const jobRecords = extractNestedRecords(jobs);
    const statusRecord = isRecord(status) ? status : null;
    const combinedRuns = [...jobRecords, ...historyRecords];
    const sessionStatusKey = getStatusKey(
        statusRecord?.status ??
        statusRecord?.state ??
        statusRecord?.isTraining,
    );
    const sessionMeta = getStatusMeta(sessionStatusKey);
    const sessionProgress =
        readNumber(statusRecord?.progress) ??
        readNumber(statusRecord?.progress_pct) ??
        (() => {
            const currentEpoch = readNumber(statusRecord?.currentEpoch) ?? readNumber(statusRecord?.current_epoch);
            const totalEpochs = readNumber(statusRecord?.totalEpochs) ?? readNumber(statusRecord?.total_epochs);

            if (currentEpoch == null || totalEpochs == null || totalEpochs === 0) {
                return null;
            }

            return (currentEpoch / totalEpochs) * 100;
        })();
    const currentEpoch = readNumber(statusRecord?.currentEpoch) ?? readNumber(statusRecord?.current_epoch);
    const totalEpochs = readNumber(statusRecord?.totalEpochs) ?? readNumber(statusRecord?.total_epochs);
    const loss =
        readNumber(statusRecord?.loss) ??
        readNumber(statusRecord?.current_loss) ??
        null;
    const firstRunTitle =
        combinedRuns.length > 0
            ? buildRunRecord(combinedRuns[0] ?? {}, 0)?.title ?? null
            : null;
    const modelLabel =
        readString(statusRecord?.activeModel) ??
        readString(statusRecord?.active_model) ??
        readString(statusRecord?.model_name) ??
        firstRunTitle ??
        'Н/д';
    const queueLabel = buildQueueLabel(
        readNumber(statusRecord?.queueSize) ??
        readNumber(statusRecord?.queue_size),
    );
    const startedAtLabel = formatDateTime(
        readString(statusRecord?.startTime) ??
        readString(statusRecord?.started_at) ??
        readString(statusRecord?.startedAt),
    ) ?? 'Н/д';
    const message =
        readString(statusRecord?.message) ??
        readString(statusRecord?.summary) ??
        (sessionMeta.isRunning
            ? 'Бекенд виконує навчання і повертає живий стан сесії.'
            : 'Активна сесія навчання не повернута бекендом.');
    const metricPoints = combinedRuns
        .map((record, index) => buildMetricPoint(record, index))
        .filter((point): point is TrainingMetricPoint => point !== null)
        .sort((left, right) => left.epoch - right.epoch)
        .slice(-12);
    const runs = uniqueById(
        combinedRuns
            .map((record, index) => buildRunRecord(record, index))
            .filter((record): record is TrainingRunRecord & { sortTimestamp: number } => record !== null)
            .sort((left, right) => right.sortTimestamp - left.sortTimestamp)
            .slice(0, 6)
            .map(({ sortTimestamp: _sortTimestamp, ...record }) => record),
    );
    const latestAccuracy =
        metricPoints.length > 0
            ? metricPoints[metricPoints.length - 1].accuracy
            : normalizeRatioPercent(
                readNumber(statusRecord?.accuracy) ??
                readNumber(statusRecord?.current_accuracy),
            );
    const logs = extractLogs(status, jobRecords, historyRecords);
    const lastUpdatedLabel =
        formatDateTime(
            readString(statusRecord?.updated_at) ??
            readString(statusRecord?.last_update) ??
            readString(statusRecord?.timestamp),
        ) ??
        (runs[0]?.timestampLabel !== 'Н/д' ? runs[0]?.timestampLabel ?? null : formatDateTime(systemStats?.timestamp ?? null));

    return {
        session: {
            statusKey: sessionStatusKey,
            statusLabel: sessionMeta.label,
            tone: sessionMeta.tone,
            isRunning: sessionMeta.isRunning,
            modelLabel,
            progress: sessionProgress == null ? null : Math.max(0, Math.min(100, sessionProgress)),
            progressLabel: formatProgress(sessionProgress),
            epochLabel:
                currentEpoch != null && totalEpochs != null
                    ? `${Math.round(currentEpoch)} / ${Math.round(totalEpochs)}`
                    : 'Н/д',
            lossLabel: formatLoss(loss),
            queueLabel,
            startedAtLabel,
            message,
        },
        resources: {
            cpuLabel: formatPercent(systemStats?.cpu_percent ?? null),
            memoryLabel: formatPercent(systemStats?.memory_percent ?? null),
            taskLabel: readNumber(systemStats?.active_tasks) == null ? 'Н/д' : `${Math.round(systemStats!.active_tasks)} активних`,
            latencyLabel: readNumber(systemStats?.avg_latency) == null ? 'Н/д' : `${Math.round(systemStats!.avg_latency)} мс`,
        },
        metrics: metricPoints,
        runs,
        logs,
        accuracyHeadline: formatPercent(latestAccuracy),
        statusHeadline: sessionMeta.label,
        lastUpdatedLabel,
        hasAnyData: Boolean(statusRecord || historyRecords.length > 0 || jobRecords.length > 0 || systemStats),
    };
};
