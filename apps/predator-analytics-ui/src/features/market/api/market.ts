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
        const response = await apiClient.get<MarketOverviewResponse>('/v1/market/overview', {
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
        const response = await apiClient.post<DeclarationsListResponse>('/v1/market/declarations', filters, {
            params: { page, limit }
        });
        return response.data;
    },

    /**
     * Отримати статистику по конкретному коду УКТЗЕД.
     */
    getProductStats: async (code: string) => {
        const response = await apiClient.get(`/v1/market/product/${code}/stats`);
        return response.data;
    }
};
