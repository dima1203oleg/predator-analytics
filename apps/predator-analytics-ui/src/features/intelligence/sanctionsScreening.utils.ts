type UnknownRecord = Record<string, unknown>;

export type SanctionSeverity = 'high' | 'medium' | 'low' | 'none';
export type EntityType = 'company' | 'person' | 'vessel';
export type ScreenStatus = 'clean' | 'warning' | 'blocked';

export interface SanctionMatch {
    id: string;
    list: string;
    program: string;
    target: string;
    details: string;
    severity: SanctionSeverity;
    score: number;
    dateAdded?: string;
    allLists: string[];
}

export interface ScreeningResult {
    id: string;
    entityName: string;
    entityType: EntityType;
    status: ScreenStatus;
    timestamp: string;
    matches: SanctionMatch[];
    searchId: string;
    riskScore?: number;
    listsChecked: string[];
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

const normalizeEntityType = (value: unknown, fallback: EntityType): EntityType => {
    const normalized = readString(value)?.toLowerCase();

    if (normalized === 'company' || normalized === 'person' || normalized === 'vessel') {
        return normalized;
    }

    return fallback;
};

const normalizeStatus = (value: unknown, hasMatches: boolean): ScreenStatus => {
    const normalized = readString(value)?.toLowerCase();

    if (normalized === 'clean' || normalized === 'warning' || normalized === 'blocked') {
        return normalized;
    }

    return hasMatches ? 'warning' : 'clean';
};

const normalizeSeverity = (value: unknown, score: number | null): SanctionSeverity => {
    const normalized = readString(value)?.toLowerCase();

    if (normalized === 'high' || normalized === 'medium' || normalized === 'low' || normalized === 'none') {
        return normalized;
    }

    if (score == null || score <= 0) {
        return 'none';
    }

    if (score >= 80) {
        return 'high';
    }

    if (score >= 50) {
        return 'medium';
    }

    return 'low';
};

const normalizeStringArray = (value: unknown): string[] =>
    Array.isArray(value)
        ? value
            .map(readString)
            .filter((item): item is string => item !== null)
        : [];

const normalizeMatch = (value: unknown, index: number): SanctionMatch | null => {
    if (!isRecord(value)) {
        return null;
    }

    const score = readNumber(value.score) ?? 0;
    const target = readString(value.target) ?? readString(value.name);
    const list = readString(value.list) ?? 'Н/д';

    if (!target) {
        return null;
    }

    const allLists = normalizeStringArray(value.allLists);

    return {
        id: readString(value.id) ?? `sanction-match-${index + 1}`,
        list,
        program: readString(value.program) ?? 'Н/д',
        target,
        details: readString(value.details) ?? 'Немає деталізації збігу',
        severity: normalizeSeverity(value.severity, score),
        score,
        dateAdded: readString(value.dateAdded) ?? undefined,
        allLists,
    };
};

const getTimestamp = (value: unknown): string => {
    const timestamp = readString(value);
    if (!timestamp) {
        return new Date(0).toISOString();
    }

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
        return new Date(0).toISOString();
    }

    return parsed.toISOString();
};

export const normalizeSanctionsScreeningPayload = (
    payload: unknown,
    fallbackEntityType: EntityType = 'company',
): ScreeningResult | null => {
    if (!isRecord(payload)) {
        return null;
    }

    const entityName = readString(payload.entityName) ?? readString(payload.query);
    const matches = Array.isArray(payload.matches)
        ? payload.matches.map(normalizeMatch).filter((item): item is SanctionMatch => item !== null)
        : [];

    if (!entityName) {
        return null;
    }

    const riskScore = readNumber(payload.riskScore);

    return {
        id: readString(payload.id) ?? `screening-${entityName.toLowerCase()}`,
        entityName,
        entityType: normalizeEntityType(payload.entityType, fallbackEntityType),
        status: normalizeStatus(payload.status, matches.length > 0),
        timestamp: getTimestamp(payload.timestamp),
        matches,
        searchId: readString(payload.searchId) ?? 'Н/д',
        riskScore: riskScore != null ? Math.max(0, Math.min(100, Math.round(riskScore))) : undefined,
        listsChecked: normalizeStringArray(payload.listsChecked),
    };
};
