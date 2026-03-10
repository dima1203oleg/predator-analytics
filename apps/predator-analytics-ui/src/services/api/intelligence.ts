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
    query: async (query: string) => {
        return (await v45Client.post('/intelligence/query', { query })).data;
    },
    getCompetitorRadar: async () => {
        return (await apiClient.get('/premium/competitor-radar')).data;
    },
    getTopImporters: async () => {
        return (await apiClient.get('/premium/top-importers')).data;
    },
    getHSAnalytics: async () => {
        return (await apiClient.get('/premium/hs-analytics')).data;
    },
    getPriceAnomalies: async () => {
        return (await apiClient.get('/premium/price-anomalies')).data;
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
    },
    getCouncilHistory: async (limit: number = 20) => {
        const res = await apiClient.get(`/intelligence/council/history?limit=${limit}`);
        return Array.isArray(res.data) ? res.data : (res.data?.history || []);
    },
    getSuppliers: async () => {
        return (await apiClient.get('/premium/suppliers')).data;
    },
    getTradeFlows: async () => {
        return (await apiClient.get('/premium/trade-flows')).data;
    },
    triggerSelfImprovement: async (domain: string = 'all') => {
        return (await v45Client.post('/intelligence/self-improvement/trigger', { domain })).data;
    },
    getAgents: async () => {
        const res = await apiClient.get('/agents');
        return Array.isArray(res.data) ? res.data : (res.data?.agents || []);
    },
    getHealth: async () => {
        return (await v45Client.get('/monitoring/health')).data;
    },
    getMarketTrends: async () => {
        return (await apiClient.get('/premium/market-trends')).data;
    },
    getIntelligenceAlerts: async () => {
        const res = await apiClient.get('/premium/intelligence-alerts');
        return Array.isArray(res.data) ? res.data : (res.data?.alerts || []);
    },
    getAlertRules: async () => {
        const res = await apiClient.get('/premium/alert-rules');
        return Array.isArray(res.data) ? res.data : (res.data?.rules || []);
    },
    getMorningNewspaper: async () => {
        return (await apiClient.get('/premium/morning-brief')).data;
    },
    getRiskEntities: async () => {
        return (await apiClient.get('/premium/risk-entities')).data;
    },
    getInvestigations: async () => {
        return (await apiClient.get('/premium/investigations')).data;
    },
    getMarketAnalytics: async () => {
        return (await apiClient.get('/premium/market-analytics')).data;
    },
    getMarketSegments: async () => {
        return (await apiClient.get('/premium/market-segments')).data;
    },
    getOpportunities: async () => {
        return (await apiClient.get('/premium/opportunities')).data;
    },
};

export const trinityApi = {
    process: async (prompt: string) => {
        return (await v45Client.post('/trinity/process', { prompt })).data;
    },
    getLogs: async (limit: number = 20) => {
        const res = await v45Client.get(`/trinity/logs?limit=${limit}`);
        return Array.isArray(res.data) ? res.data : (res.data?.logs || []);
    },
};

export const somApi = {
    activateEmergency: async (level: number, trigger: string, actor: string, message: string) => {
        return (await v45Client.post('/som/emergency', { level, trigger, actor, message })).data;
    },
    deactivateEmergency: async (actor: string) => {
        return (await v45Client.post('/som/emergency/deactivate', { actor })).data;
    },
    getStatus: async () => {
        return (await v45Client.get('/som/status')).data;
    },
    getAnomalies: async () => {
        return (await v45Client.get('/som/anomalies')).data;
    },
    chaosSpike: async (intensity: number = 15) => {
        return (await v45Client.post('/som/chaos', { intensity })).data;
    },
    getShadowMetrics: async () => {
        return (await v45Client.get('/som/shadow/metrics')).data;
    },
    getProposals: async () => {
        return (await v45Client.get('/som/proposals')).data;
    },
    getAxiomViolations: async () => {
        return (await v45Client.get('/som/violations')).data;
    },
    executeProposal: async (id: string, actor: string) => {
        return (await v45Client.post(`/som/proposals/${id}/execute`, { actor })).data;
    },
    getInfluenceClusters: async (ueid: string) => {
        return (await v45Client.get(`/api/v1/graph/clusters/influence/${ueid}`)).data;
    },
    grantImmunity: async (component: string, duration: number, actor: string) => {
        return (await v45Client.post('/som/immunity', { component, duration, actor })).data;
    },
    overruleAxiom: async (violationId: string, reason: string, actor: string) => {
        return (await v45Client.post(`/som/violations/${violationId}/overrule`, { reason, actor })).data;
    },
};

export const autonomyApi = {
    getStatus: async () => {
        return (await v45Client.get('/azr/status')).data;
    },
};

export const searchApi = {
    chat: async (prompt: string, mode: string = 'chat') => {
        return (await v45Client.post('/nexus/chat', { prompt, mode })).data;
    },
    nexusChat: async (prompt: string, mode: string = 'chat') => {
        return (await v45Client.post('/nexus/chat', { prompt, mode })).data;
    },
    speak: async (text: string) => {
        return (await v45Client.post('/intelligence/speak', { text })).data;
    }
};
