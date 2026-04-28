/**
 * Типи даних для ринкової аналітики (Market) — PREDATOR Analytics v4.1.
 */

export interface MarketOverviewResponse {
    total_declarations: number;
    total_value_usd: number;
    total_companies: number;
    top_products: TopProduct[];
    top_countries: TopCountry[];
    period: string;
}

export interface TopCountry {
    code: string;
    name: string;
    value_usd: number;
    declaration_count: number;
}

export interface TopProduct {
    code: string;
    name: string;
    value_usd: number;
    change_percent: number;
}

export interface DeclarationResponse {
    id: string;
    declaration_number: string;
    declaration_date: string;
    company_name: string;
    company_edrpou: string;
    product_code: string;
    product_name: string;
    country_code: string;
    weight_kg: number;
    value_usd: number;
    anomaly_score?: number;
}

export interface DeclarationsListResponse {
    items: DeclarationResponse[];
    total: number;
    page: number;
    limit: number;
}

export interface DeclarationFilter {
    product_code?: string;
    company_edrpou?: string;
    country_code?: string;
    date_from?: string;
    date_to?: string;
    value_min?: number;
    value_max?: number;
    has_anomaly?: boolean;
}
