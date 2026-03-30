type UnknownRecord = Record<string, unknown>;

export type ActiveJobType =
    | 'customs'
    | 'excel'
    | 'csv'
    | 'pdf'
    | 'image'
    | 'audio'
    | 'video'
    | 'telegram'
    | 'website'
    | 'api'
    | 'rss'
    | 'word'
    | 'unknown';

export type ActiveJobStatus =
    | 'pending'
    | 'processing'
    | 'indexing'
    | 'vectorizing'
    | 'completed'
    | 'failed';

export interface ActiveJobViewModel {
    id: string;
    name: string;
    type: ActiveJobType;
    status: ActiveJobStatus;
    progressPct: number | null;
    stageLabel: string;
    startedAt: string | null;
    completedAt: string | null;
    itemsProcessed: number | null;
    itemsTotal: number | null;
    error: string | null;
}

const TYPE_ALIASES: Record<string, ActiveJobType> = {
    customs: 'customs',
    excel: 'excel',
    xlsx: 'excel',
    xls: 'excel',
    csv: 'csv',
    pdf: 'pdf',
    image: 'image',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    audio: 'audio',
    mp3: 'audio',
    wav: 'audio',
    video: 'video',
    mp4: 'video',
    mov: 'video',
    telegram: 'telegram',
    website: 'website',
    web: 'website',
    api: 'api',
    rss: 'rss',
    word: 'word',
    doc: 'word',
    docx: 'word',
};

const STATUS_ALIASES: Record<string, ActiveJobStatus> = {
    created: 'pending',
    upload: 'pending',
    queued: 'pending',
    pending: 'pending',
    source_checked: 'processing',
    ingested: 'processing',
    ingest_minio: 'processing',
    decode: 'processing',
    parse: 'processing',
    parsed: 'processing',
    validate: 'processing',
    validated: 'processing',
    normalize: 'processing',
    normalized: 'processing',
    transform: 'processing',
    transformed: 'processing',
    extract_content: 'processing',
    extracting: 'processing',
    chunk: 'processing',
    chunked: 'processing',
    resolve_entities: 'processing',
    entities_resolved: 'processing',
    nlp_extraction: 'processing',
    archiving: 'processing',
    staging: 'processing',
    processing: 'processing',
    running: 'processing',
    promoting: 'processing',
    load_sql: 'indexing',
    routing_sql: 'indexing',
    routing_graph: 'indexing',
    routing_search: 'indexing',
    routing_vector: 'indexing',
    build_graph: 'indexing',
    graph_built: 'indexing',
    index_search: 'indexing',
    indexed: 'indexing',
    indexing: 'indexing',
    vectorize: 'vectorizing',
    vectorized: 'vectorizing',
    ready: 'completed',
    completed: 'completed',
    success: 'completed',
    failed: 'failed',
    error: 'failed',
    cancelled: 'failed',
};

const STAGE_LABELS: Record<string, string> = {
    created: 'Створено',
    upload: 'Завантаження',
    queued: 'У черзі',
    pending: 'Очікування',
    source_checked: 'Перевірка джерела',
    ingested: 'Приймання',
    ingest_minio: 'Запис у сховище',
    decode: 'Декодування',
    parse: 'Парсинг',
    parsed: 'Парсинг',
    validate: 'Валідація',
    validated: 'Валідація',
    normalize: 'Нормалізація',
    normalized: 'Нормалізація',
    transform: 'Трансформація',
    transformed: 'Трансформація',
    extract_content: 'Видобування вмісту',
    extracting: 'Видобування вмісту',
    chunk: 'Сегментація',
    chunked: 'Сегментація',
    resolve_entities: 'Звʼязування сутностей',
    entities_resolved: 'Звʼязування сутностей',
    nlp_extraction: 'NLP-видобування',
    load_sql: 'Завантаження в SQL',
    routing_sql: 'Маршрутизація в SQL',
    routing_graph: 'Маршрутизація в граф',
    routing_search: 'Маршрутизація в пошук',
    routing_vector: 'Маршрутизація у вектори',
    build_graph: 'Побудова графа',
    graph_built: 'Побудова графа',
    index_search: 'Індексація пошуку',
    indexed: 'Індексація',
    indexing: 'Індексація',
    vectorize: 'Векторизація',
    vectorized: 'Векторизація',
    archiving: 'Архівація',
    staging: 'Підготовка',
    processing: 'Виконання',
    running: 'Виконання',
    promoting: 'Промоція результатів',
    ready: 'Готово',
    completed: 'Завершено',
    success: 'Завершено',
    failed: 'Помилка',
    error: 'Помилка',
    cancelled: 'Скасовано',
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

    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value.replace(',', '.').trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

const readTimestamp = (value: unknown): string | null => {
    const resolved = readString(value);
    if (!resolved) {
        return null;
    }

    const parsed = new Date(resolved);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
};

const toArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (isRecord(value)) {
        if (Array.isArray(value.items)) {
            return value.items;
        }

        if (Array.isArray(value.jobs)) {
            return value.jobs;
        }
    }

    return [];
};

const getLeafName = (value: unknown): string | null => {
    const resolved = readString(value);
    if (!resolved) {
        return null;
    }

    const leaf = resolved.split(/[\\/]/).pop();
    return leaf && leaf.trim().length > 0 ? leaf.trim() : resolved;
};

