type UnknownRecord = Record<string, unknown>;

export interface Vessel {
    id: string;
    name: string;
    flag: string;
    type: string;
    location: { lat: number; lon: number };
    status: string;
    destination: string;
    risk_score: number;
    speed?: number;
    heading?: number;
    imo?: string;
    mmsi?: string;
    draught?: number;
    last_seen?: string;
}

export interface Port {
    id: string;
    name: string;
    country: string;
    location: { lat: number; lon: number };
    vessel_count: number;
    capacity: number;
    risk_level: string;
    status?: string;
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

const readLocation = (value: unknown): { lat: number; lon: number } | null => {
    if (!isRecord(value)) {
        return null;
    }

    const lat = readNumber(value.lat);
    const lon = readNumber(value.lon);

    if (lat == null || lon == null) {
        return null;
    }

    return { lat, lon };
};

const toItemsArray = (payload: unknown, explicitKey: 'vessels' | 'ports'): unknown[] => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!isRecord(payload)) {
        return [];
    }

    if (Array.isArray(payload[explicitKey])) {
        return payload[explicitKey];
    }

    if (Array.isArray(payload.items)) {
        return payload.items;
    }

    return [];
};

const normalizeVesselRecord = (value: unknown): Vessel | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = readString(value.id);
    const name = readString(value.name);
    const location = readLocation(value.location);
    const riskScore = readNumber(value.risk_score);

    if (!id || !name || !location || riskScore == null) {
        return null;
    }

    return {
        id,
        name,
        flag: readString(value.flag) ?? 'Н/д',
        type: readString(value.type) ?? 'Н/д',
        location,
        status: readString(value.status) ?? 'Н/д',
        destination: readString(value.destination) ?? 'Н/д',
        risk_score: riskScore,
        speed: readNumber(value.speed) ?? undefined,
        heading: readNumber(value.heading) ?? undefined,
        imo: readString(value.imo) ?? undefined,
        mmsi: readString(value.mmsi) ?? undefined,
        draught: readNumber(value.draught) ?? undefined,
        last_seen: readString(value.last_seen) ?? undefined,
    };
};

const normalizePortRecord = (value: unknown): Port | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = readString(value.id);
    const name = readString(value.name);
    const country = readString(value.country);
    const location = readLocation(value.location);
    const vesselCount = readNumber(value.vessel_count);
    const capacity = readNumber(value.capacity);
    const riskLevel = readString(value.risk_level);

    if (!id || !name || !country || !location || vesselCount == null || capacity == null || !riskLevel) {
        return null;
    }

    return {
        id,
        name,
        country,
        location,
        vessel_count: vesselCount,
        capacity,
        risk_level: riskLevel,
        status: readString(value.status) ?? undefined,
    };
};

export const normalizeVesselsPayload = (payload: unknown): Vessel[] =>
    toItemsArray(payload, 'vessels')
        .map(normalizeVesselRecord)
        .filter((item): item is Vessel => item !== null);

export const normalizePortsPayload = (payload: unknown): Port[] =>
    toItemsArray(payload, 'ports')
        .map(normalizePortRecord)
        .filter((item): item is Port => item !== null);
