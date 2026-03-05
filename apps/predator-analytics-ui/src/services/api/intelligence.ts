import { apiClient, v45Client } from './config';

export const optimizerApi = {
    getStatus: async () => {
        return (await v45Client.get('/optimizer/status')).data;
    },
    trigger: async (reason: string = 'manual') => {
        return (await v45Client.post('/optimizer/trigger', { reason })).data;
    },
    getMetrics: async () => {
        return (await v45Client.get('/optimizer/metrics')).data;
    },
    getHistory: async () => {
        return (await v45Client.get('/optimizer/history')).data?.history || [];
    },
    run: async () => {
        return (await v45Client.post('/optimizer/run')).data;
    }
};

export const intelligenceApi = {
    getAiInsights: async () => {
        return (await apiClient.get('/premium/ai-insights')).data;
    },
    getCompetitorRadar: async () => {
        return (await apiClient.get('/premium/competitor-radar')).data;
    },
    getForensics: async (query: string) => {
        return (await apiClient.get(`/premium/forensics?query=${encodeURIComponent(query)}`)).data;
    }
};

export const searchApi = {
    nexusChat: async (prompt: string, mode: string = 'chat') => {
        return (await apiClient.post('/nexus/chat', { prompt, mode })).data;
    }
};
