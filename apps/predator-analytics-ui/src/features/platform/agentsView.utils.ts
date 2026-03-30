import type { DashboardAlert } from '@/services/api/dashboard';
import type { SystemStatsResponse } from '@/services/api/system';
import type { Agent } from '@/types';

type UnknownRecord = Record<string, unknown>;

export interface AgentResourcePoint {
    time: string;
    cpu: number;
    mem: number;
}

export interface AgentResourceSnapshot {
    cpuPercent: number | null;
    memoryPercent: number | null;
    cpuCapacityLabel: string;
    memoryCapacityLabel: string;
    timestampLabel: string | null;
}

export interface FleetAlertRecord {
    id: string;
    severity: DashboardAlert['severity'];
    message: string;
    sourceLabel: string;
    timestampLabel: string;
}

export type OsintToolStatus = 'ОНЛАЙН' | 'СКАНУЄ' | 'ОФЛАЙН';
export type OsintToolIconKey = 'eye' | 'globe' | 'radar' | 'scan' | 'target' | 'branch' | 'terminal';

export interface FleetOsintToolRecord {
    id: string;
    name: string;
    category: string;
    status: OsintToolStatus;
    findingsCount: number | null;
    findingsLabel: string;
    lastScanLabel: string;
    description: string | null;
    color: string;
    iconKey: OsintToolIconKey;
    route: string;
}

export interface FleetOsintSummary {
    totalTools: number;
    onlineTools: number;
    activeScans: number;
    totalFindingsLabel: string;
    coverageLabel: string;
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

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const toUpperToken = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized.toUpperCase() : null;
};

