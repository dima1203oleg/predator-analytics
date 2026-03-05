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
    },
    getCompetitors: async () => {
        return (await apiClient.get('/premium/competitors')).data;
    },
    getSanctionsResults: async () => {
        const res = await apiClient.get('/premium/sanctions/history');
        return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
    screenSanctions: async (query: string, lists: string[] = ['OFAC', 'EU', 'UN', 'UK', 'PEP']) => {
        return (await apiClient.post('/premium/sanctions/screen', { query, lists })).data;
    },
    getDashboardRecommendations: async (persona: string) => {
        const res = await apiClient.get(`/premium/dashboard-recommendations?persona=${persona}`);
        return Array.isArray(res.data) ? res.data : (res.data?.recommendations ?? []);
    },
    getWidgetData: async (type: string, source: string = 'customs_registry') => {
        return (await apiClient.get(`/premium/widget-data?type=${type}&source=${source}`)).data;
    },
    saveDashboard: async (dashboard: any) => {
        const endpoint = dashboard.id ? `/premium/dashboards/${dashboard.id}` : '/premium/dashboards';
        const method = dashboard.id ? 'put' : 'post';
        return (await (apiClient as any)[method](endpoint, dashboard)).data;
    }
};

export const searchApi = {
    nexusChat: async (prompt: string, mode: string = 'chat') => {
        return (await apiClient.post('/nexus/chat', { prompt, mode })).data;
    }
};
