import { apiClient } from '@/services/api/config';

export interface Competitor {
    edrpou: string;
    name: string;
    declaration_count: number;
    total_value_usd: number;
    avg_value_usd: number;
    last_activity: string;
}

export const competitorsApi = {
    /**
     * Отримати список активних конкурентів за показниками активності.
     */
    getActive: async (limit: number = 10): Promise<Competitor[]> => {
        const response = await apiClient.get<Competitor[]>('/competitors/active', {
            params: { limit }
        });
        return response.data;
    },

    /**
     * Пошук конкурентів за назвою.
     */
    search: async (q: string): Promise<Competitor[]> => {
        const response = await apiClient.get<Competitor[]>('/competitors/search', {
            params: { q }
        });
        return response.data;
    }
};
