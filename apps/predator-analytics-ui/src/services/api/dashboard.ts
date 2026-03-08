import { apiClient } from './config';

export const dashboardApi = {
    /**
     * Отримати загальну статистику для головного дашборду.
     */
    getOverview: async () => {
        const response = await apiClient.get('/dashboard/overview');
        return response.data;
    }
};
