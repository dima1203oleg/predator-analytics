import { apiClient, v45Client } from '@/services/api/config';
import { CompanyProfileResponse, RiskEntity } from '../types/index';

/**
 * API для роботи з перевіркою контрагентів (Due Diligence).
 * Синхронізовано з v55.2-SM-EXTENDED Core API (/companies, /risk).
 */
export const diligenceApi = {
    /**
     * Отримати розширений профіль компанії за UEID або EDRPOU.
     */
    getCompanyProfile: async (identifier: string): Promise<CompanyProfileResponse> => {
        const response = await apiClient.get<CompanyProfileResponse>(`/companies/${identifier}`);
        return response.data;
    },

    /**
     * Пошук компаній з фільтрацією по ризику (v55.2).
     */
    searchCompanies: async (params: { query?: string, risk_level?: string, page?: number } = {}) => {
        const response = await apiClient.get('/companies/', { params });
        return response.data;
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
    }
};
