import { apiClient } from '@/services/api/config';
import { CompanyProfileResponse, RiskEntity } from '../types/index';

type CompanySearchParams = {
    query?: string;
    search?: string;
    risk_level?: string;
    page?: number;
    limit?: number;
    offset?: number;
};

type CompanySearchResponse = {
    data?: RiskEntity[];
    items?: RiskEntity[];
    results?: RiskEntity[];
    meta?: Record<string, unknown>;
};

const normalizeSearchParams = (params: CompanySearchParams | string): Record<string, string | number> => {
    if (typeof params === 'string') {
        return { search: params, limit: 25, offset: 0 };
    }

    const limit = params.limit ?? 25;
    const offset = params.offset ?? (params.page ? Math.max(0, params.page - 1) * limit : 0);

    return {
        ...(params.search ? { search: params.search } : {}),
        ...(params.query ? { search: params.query } : {}),
        ...(params.risk_level ? { risk_level: params.risk_level } : {}),
        limit,
        offset,
    };
};

const extractRiskEntities = (payload: unknown): RiskEntity[] => {
    if (Array.isArray(payload)) {
        return payload as RiskEntity[];
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const record = payload as CompanySearchResponse;

    if (Array.isArray(record.data)) {
        return record.data;
    }

    if (Array.isArray(record.items)) {
        return record.items;
    }

    if (Array.isArray(record.results)) {
        return record.results;
    }

    return [];
};

/**
 * API для роботи з перевіркою контрагентів (Due Diligence).
 * Синхронізовано з v57.2-WRAITH-SM-EXTENDED Core API (/companies, /risk).
 */
export const diligenceApi = {
    /**
     * Отримати розширений профіль компанії за UEID або EDRPOU.
     */
    getCompanyProfile: async (identifier: string): Promise<CompanyProfileResponse> => {
        try {
            const response = await apiClient.get<CompanyProfileResponse>(`/companies/${identifier}`);
            return response.data;
        } catch (error) {
            if (!/^\d{8,10}$/.test(identifier)) {
                throw error;
            }

            const companies = await diligenceApi.searchCompanies({ query: identifier, limit: 1 });
            const firstMatch = extractRiskEntities(companies)[0];
            const fallbackIdentifier = firstMatch?.ueid ?? firstMatch?.edrpou;

            if (!fallbackIdentifier || fallbackIdentifier === identifier) {
                throw error;
            }

            const fallbackResponse = await apiClient.get<CompanyProfileResponse>(`/companies/${fallbackIdentifier}`);
            return fallbackResponse.data;
        }
    },

    /**
     * Пошук компаній з фільтрацією по ризику (v57.2-WRAITH).
     */
    searchCompanies: async (params: CompanySearchParams | string = {}): Promise<CompanySearchResponse | RiskEntity[]> => {
        const response = await apiClient.get('/companies', { params: normalizeSearchParams(params) });
        const payload = response.data as CompanySearchResponse | RiskEntity[];

        if (Array.isArray(payload)) {
            return payload;
        }

        const items = extractRiskEntities(payload);

        return {
            ...payload,
            data: Array.isArray(payload.data) ? payload.data : items,
            items,
            results: items,
        };
    },

    /**
     * Отримати детальний 5-шаровий CERS скоринг.
     */
    getRiskScores: async (ueids: string[]): Promise<any> => {
        const response = await apiClient.get<any>(`/risk/score`, {
            params: { entities: ueids.join(',') }
        });
        return response.data;
    },

    /**
     * Отримати експертний висновок (Sovereign Advisor).
     */
    getExpertReport: async (ueid: string): Promise<any> => {
        const response = await apiClient.get<any>(`/intelligence/report/${ueid}`);
        return response.data;
    },

    /**
     * Аліас для отримання ризикових сутностей (для сумісності).
     */
    getRiskEntities: async (): Promise<RiskEntity[]> => {
        const payload = await diligenceApi.searchCompanies({ limit: 50 });
        return extractRiskEntities(payload);
    }
};
