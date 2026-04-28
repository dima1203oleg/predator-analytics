import { apiClient } from '../api/config';

/**
 * Сервіс для взаємодії з відкритими реєстрами України (ЄД , Prozorro, Податкова тощо)
 */
export const registriesService = {
    /**
     * Пошук по всіх доступних реєстрах за ключовим словом (ПІБ, Назва, ЄД ПОУ)
     */
    globalSearch: async (query: string): Promise<any> => {
        const response = await apiClient.get(`/registries/search`, { params: { q: query } });
        return response.data;
    },

    /**
     * Отримання виписки з ЄД  по компанії
     */
    getEDRData: async (edrpou: string): Promise<any> => {
        const response = await apiClient.get(`/registries/edr/${edrpou}`);
        return response.data;
    },

    /**
     * Отримання історії тендерів з Prozorro
     */
    getProzorroTenders: async (edrpou: string): Promise<any> => {
        const response = await apiClient.get(`/registries/prozorro/${edrpou}/tenders`);
        return response.data;
    },

    /**
     * Перевірка податкового боргу (ДПС)
     */
    getTaxDebt: async (edrpou: string): Promise<any> => {
        const response = await apiClient.get(`/registries/tax/${edrpou}/debt`);
        return response.data;
    },

    /**
     * Отримання списку підключених реєстрів та їх статусу
     */
    getRegistriesStatus: async (): Promise<any[]> => {
        const response = await apiClient.get(`/registries/status`);
        return response.data;
    }
};
