type UnknownRecord = Record<string, unknown>;

export interface SupplyChainStatItem {
    label: string;
    value: string;
    sub: string;
    iconKey: string | null;
    color: string | null;
}

export interface SupplyChainTrackingEvent {
    id: string;
    timestamp: string;
    location: string;
    status: string;
    description: string;
    riskScore: number | null;
    country: string | null;
    valueUsd: number | null;
}

export interface SupplyChainTrackingSnapshot {
    trackingId: string | null;
    currentStatus: string | null;
    estimatedArrival: string | null;
    generatedAt: string | null;
    events: SupplyChainTrackingEvent[];
}

export interface SupplyChainRoute {
    id: string;
    origin: string;
    destination: string;
    via: string | null;
    riskScore: number | null;
    totalValueUsd: number | null;
    transitTimeDays: number | null;
    costPerKg: number | null;
    reliability: number | null;
    recommendation: string | null;
}

export interface SupplyChainRoutesSnapshot {
    generatedAt: string | null;
    routes: SupplyChainRoute[];
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

const readTimestamp = (value: unknown): string | null => {
    const timestamp = readString(value);
    if (!timestamp) {
        return null;
    }

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
};

const toArray = (value: unknown, key: string): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (isRecord(value) && Array.isArray(value[key])) {
        return value[key];
    }

    return [];
};

const normalizeStatItem = (value: unknown): SupplyChainStatItem | null => {
    if (!isRecord(value)) {
        return null;
    }

    const label = readString(value.label);
    const resolvedValue = readString(value.value);

    if (!label || !resolvedValue) {
        return null;
    }

    return {
        label,
        value: resolvedValue,
        sub: readString(value.sub) ?? 'Н/д',
        iconKey: readString(value.icon),
        color: readString(value.color),
    };
};

const normalizeTrackingEvent = (value: unknown, index: number): SupplyChainTrackingEvent | null => {
    if (!isRecord(value)) {
        return null;
    }

    const timestamp = readTimestamp(value.timestamp);
    const location = readString(value.location);
    const status = readString(value.status);
    const description = readString(value.description);

    if (!location || !status || !description) {
        return null;
    }

    return {
        id: readString(value.id) ?? `tracking-event-${index + 1}`,
        timestamp: timestamp ?? new Date(0).toISOString(),
        location,
        status,
        description,
        riskScore: readNumber(value.risk_score),
        country: readString(value.country),
        valueUsd: readNumber(value.value_usd),
    };
};

const normalizeRoute = (value: unknown, index: number): SupplyChainRoute | null => {
    if (!isRecord(value)) {
        return null;
    }

    const origin = readString(value.origin);
    const destination = readString(value.destination);

    if (!origin || !destination) {
        return null;
    }

    return {
        id: readString(value.id) ?? `route-${index + 1}`,
        origin,
        destination,
        via: readString(value.via),
        riskScore: readNumber(value.risk_score),
        totalValueUsd: readNumber(value.total_value_usd),
        transitTimeDays: readNumber(value.transit_time_days),
        costPerKg: readNumber(value.cost_per_kg),
        reliability: readNumber(value.reliability),
        recommendation: readString(value.ai_recommendation),
    };
};

export const normalizeSupplyChainStatsPayload = (payload: unknown): { generatedAt: string | null; items: SupplyChainStatItem[] } => ({
    generatedAt: isRecord(payload) ? readTimestamp(payload.generated_at) : null,
    items: toArray(payload, 'globalStats')
        .map(normalizeStatItem)
        .filter((item): item is SupplyChainStatItem => item !== null),
});

export const normalizeSupplyChainTrackingPayload = (payload: unknown): SupplyChainTrackingSnapshot => ({
    trackingId: isRecord(payload) ? readString(payload.tracking_id) : null,
    currentStatus: isRecord(payload) ? readString(payload.current_status) : null,
    estimatedArrival: isRecord(payload) ? readTimestamp(payload.estimated_arrival) : null,
    generatedAt: isRecord(payload) ? readTimestamp(payload.generated_at) : null,
    events: toArray(payload, 'events')
        .map(normalizeTrackingEvent)
        .filter((item): item is SupplyChainTrackingEvent => item !== null),
});

export const normalizeSupplyChainRoutesPayload = (payload: unknown): SupplyChainRoutesSnapshot => ({
    generatedAt: isRecord(payload) ? readTimestamp(payload.generated_at) : null,
    routes: toArray(payload, 'routes')
        .map(normalizeRoute)
        .filter((item): item is SupplyChainRoute => item !== null),
});

export const getLatestSupplyChainTimestamp = (...values: Array<string | null | undefined>): string | null => {
    const timestamps = values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => new Date(value))
        .filter((value) => !Number.isNaN(value.getTime()))
        .sort((left, right) => right.getTime() - left.getTime());

    return timestamps.length > 0 ? timestamps[0].toISOString() : null;
};
