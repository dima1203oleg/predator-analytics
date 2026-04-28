import { apiClient } from '../api/config';
import { CERSCompany, CERSScoreSegment } from '@/types';

/**
 * Сервіс для роботи з системою CERS (Central Entity Resolution & Scoring)
 */
export const cersService = {
    /**
     * Отримує повний або частковий профіль компанії по коду ЄД� ПОУ
     */
    getCompanyProfile: async (edrpou: string): Promise<CERSCompany> => {
        const response = await apiClient.get(`/cers/company/${edrpou}`);
        return response.data;
    },

    /**
     * Отримує деталізацію оцінки CERS (сегменти та їх вага) для конкретної компанії
     */
    getScoreDetails: async (edrpou: string): Promise<{ totalScore: number; segments: CERSScoreSegment[] }> => {
        const response = await apiClient.get(`/cers/company/${edrpou}/score-details`);
        return response.data;
    },

    /**
     * Запускає примусовий перерахунок CERS "суворості" для суб'єкта
     */
    recalculateScore: async (edrpou: string): Promise<{ success: boolean; newScore: number }> => {
        const response = await apiClient.post(`/cers/company/${edrpou}/recalculate`);
        return response.data;
    },

    /**
     * Отримує список артефактів/документів, які були використані для формування CERS-рейтингу
     */
    getDecisionArtifacts: async (edrpou: string): Promise<any[]> => {
        const response = await apiClient.get(`/cers/company/${edrpou}/artifacts`);
        return response.data;
    },
    
    /**
     * Отримує фінансові показники компанії за останні роки
     */
    getFinancialMetrics: async (edrpou: string): Promise<any[]> => {
        const response = await apiClient.get(`/cers/company/${edrpou}/financials`);
        return response.data;
    },

    /**
     * Пошук компаній за назвою, УЕІД або іншими параметрами
     */
    searchCompanies: async (query: string, filters: any): Promise<any[]> => {
        const response = await apiClient.get('/cers/search', { params: { q: query, ...filters } });
        return response.data;
    }
};
