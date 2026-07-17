/**
 * Типи даних для перевірки контрагентів (Due Diligence) — PREDATOR Analytics v4.1.
 */

import { RiskEntity, RiskLevelValue } from '@/types/intelligence';

export type { RiskEntity, RiskLevelValue };

export interface PersonInfo {
    id?: string;
    name: string;
    role?: string;
    position?: string;
    is_pep?: boolean;
    is_sanctioned?: boolean;
    risk_level?: RiskLevelValue;
    label?: string;
    properties?: Record<string, any>;
}

export interface RiskDetails {
    factors?: string[];
    description?: string;
    aml_score?: number;
    kyc_score?: number;
    institutional?: { value: number };
    structural?: { value: number };
    behavioral?: { value: number };
    influence?: { value: number };
    predictive?: { value: number };
}

export interface SanctionRecord {
    id?: string;
    list_name: string;
    date?: string;
    date_added?: string;
    reason?: string;
}

export interface AnomalyRecord {
    id?: string;
    type: string;
    description: string;
    detected_at: string;
    date_detected?: string;
    score?: number;
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
