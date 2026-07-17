import { apiClient } from '@/services/api/config';
import { ForecastDemandRequest, ForecastResponse, ForecastModelsResponse } from '../types/index';

/**
 * API для роботи з ML-прогнозуванням.
 * Базується на канонічних ендпоінтах v1/forecast.
 */
export const forecastApi = {
    /**
     * Отримати прогноз попиту для конкретного товару.
     */
    getDemandForecast: async (params: ForecastDemandRequest): Promise<ForecastResponse> => {
        const response = await apiClient.post<ForecastResponse>('/forecast/demand', params);
        return response.data;
    },

    /**
     * Отримати список доступних ML-моделей прогнозування.
     */
    getModels: async (): Promise<ForecastModelsResponse> => {
        const response = await apiClient.get<ForecastModelsResponse>('/forecast/models');
        return response.data;
    }
};
