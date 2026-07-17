type UnknownRecord = Record<string, unknown>;

export interface Tender {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  procuringEntity: string;
  date: string;
  risk_score?: number;
  category?: string;
  bids_count?: number;
}

export interface Analytics {
  total_value: number;
  avg_risk: number;
  critical_tenders: number;
  categories: { name: string; value: number; color: string }[];
  trends: { date: string; value: number }[];
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

const normalizeTenderRecord = (value: unknown): Tender | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const title = readString(value.title);
  const amount = readNumber(value.value);
  const date = readString(value.date);

  if (!id || !title || amount == null || !date) {
    return null;
  }

  return {
    id,
    title,
    value: amount,
    currency: readString(value.currency) ?? 'UAH',
    status: readString(value.status) ?? 'Н/д',
    procuringEntity: readString(value.procuringEntity) ?? readString(value.procuring_entity) ?? 'Н/д',
    date,
    risk_score: readNumber(value.risk_score) ?? undefined,
    category: readString(value.category) ?? undefined,
    bids_count: readNumber(value.bids_count) ?? undefined,
  };
};

export const normalizeTendersPayload = (payload: unknown): Tender[] => {
  const rawItems =
    Array.isArray(payload)
      ? payload
      : isRecord(payload)
        ? (
            (Array.isArray(payload.tenders) ? payload.tenders : null) ??
            (Array.isArray(payload.items) ? payload.items : null) ??
            []
          )
        : [];

  return rawItems.map(normalizeTenderRecord).filter((item): item is Tender => item !== null);
};

export const normalizeTenderAnalytics = (payload: unknown): Analytics | null => {
  const raw = isRecord(payload) && isRecord(payload.analytics)
    ? payload.analytics
    : isRecord(payload)
      ? payload
      : null;

  if (!raw) {
    return null;
  }

  const totalValue = readNumber(raw.total_value);
  const avgRisk = readNumber(raw.avg_risk);
  const criticalTenders = readNumber(raw.critical_tenders);

  if (totalValue == null || avgRisk == null || criticalTenders == null) {
    return null;
  }

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter(isRecord)
        .map((item) => ({
          name: readString(item.name) ?? 'Н/д',
          value: readNumber(item.value) ?? 0,
          color: readString(item.color) ?? '#64748b',
        }))
    : [];

  const trends = Array.isArray(raw.trends)
    ? raw.trends
        .filter(isRecord)
        .map((item) => ({
          date: readString(item.date) ?? 'Н/д',
          value: readNumber(item.value) ?? 0,
        }))
    : [];

  return {
    total_value: totalValue,
    avg_risk: avgRisk,
    critical_tenders: criticalTenders,
    categories,
    trends,
  };
};