const formatCount = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatBytes = (value?: number | null): string => {
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

const formatTime = (value?: string | null): string => {
    if (!value) {
        return 'Н/д';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'Н/д';
    }

    return parsed.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const extractRecords = (input: unknown): UnknownRecord[] => {
    if (Array.isArray(input)) {
        return input.filter(isRecord);
    }

    if (!isRecord(input)) {
        return [];
    }

    const nestedKeys = ['items', 'results', 'alerts', 'tools', 'data'];

    for (const key of nestedKeys) {
        const nested = input[key];

        if (Array.isArray(nested)) {
            return nested.filter(isRecord);
        }

        if (isRecord(nested)) {
            const nestedItems = extractRecords(nested);

            if (nestedItems.length > 0) {
                return nestedItems;
            }
        }
    }

    return [];
};

const normalizeAgentStatus = (rawStatus?: string | null): Agent['status'] => {
    const status = rawStatus?.trim().toLowerCase() ?? '';

    if (['working', 'active', 'running', 'online', 'healthy'].includes(status)) {
        return 'WORKING';
    }

    if (['error', 'failed', 'offline', 'critical'].includes(status)) {
        return 'ERROR';
    }

    return 'IDLE';
};

const normalizeAgentHealth = (record: UnknownRecord): number => {
    const accuracy = readNumber(record.accuracy);

    if (accuracy != null) {
        return clampPercent(accuracy <= 1 ? accuracy * 100 : accuracy);
    }

    const efficiency =
        readNumber(record.efficiency) ??
        readNumber(record.health_index) ??
        readNumber(record.health) ??
        readNumber(record.score);

    if (efficiency == null) {
        return -1;
    }

    return clampPercent(efficiency <= 1 ? efficiency * 100 : efficiency);
};

const normalizeAgentAction = (record: UnknownRecord): string =>
    readString(record.lastAction) ??
    readString(record.last_action) ??
    readString(record.current_task) ??
    readString(record.currentStep) ??
    readString(record.description) ??
    'Немає підтвердженої дії';

export const normalizeAgents = (input: unknown): Agent[] => {
    const seen = new Set<string>();

    return extractRecords(input)
        .map((record) => {
            const id = readString(record.id) ?? readString(record.agent_id) ?? readString(record.name);
            const name = readString(record.name) ?? id;

            if (!id || !name) {
                return null;
            }

            if (seen.has(id)) {
                return null;
            }

            seen.add(id);

            return {
                id,
                name,
                clan: readString(record.clan) ?? readString(record.group) ?? readString(record.domain) ?? 'Н/д',
                type: readString(record.type) ?? readString(record.role) ?? readString(record.engine) ?? 'Н/д',
                status: normalizeAgentStatus(readString(record.status)),
                efficiency: normalizeAgentHealth(record),
                lastAction: normalizeAgentAction(record),
            };
        })
        .filter((agent): agent is Agent => agent !== null);
};

export const formatAgentHealth = (value: number): string =>
    value < 0 || !Number.isFinite(value) ? 'Н/д' : `${clampPercent(value)}%`;

export const getAgentHealthProgress = (value: number): number =>
    value < 0 || !Number.isFinite(value) ? 0 : clampPercent(value);

export const formatAgentStatus = (status: Agent['status']): string => {
    if (status === 'WORKING') {
        return 'У роботі';
    }

    if (status === 'ERROR') {
        return 'Помилка';
    }

    return 'Очікування';
};

export const normalizeAgentLogs = (input: unknown): string[] => {
    if (Array.isArray(input) && input.every((entry) => typeof entry === 'string')) {
        return input.filter((entry): entry is string => entry.trim().length > 0);
    }

    return extractRecords(input).map((record) => {
        const timestamp = formatTime(
            readString(record.timestamp) ??
            readString(record.ts) ??
            readString(record.created_at),
        );
        const service = toUpperToken(readString(record.service)) ?? 'SYSTEM';
        const level = toUpperToken(readString(record.level));
        const message =
            readString(record.message) ??
            readString(record.msg) ??
            'Подія без тексту';

        const levelBlock = level ? ` [${level}]` : '';
        return `[${timestamp}] [${service}]${levelBlock} ${message}`;
    });
};

export const buildResourceSnapshot = (stats: SystemStatsResponse | null): AgentResourceSnapshot => {
    const cpuPercent = stats ? readNumber(stats.cpu_percent) ?? readNumber(stats.cpu_usage) : null;
    const memoryPercent = stats ? readNumber(stats.memory_percent) ?? readNumber(stats.memory_usage) : null;
    const cpuCount = stats ? readNumber(stats.cpu_count) : null;
    const memoryTotal = stats ? readNumber(stats.memory_total) : null;

    return {
        cpuPercent: cpuPercent == null ? null : clampPercent(cpuPercent),
        memoryPercent: memoryPercent == null ? null : clampPercent(memoryPercent),
        cpuCapacityLabel: cpuCount == null ? 'Н/д' : `${Math.round(cpuCount)} ядер`,
        memoryCapacityLabel: formatBytes(memoryTotal),
        timestampLabel: formatDateTime(stats?.timestamp ?? null),
    };
};

export const appendResourcePoint = (
    history: AgentResourcePoint[],
    stats: SystemStatsResponse | null,
    limit: number = 20,
): AgentResourcePoint[] => {
    const snapshot = buildResourceSnapshot(stats);

    if (snapshot.cpuPercent == null && snapshot.memoryPercent == null) {
        return history;
    }

    return [
        ...history,
        {
            time: formatTime(stats?.timestamp ?? null),
            cpu: snapshot.cpuPercent ?? 0,
            mem: snapshot.memoryPercent ?? 0,
        },
    ].slice(-limit);
};

const normalizeAlertSeverity = (value?: string | null): DashboardAlert['severity'] => {
    const severity = value?.trim().toLowerCase() ?? '';

    if (['critical', 'high', 'error'].includes(severity)) {
        return 'critical';
    }

    if (['warning', 'warn', 'medium'].includes(severity)) {
        return 'warning';
    }

    return 'info';
};

export const normalizeFleetAlerts = (...sources: unknown[]): FleetAlertRecord[] => {
    const combined = sources.flatMap((source) => extractRecords(source));
    const seen = new Set<string>();

    return combined
        .map((record, index) => {
            const message =
                readString(record.summary) ??
                readString(record.message) ??
                readString(record.title);

            if (!message) {
                return null;
            }

            const timestamp =
                readString(record.timestamp) ??
                readString(record.created_at) ??
                readString(record.ts);
            const id =
                readString(record.id) ??
                `${message}-${timestamp ?? 'na'}-${index}`;
            const dedupeKey = `${id}-${message}`;

            if (seen.has(dedupeKey)) {
                return null;
            }

            seen.add(dedupeKey);

            const sourceLabel = [
                readString(record.company),
                readString(record.service),
                readString(record.source),
                readString(record.sector),
                readString(record.type),
            ].filter((value): value is string => value !== null).join(' • ');

            return {
                id,
                severity: normalizeAlertSeverity(readString(record.severity)),
                message,
                sourceLabel: sourceLabel || 'Без додаткового контексту',
                timestampLabel: formatDateTime(timestamp) ?? 'Н/д',
                sortTimestamp: timestamp ? new Date(timestamp).getTime() : Number.NEGATIVE_INFINITY,
            };
        })
        .filter(
            (
                alert,
            ): alert is FleetAlertRecord & {
                sortTimestamp: number;
            } => alert !== null,
        )
        .sort((left, right) => right.sortTimestamp - left.sortTimestamp)
        .map(({ sortTimestamp: _sortTimestamp, ...alert }) => alert);
};

const TOOL_COLORS: Record<string, string> = {
    sherlock: '#a855f7',
    amass: '#3b82f6',
    spiderfoot: '#10b981',
    theharvester: '#f59e0b',
    maigret: '#ef4444',
    maltego: '#06b6d4',
};

const resolveToolStatus = (value?: string | null): OsintToolStatus => {
    const status = value?.trim().toLowerCase() ?? '';

    if (['running', 'scan', 'scanning', 'pending', 'busy', 'сканує'].includes(status)) {
        return 'СКАНУЄ';
    }

    if (['online', 'ready', 'active', 'healthy', 'success', 'онлайн'].includes(status)) {
        return 'ОНЛАЙН';
    }

    return 'ОФЛАЙН';
};

const resolveToolIcon = (id: string, category: string): OsintToolIconKey => {
    const normalizedId = id.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedId.includes('sherlock') || normalizedCategory.includes('соц')) {
        return 'eye';
    }

    if (normalizedId.includes('amass') || normalizedCategory.includes('мереж')) {
        return 'globe';
    }

    if (normalizedId.includes('spiderfoot')) {
        return 'radar';
    }

    if (normalizedId.includes('harvester') || normalizedCategory.includes('розвід')) {
        return 'scan';
    }

    if (normalizedId.includes('maigret')) {
        return 'target';
    }

    if (normalizedId.includes('maltego') || normalizedCategory.includes('документ')) {
        return 'branch';
    }

    return 'terminal';
};

const resolveToolRoute = (id: string, category: string): string => {
    const normalizedId = id.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedId.includes('maltego') || normalizedId.includes('amass') || normalizedCategory.includes('мереж')) {
        return '/graph';
    }

    if (normalizedCategory.includes('документ')) {
        return '/documents';
    }

    if (normalizedCategory.includes('реєстр')) {
        return '/registries';
    }

    return '/search';
};

