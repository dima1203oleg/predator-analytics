import { apiClient } from '@/services/api/config';
import { MarketOverviewResponse, DeclarationsListResponse, DeclarationFilter } from '../types/index';

/**
 * API для роботи з ринковою аналітикою (Mаркет).
 * Базується на канонічних ендпоінтах v4.1.
 */
export const marketApi = {
    /**
     * Отримати загальний огляд ринку.
     */
    getOverview: async (period: string = 'last_30_days'): Promise<MarketOverviewResponse> => {
        const response = await apiClient.get<MarketOverviewResponse>('/market/overview', {
            params: { period }
        });
        return response.data;
    },

    /**
     * Отримати список митних декларацій з фільтрацією та пагінацією.
     */
    getDeclarations: async (
        page: number = 1,
        limit: number = 20,
        filters?: DeclarationFilter
    ): Promise<DeclarationsListResponse> => {
        // Замінено на GET як у канонічному backend API v1
        const response = await apiClient.get<DeclarationsListResponse>('/market/declarations', {
            params: { page, limit, ...filters }
        });
        return response.data;
    },

    /**
     * Отримати статистику по конкретному коду УКТЗЕД.
     */
    getProductStats: async (code: string) => {
        const response = await apiClient.get(`/market/product/${code}/stats`);
        return response.data;
    },

    /**
     * Отримати AI-інсайти по ринку.
     */
    getInsights: async () => {
        const response = await apiClient.get('/market/insights');
        return response.data;
    }
};
