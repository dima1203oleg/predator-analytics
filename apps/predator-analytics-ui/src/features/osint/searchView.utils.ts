export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CompanyStatus = 'active' | 'bankrupt' | 'process' | 'unknown';
export type SearchMode = 'neural' | 'exact' | 'deep';

export interface Company {
    id: string;
    identifier: string;
    edrpou?: string;
    name: string;
    status: CompanyStatus;
    statusLabel: string;
    risk: RiskLevel;
    riskLabel: string;
    riskScore: number;
    director?: string;
    address?: string;
    capital?: string;
    capitalAmount?: number | null;
    type?: string;
    tags: string[];
    beneficiaries: string[];
    connections?: number | null;
    explanation?: unknown;
    source?: string;
    updatedAt?: string;
    matchScore?: number | null;
    completenessScore: number;
}

const pickFirstString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
};

const toNumber = (...values: unknown[]): number | null => {
    for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = Number(value.replace(/[^\d.-]/g, ''));
            if (Number.isFinite(normalized)) {
                return normalized;
            }
        }
    }

    return null;
};

const toStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(/[,\n;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

export const formatDateTime = (value?: string): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatCapital = (value: unknown): { label?: string; amount: number | null } => {
    const amount = toNumber(value);

    if (typeof value === 'string' && value.trim()) {
        return { label: value.trim(), amount };
    }

    if (amount === null) {
        return { label: undefined, amount: null };
    }

    return {
        label: `${new Intl.NumberFormat('uk-UA').format(amount)} грн`,
        amount,
    };
};

const normalizeStatus = (value?: string): { value: CompanyStatus; label: string } => {
    switch (value?.toLowerCase()) {
        case 'active':
        case 'діюча':
            return { value: 'active', label: 'Діюча' };
        case 'bankrupt':
        case 'банкрут':
            return { value: 'bankrupt', label: 'Банкрутство' };
        case 'process':
        case 'suspended':
        case 'pending':
        case 'в процесі':
            return { value: 'process', label: 'В процесі припинення' };
        default:
            return { value: 'unknown', label: 'Невідомо' };
    }
};

const normalizeRisk = (value?: string, score?: number | null): { level: RiskLevel; label: string; score: number } => {
    const raw = value?.toLowerCase();

    if (raw === 'critical') {
        return { level: 'critical', label: 'Критичний', score: Math.max(score ?? 95, 95) };
    }

    if (raw === 'high' || raw === 'high_alert') {
        return { level: 'high', label: 'Високий', score: Math.max(score ?? 80, 75) };
    }

    if (raw === 'elevated') {
        return { level: 'high', label: 'Підвищений', score: Math.max(score ?? 72, 70) };
    }

    if (raw === 'watchlist') {
        return { level: 'medium', label: 'Під наглядом', score: Math.max(score ?? 55, 50) };
    }

    if (raw === 'medium') {
        return { level: 'medium', label: 'Середній', score: Math.max(score ?? 50, 45) };
    }

    if (raw === 'stable') {
        return { level: 'low', label: 'Стабільний', score: score ?? 20 };
    }

    if (raw === 'low') {
        return { level: 'low', label: 'Низький', score: score ?? 15 };
    }

    if (typeof score === 'number') {
        if (score >= 85) {
            return { level: 'critical', label: 'Критичний', score };
        }
        if (score >= 65) {
            return { level: 'high', label: 'Високий', score };
        }
        if (score >= 40) {
            return { level: 'medium', label: 'Середній', score };
        }
    }

    return { level: 'low', label: 'Невизначений', score: score ?? 0 };
};

const normalizeMatchScore = (value: unknown): number | null => {
    const score = toNumber(value);
    if (score === null) {
        return null;
    }

    return score <= 1 ? Math.round(score * 100) : Math.round(score);
};

const buildCompanyTags = (record: Record<string, unknown>, metadata: Record<string, unknown>): string[] => {
    return Array.from(
        new Set(
            [
                pickFirstString(record.category, metadata.category),
                pickFirstString(record.source, metadata.source),
                pickFirstString(record.industry, metadata.industry),
                pickFirstString(record.type, metadata.type),
            ].filter(Boolean) as string[],
        ),
    );
};

export const normalizeCompany = (raw: unknown, index: number): Company => {
    const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const metadata = (record.metadata && typeof record.metadata === 'object'
        ? record.metadata
        : {}) as Record<string, unknown>;

    const identifier = pickFirstString(
        record.ueid,
        record.edrpou,
        metadata.ueid,
        metadata.edrpou,
        record.id,
    ) || `entity-${index + 1}`;

    const capital = formatCapital(
        pickFirstString(record.capital, metadata.capital) ?? toNumber(record.capital, metadata.capital),
    );
    const beneficiaries = toStringList(record.beneficiaries).length
        ? toStringList(record.beneficiaries)
        : toStringList(metadata.beneficiaries);
    const connections = toNumber(record.connections_count, metadata.connections_count, record.connections, metadata.connections);
    const status = normalizeStatus(pickFirstString(record.status, metadata.status));
    const riskScore = toNumber(record.risk_score, metadata.risk_score);
    const risk = normalizeRisk(
        pickFirstString(record.risk_level, metadata.risk_level, record.riskLevel, metadata.riskLevel),
        riskScore,
    );

    const completenessFields = [
        identifier,
        pickFirstString(record.name, record.title, metadata.name, metadata.company_name),
        status.label,
        pickFirstString(record.director, metadata.director),
        pickFirstString(record.address, metadata.address),
        capital.label,
        beneficiaries.length ? 'beneficiaries' : '',
        pickFirstString(record.source, metadata.source),
    ];

    const completenessScore = Math.round(
        (completenessFields.filter(Boolean).length / completenessFields.length) * 100,
    );

    return {
        id: pickFirstString(record.id, identifier) || identifier,
        identifier,
        edrpou: pickFirstString(record.edrpou, metadata.edrpou, record.ueid, metadata.ueid),
        name: pickFirstString(record.name, record.title, metadata.name, metadata.company_name) || 'Невідома сутність',
        status: status.value,
        statusLabel: status.label,
        risk: risk.level,
        riskLabel: risk.label,
        riskScore: risk.score,
        director: pickFirstString(record.director, metadata.director),
        address: pickFirstString(record.address, metadata.address),
        capital: capital.label,
        capitalAmount: capital.amount,
        type: pickFirstString(record.type, metadata.type, record.legal_form, metadata.legal_form),
        tags: buildCompanyTags(record, metadata),
        beneficiaries,
        connections,
        explanation: record.explanation ?? metadata.explanation,
        source: pickFirstString(record.source, metadata.source, record.registry, metadata.registry),
        updatedAt: pickFirstString(record.updated_at, metadata.updated_at, record.created_at),
        matchScore: normalizeMatchScore(record.score ?? metadata.score ?? record.match_score ?? metadata.match_score),
        completenessScore,
    };
};

export const getRiskPriority = (level: RiskLevel): 'critical' | 'high' | 'medium' => {
    if (level === 'critical') {
        return 'critical';
    }

    if (level === 'high') {
        return 'high';
    }

    return 'medium';
};

export const getRadarMetrics = (company: Company) => ({
    risk: company.riskScore,
    connections: company.connections ? Math.min(company.connections * 10, 100) : 0,
    capital: company.capitalAmount ? Math.min(Math.round(Math.log10(company.capitalAmount + 1) * 18), 100) : 0,
    reputation:
        company.status === 'active' ? 80 : company.status === 'process' ? 45 : company.status === 'bankrupt' ? 20 : 30,
    transparency: company.completenessScore,
});

export const buildDecisionSummary = (company: Company): string => {
    if (company.risk === 'critical' || company.risk === 'high') {
        return 'Сутність потребує поглибленої перевірки перед подальшими діями.';
    }

    if (company.risk === 'medium') {
        return 'Сутність має змішані сигнали й потребує додаткової верифікації джерел.';
    }

    return 'У поточній видачі не виявлено критичних ознак, але рішення варто звірити з досьє.';
};
