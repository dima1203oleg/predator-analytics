/**
 * Типи даних для перевірки контрагентів (Due Diligence) — PREDATOR Analytics v4.1.
 */

export interface PersonInfo {
    id: string;
    type: string;
    label: string;
    properties: Record<string, any>;
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

export interface CompanyProfileResponse {
    edrpou: string;
    name: string;
    status: string;
    registration_date?: string;
    risk_score: number;
    sanctions: SanctionRecord[];
    anomalies: AnomalyRecord[];
    directors: PersonInfo[];
    owners: PersonInfo[];
    ultimate_beneficiaries: PersonInfo[];
    related_companies: any[];
}
