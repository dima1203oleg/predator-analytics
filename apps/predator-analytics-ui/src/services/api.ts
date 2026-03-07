import { apiClient, v45Client, API_BASE_URL, API_V45_URL, IS_TRUTH_ONLY_MODE } from './api/config';
import { systemApi } from './api/system';
import { monitoringApi, etlApi, azrApi } from './api/monitoring';
import { trainingApi, datasetApi, nasApi, dataCatalogApi, mlApi } from './api/ml';
import { optimizerApi, intelligenceApi, searchApi, trinityApi, somApi, autonomyApi } from './api/intelligence';
import { ingestionApi } from './api/ingestion';
import { marketApi } from '@/features/market/api/market';
import { forecastApi } from '@/features/forecast/api/forecast';
import { diligenceApi } from '@/features/diligence/api/diligence';

// Re-export config constants and clients for direct use in components
export { apiClient, v45Client, API_BASE_URL, API_V45_URL, IS_TRUTH_ONLY_MODE };

// Re-export domain APIs for direct modular usage
export {
    systemApi, monitoringApi, etlApi, azrApi, trainingApi, datasetApi,
    nasApi, dataCatalogApi, optimizerApi, intelligenceApi, searchApi,
    trinityApi, somApi, autonomyApi, ingestionApi, mlApi,
    marketApi, forecastApi, diligenceApi
};

// ─── Search API (used by SearchView, SearchConsole, SystemVerificationSuite) ──
const fullSearchApi = {
    ...searchApi,
    query: async (params: { q: string; mode?: string; limit?: number; offset?: number; rerank?: boolean; filters?: any }) => {
        const { q, mode = 'hybrid', limit = 20, offset = 0, rerank = false, filters } = params;
        const res = await apiClient.post('/search', {
            q,
            mode,
            limit,
            offset,
            rerank,
            filters
        });
        return Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.items ?? []);
    },
    submitFeedback: async (resultId: string, type: 'relevant' | 'irrelevant' | 'up' | 'down') => {
        return (await apiClient.post(`/search/feedback`, { result_id: resultId, type })).data;
    }
};

// ─── Extended v45 namespace (adds analyze + all monitoring methods) ───────────
const fullV45Api = {
    ...monitoringApi,
    training: trainingApi,
    optimizer: optimizerApi,
    /** AI analysis / summarization for a query */
    analyze: async (query: string) => {
        const res = await v45Client.post('/analysis/query', { query }).catch(() => null);
        if (!res) return null;
        return typeof res.data === 'string' ? res.data : (res.data?.result || res.data?.summary || res.data?.message || null);
    },
    /** AI insights endpoint */
    getInsights: async () => {
        return (await v45Client.get('/analysis/insights')).data;
    },
    trinity: trinityApi,
    azr: azrApi,
};

/**
 * Unified `api` object — backward-compatible facade over modular domain APIs.
 * New code should import domain APIs directly; this object exists for legacy components.
 */
