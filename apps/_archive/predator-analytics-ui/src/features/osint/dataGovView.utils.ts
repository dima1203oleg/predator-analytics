type UnknownRecord = Record<string, unknown>;

export interface Resource {
    id: string;
    name: string;
    format: string;
    url: string;
    lastModified: string;
    sizeLabel: string;
}

export interface Dataset {
    id: string;
    title: string;
    notes: string;
    organizationTitle: string;
    metadataModified: string;
    resources: Resource[];
    tags: string[];
    recordsCount: number | null;
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

const formatNumericSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${bytes} B`;
};

export const formatResourceSize = (value: unknown): string => {
    const numericValue = readNumber(value);
    if (numericValue != null) {
        return formatNumericSize(numericValue);
    }

    const textValue = readString(value);
    if (!textValue || textValue === '—') {
        return 'Н/д';
    }

    return textValue;
};

const normalizeResource = (value: unknown): Resource | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = readString(value.id);
    const format = readString(value.format);
    const url = readString(value.url);

    if (!id || !format || !url) {
        return null;
    }

    return {
        id,
        name: readString(value.name) ?? 'ресурс без назви',
        format,
        url,
        lastModified: readString(value.last_modified) ?? readString(value.modified) ?? 'Н/д',
        sizeLabel: formatResourceSize(value.size),
    };
};

const normalizeOrganizationTitle = (value: unknown): string => {
    if (isRecord(value)) {
        return readString(value.title) ?? 'Н/д';
    }

    return readString(value) ?? 'Н/д';
};

const normalizeDataset = (value: unknown): Dataset | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = readString(value.id);
    const title = readString(value.title) ?? readString(value.name);

    if (!id || !title) {
        return null;
    }

    const resources = Array.isArray(value.resources)
        ? value.resources.map(normalizeResource).filter((item): item is Resource => item !== null)
        : [];

    const tags = Array.isArray(value.tags)
        ? value.tags.map(readString).filter((item): item is string => item !== null)
        : [];

    return {
        id,
        title,
        notes: readString(value.notes) ?? readString(value.description) ?? '',
        organizationTitle: normalizeOrganizationTitle(value.organization),
        metadataModified: readString(value.metadata_modified) ?? readString(value.modified) ?? readString(value.created) ?? 'Н/д',
        resources,
        tags,
        recordsCount: readNumber(value.records_count),
    };
};

export const normalizeDataGovSearchPayload = (payload: unknown): { datasets: Dataset[]; totalCount: number } => {
    const root = isRecord(payload) ? payload : {};
    const rawItems = Array.isArray(root.results)
        ? root.results
        : Array.isArray(root.items)
            ? root.items
            : [];

    const datasets = rawItems.map(normalizeDataset).filter((item): item is Dataset => item !== null);

    return {
        datasets,
        totalCount: readNumber(root.count) ?? datasets.length,
    };
};