const inferTypeFromFileName = (fileName: string | null): ActiveJobType => {
    if (!fileName) {
        return 'unknown';
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) {
        return 'unknown';
    }

    return TYPE_ALIASES[extension] ?? 'unknown';
};

const resolveJobType = (job: UnknownRecord): ActiveJobType => {
    const rawType =
        readString(job.pipeline_type)?.toLowerCase() ??
        readString(job.source_type)?.toLowerCase() ??
        null;

    if (rawType && TYPE_ALIASES[rawType]) {
        return TYPE_ALIASES[rawType];
    }

    return inferTypeFromFileName(getLeafName(job.file_name) ?? getLeafName(job.source_file));
};

const buildDisplayName = (job: UnknownRecord, type: ActiveJobType): string => {
    const fileName = getLeafName(job.file_name) ?? getLeafName(job.source_file) ?? getLeafName(job.name);

    if (type === 'telegram' && fileName) {
        return fileName.startsWith('telegram_')
            ? `Telegram: @${fileName.replace(/^telegram_/, '')}`
            : `Telegram: ${fileName}`;
    }

    if (type === 'website' && fileName) {
        return `Веб-джерело: ${fileName}`;
    }

    if (type === 'rss' && fileName) {
        return `RSS-стрічка: ${fileName}`;
    }

    if (type === 'api' && fileName) {
        return `API-інтеграція: ${fileName}`;
    }

    if (type === 'audio' && fileName) {
        return `Аудіо: ${fileName}`;
    }

    if (type === 'video' && fileName) {
        return `Відео: ${fileName}`;
    }

    if (type === 'image' && fileName) {
        return `Зображення: ${fileName}`;
    }

    if (type === 'pdf' && fileName) {
        return `PDF: ${fileName}`;
    }

    if (type === 'word' && fileName) {
        return `Документ: ${fileName}`;
    }

    if (fileName) {
        return fileName;
    }

    const rawId = readString(job.job_id) ?? readString(job.id) ?? '';
    if (rawId.startsWith('tg-')) {
        return 'Telegram-канал';
    }

    if (rawId.startsWith('web-')) {
        return 'Веб-джерело';
    }

    if (rawId.startsWith('rss-')) {
        return 'RSS-стрічка';
    }

    if (rawId.startsWith('api-')) {
        return 'API-інтеграція';
    }

    return 'Завдання без назви';
};

const resolveProgress = (job: UnknownRecord): number | null => {
    const nestedProgress = isRecord(job.progress) ? readNumber(job.progress.percent) : null;
    const rawProgress =
        readNumber(job.progress_pct) ??
        readNumber(job.progress) ??
        nestedProgress;

    if (rawProgress == null) {
        return null;
    }

    return Math.min(100, Math.max(0, Math.round(rawProgress)));
};

const resolveStageLabel = (job: UnknownRecord): string => {
    const rawStage =
        readString(job.stage) ??
        (isRecord(job.progress) ? readString(job.progress.stage) : null) ??
        readString(job.status) ??
        readString(job.state);

    if (!rawStage) {
        return 'Етап не вказано';
    }

    const normalized = rawStage.toLowerCase();
    return STAGE_LABELS[normalized] ?? 'Етап не вказано';
};

const resolveItemsProcessed = (job: UnknownRecord): number | null => {
    if (isRecord(job.progress)) {
        const progress = job.progress;
        return (
            readNumber(progress.records_processed) ??
            readNumber(progress.items_processed)
        );
    }

    return readNumber(job.successful_records) ?? readNumber(job.records_processed);
};

const resolveItemsTotal = (job: UnknownRecord): number | null => {
    if (isRecord(job.progress)) {
        const progress = job.progress;
        return (
            readNumber(progress.records_total) ??
            readNumber(progress.items_total)
        );
    }

    return readNumber(job.total_records) ?? readNumber(job.records_total);
};

const normalizeJob = (value: unknown, index: number): ActiveJobViewModel | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = readString(value.job_id) ?? readString(value.id) ?? `job-${index + 1}`;
    const rawStatus = readString(value.status)?.toLowerCase() ?? readString(value.state)?.toLowerCase() ?? null;
    const status = rawStatus ? (STATUS_ALIASES[rawStatus] ?? 'processing') : 'processing';
    const type = resolveJobType(value);

    return {
        id,
        name: buildDisplayName(value, type),
        type,
        status,
        progressPct: resolveProgress(value),
        stageLabel: resolveStageLabel(value),
        startedAt: readTimestamp(value.started_at) ?? readTimestamp(value.created_at),
        completedAt: readTimestamp(value.completed_at),
        itemsProcessed: resolveItemsProcessed(value),
        itemsTotal: resolveItemsTotal(value),
        error: readString(value.error_summary) ?? readString(value.error),
    };
};

export const normalizeActiveJobsPayload = (payload: unknown): ActiveJobViewModel[] =>
    toArray(payload)
        .map(normalizeJob)
        .filter((item): item is ActiveJobViewModel => item !== null);

export const summarizeActiveJobs = (jobs: ActiveJobViewModel[]): {
    activeCount: number;
    completedCount: number;
    failedCount: number;
} => ({
    activeCount: jobs.filter((job) => !['completed', 'failed'].includes(job.status)).length,
    completedCount: jobs.filter((job) => job.status === 'completed').length,
    failedCount: jobs.filter((job) => job.status === 'failed').length,
});