export const api = {
    // ─── System ────────────────────────────────────────────────────────────────
    ...systemApi,

    // ─── v45 namespace (monitoring + training + optimizer + analyze) ────────────
    v45: fullV45Api,
    azr: azrApi,
    autonomy: autonomyApi,
    som: somApi,
    ingestion: ingestionApi,

    // ─── Intelligence / Premium ────────────────────────────────────────────────
    premium: intelligenceApi,
    ai: intelligenceApi,
    optimizer: optimizerApi,
    ml: mlApi,
    market: marketApi,
    forecast: forecastApi,
    diligence: diligenceApi,

    // ─── Datasets ──────────────────────────────────────────────────────────────
    datasets: datasetApi,
    catalog: dataCatalogApi,

    // ─── Search ────────────────────────────────────────────────────────────────
    search: fullSearchApi,
    nexus: searchApi,
    runCouncil: trinityApi.process,

    // ─── Flattened Monitoring (used directly in MonitoringView, etc.) ──────────
    getClusterStatus: monitoringApi.getClusterStatus,
    streamSystemLogs: monitoringApi.streamSystemLogs,
    getLiveAlerts: monitoringApi.getLiveAlerts,
    getLiveQueues: monitoringApi.getLiveQueues,
    getLiveHealth: monitoringApi.getLiveHealth,
    getWafLogs: monitoringApi.getWafLogs,
    getSecurityLogs: monitoringApi.getSecurityLogs,

    // ─── ETL ───────────────────────────────────────────────────────────────────
    syncETL: etlApi.sync,
    getETLJobs: etlApi.getJobs,
    getETLJob: etlApi.getJobStatus,

    // ─── ML / Training ─────────────────────────────────────────────────────────
    getTrainingHistory: trainingApi.getHistory,
    getMLJobs: trainingApi.getMLJobs,
    generateDataset: datasetApi.generate,
    uploadDataset: datasetApi.upload,

    // ─── NAS ──────────────────────────────────────────────────────────────────
    getNasTournaments: nasApi.getTournaments,
    getNasProviders: nasApi.getProviders,
    getNasModels: nasApi.getModels,
    startNasEvolution: nasApi.startEvolutionCycle,
    getCouncilHistory: intelligenceApi.getCouncilHistory,

    // ─── LLM / AutoML ──────────────────────────────────────────────────────────
    llm: {
        getProviders: async () => (await apiClient.get('/llm/providers')).data,
        addKey: async (providerId: string, key: string) => (await apiClient.post(`/llm/providers/${providerId}/keys`, { key })).data,
        removeKey: async (providerId: string) => (await apiClient.delete(`/llm/providers/${providerId}/keys`)).data,
        testProvider: async (providerId: string, _key?: string) => (await apiClient.post(`/llm/providers/${providerId}/test`)).data,
    },
    getLLMBenchmarks: async () => (await apiClient.get('/llm/benchmarks')).data,
    getAutoMLExperiments: async () => (await apiClient.get('/llm/automl')).data,
    getLLMConfig: async () => (await apiClient.get('/llm/config')).data,

    // ─── Aliases for useOptimizedData ──────────────────────────────────────────
    alerts: {
        getActive: monitoringApi.getLiveAlerts,
    },
    graph: {
        getSummary: async () => (await apiClient.get('/graph/summary')).data,
        summary: async () => (await apiClient.get('/graph/summary')).data,
        search: async (q: string, limit: number = 2) => (await apiClient.post('/graph/search', { q, limit })).data,
        execute: async (query: string) => (await apiClient.post('/graph/execute', { query })).data,
    },
    agents: {
        getAll: async () => {
            const res = await apiClient.get('/agents');
            return Array.isArray(res.data) ? res.data : (res.data?.agents || []);
        },
    },
    stats: {
        getSystemStats: monitoringApi.getLiveHealth,
        getCategory: async () => (await apiClient.get('/stats/categories')).data,
    },
    training: {
        getStatus: trainingApi.getStatus,
        start: trainingApi.trigger,
    },

    getNotifications: monitoringApi.getNotifications,
    getMarketTrends: intelligenceApi.getMarketTrends,
    getMorningNewspaper: intelligenceApi.getMorningNewspaper,
    getRiskEntities: diligenceApi.getRiskEntities,
    getInvestigations: intelligenceApi.getInvestigations,
    getMarketAnalytics: marketApi.getOverview,
    getMarketSegments: intelligenceApi.getMarketSegments,
    getOpportunities: intelligenceApi.getOpportunities,
    getAiInsights: intelligenceApi.getAiInsights,
    getTopImporters: intelligenceApi.getTopImporters,
    getCompanyProfile: diligenceApi.getCompanyProfile,
    getDemandForecast: forecastApi.getDemandForecast,

    // ─── Database & Query Operations (Legacy / Global) ─────────────────────────
    getDatabases: async () => (await apiClient.get('/databases')).data,
    getVectors: async () => (await apiClient.get('/vectors')).data,
    getBuckets: async () => (await apiClient.get('/buckets')).data,
    getTrainingPairs: async () => (await apiClient.get('/ml/training-pairs')).data,
    executeQuery: async (sql: string) => (await apiClient.post('/databases/query', { sql })).data,

    // ─── Connectors ────────────────────────────────────────────────────────────
    getConnectors: async () => (await apiClient.get('/connectors')).data,
};