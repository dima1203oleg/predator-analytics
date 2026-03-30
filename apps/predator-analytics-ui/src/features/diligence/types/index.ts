/**
 * Типи даних для перевірки контрагентів (Due Diligence) — PREDATOR Analytics v4.1.
 */

export type RiskLevelValue =
    | 'stable'
    | 'watchlist'
    | 'elevated'
    | 'high'
    | 'critical'
    | 'low'
    | 'medium';

export interface PersonInfo {
    id: string;
    type: string;
    label: string;
    properties: Record<string, unknown>;
}

export interface SanctionRecord {
    list_name: string;
    date_added: string;
    reason: string;
    is_active: boolean;
}

export interface AnomalyRecord {
    type: string;
    score: number;
    description: string;
    date_detected: string;
}

export interface RiskComponentDetail {
    value: number;
    weight: number;
}

export interface RiskDetails {
    behavioral: RiskComponentDetail;
    institutional: RiskComponentDetail;
    influence: RiskComponentDetail;
    structural: RiskComponentDetail;
    predictive: RiskComponentDetail;
}

export interface RiskEntity {
    ueid?: string;
    edrpou: string;
    name: string;
    risk_score: number;
    risk_level: RiskLevelValue;
    last_updated?: string;
    created_at?: string;
    updated_at?: string;
    status?: string;
    sector?: string | null;
    cers_confidence?: number;
}

export interface CompanyProfileResponse {
    ueid?: string;
    edrpou?: string | null;
    name: string;
    status: string;
    sector?: string | null;
    registration_date?: string;
    created_at?: string;
    updated_at?: string;
    risk_score: number;
    risk_level?: RiskLevelValue;
    cers_confidence?: number;
    risk_details?: RiskDetails | null;
    interpretation?: string | null;
    sanctions?: SanctionRecord[];
    anomalies?: AnomalyRecord[];
    directors?: PersonInfo[];
    owners?: PersonInfo[];
    ultimate_beneficiaries?: PersonInfo[];
    related_companies?: Array<Record<string, unknown>>;
    events?: Array<Record<string, unknown>>;
    has_offshores?: boolean;
    is_debtor?: boolean;
    is_sanctioned?: boolean;
    ai_summary?: string;
    kved?: string;
}
