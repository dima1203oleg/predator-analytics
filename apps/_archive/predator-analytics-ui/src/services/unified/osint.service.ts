import { apiClient } from '../api/config';
import { OSINTTool, JobStatus } from '@/types';

/**
 * Сервіс для роботи з OSINT-інструментами (Sherlock, Amass, SpiderFoot та ін.)
 */
export const osintService = {
    /**
     * Запускає нове завдання OSINT-сканування
     */
    startScan: async (target: string, toolId: string, params?: Record<string, any>): Promise<{ jobId: string }> => {
        const response = await apiClient.post('/osint/scan/start', { target, toolId, params });
        return response.data;
    },

    /**
     * Отримує статус активного або завершеного завдання
     */
    getJobStatus: async (jobId: string): Promise<{ status: JobStatus; progress: number; message?: string }> => {
        const response = await apiClient.get(`/osint/scan/${jobId}/status`);
        return response.data;
    },

    /**
     * Отримує результати завершеного завдання
     */
    getJobResults: async (jobId: string): Promise<any> => {
        const response = await apiClient.get(`/osint/scan/${jobId}/results`);
        return response.data;
    },

    /**
     * Отримує список доступних OSINT інструментів (з їхніми поточними статусами)
     */
    getTools: async (): Promise<OSINTTool[]> => {
        const response = await apiClient.get('/osint/tools');
        return response.data;
    },

    /**
     * Зупиняє активне завдання сканування
     */
    stopScan: async (jobId: string): Promise<{ success: boolean }> => {
        const response = await apiClient.post(`/osint/scan/${jobId}/stop`);
        return response.data;
    }
};