const resolveToolColor = (id: string, category: string): string => {
    if (TOOL_COLORS[id.toLowerCase()]) {
        return TOOL_COLORS[id.toLowerCase()];
    }

    const normalizedCategory = category.toLowerCase();

    if (normalizedCategory.includes('документ')) {
        return '#06b6d4';
    }

    if (normalizedCategory.includes('мереж')) {
        return '#3b82f6';
    }

    if (normalizedCategory.includes('соц')) {
        return '#a855f7';
    }

    if (normalizedCategory.includes('розвід')) {
        return '#10b981';
    }

    return '#94a3b8';
};

export const normalizeOsintTools = (input: unknown): FleetOsintToolRecord[] => {
    return extractRecords(input)
        .map((record) => {
            const id = readString(record.id) ?? readString(record.tool_id) ?? readString(record.name);
            const name = readString(record.name) ?? id;

            if (!id || !name) {
                return null;
            }

            const category = readString(record.category) ?? 'Без категорії';
            const lastScanRaw =
                readString(record.lastScan) ??
                readString(record.last_scan) ??
                readString(record.updated_at) ??
                readString(record.last_run);
            const findingsCount =
                readNumber(record.findings) ??
                readNumber(record.findings_count) ??
                readNumber(record.total_findings);

            return {
                id,
                name,
                category,
                status: resolveToolStatus(readString(record.status)),
                findingsCount,
                findingsLabel: formatCount(findingsCount),
                lastScanLabel: formatDateTime(lastScanRaw) ?? lastScanRaw ?? 'Немає підтвердженого запуску',
                description: readString(record.description),
                color: resolveToolColor(id, category),
                iconKey: resolveToolIcon(id, category),
                route: resolveToolRoute(id, category),
            };
        })
        .filter((tool): tool is FleetOsintToolRecord => tool !== null);
};

export const buildOsintSummary = (tools: FleetOsintToolRecord[]): FleetOsintSummary => {
    const onlineTools = tools.filter((tool) => tool.status !== 'ОФЛАЙН').length;
    const activeScans = tools.filter((tool) => tool.status === 'СКАНУЄ').length;
    const findingsValues = tools
        .map((tool) => tool.findingsCount)
        .filter((value): value is number => value != null && Number.isFinite(value));
    const totalFindings = findingsValues.reduce((sum, value) => sum + value, 0);
    const coverageLabel =
        tools.length === 0
            ? 'Н/д'
            : `${Math.round((onlineTools / tools.length) * 100)}%`;

    return {
        totalTools: tools.length,
        onlineTools,
        activeScans,
        totalFindingsLabel: findingsValues.length > 0 ? formatCount(totalFindings) : 'Н/д',
        coverageLabel,
    };
};
