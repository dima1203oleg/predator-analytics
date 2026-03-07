import { apiClient } from '@/services/api/config';
import { CompanyProfileResponse } from '../types/index';

/**
 * API для роботи з перевіркою контрагентів (Due Diligence).
 * Базується на канонічних ендпоінтах v1/diligence.
 */
export const diligenceApi = {
    /**
     * Отримати повний профіль компанії.
     */
    getCompanyProfile: async (edrpou: string): Promise<CompanyProfileResponse> => {
        const response = await apiClient.get<CompanyProfileResponse>(`/v1/diligence/company/${edrpou}`);
        return response.data;
    },

    /**
     * Отримати список ризикових об'єктів (компаній).
     */
    getRiskEntities: async () => {
        const response = await apiClient.get('/v1/diligence/risk-entities');
        return response.data;
    }
};
