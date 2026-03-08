import { apiClient, v45Client } from '@/services/api/config';
import { CompanyProfileResponse, RiskEntity } from '../types/index';

/**
 * API для роботи з перевіркою контрагентів (Due Diligence).
 * Базується на канонічних ендпоінтах v1/diligence.
 */
export const diligenceApi = {
    /**
     * Отримати повний профіль компанії.
     */
    getCompanyProfile: async (edrpou: string): Promise<CompanyProfileResponse> => {
        const response = await apiClient.get<CompanyProfileResponse>(`/diligence/company/${edrpou}`);
        return response.data;
    },

    /**
     * Отримати список ризикових об'єктів (компаній).
     */
    getRiskEntities: async (): Promise<RiskEntity[]> => {
        const response = await apiClient.get<RiskEntity[]>('/diligence/risk-entities');
        return response.data;
    }
};
