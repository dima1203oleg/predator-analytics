import { apiClient, v45Client, API_BASE_URL, API_V45_URL, IS_TRUTH_ONLY_MODE } from './api/config';
import { systemApi } from './api/system';
import { monitoringApi, etlApi } from './api/monitoring';
import { trainingApi, datasetApi } from './api/ml';
import { optimizerApi, intelligenceApi, searchApi } from './api/intelligence';

// Re-export config constants and clients for direct use in components
export { apiClient, v45Client, API_BASE_URL, API_V45_URL, IS_TRUTH_ONLY_MODE };

// Re-export domain APIs for direct modular usage
export { systemApi, monitoringApi, etlApi, trainingApi, datasetApi, optimizerApi, intelligenceApi, searchApi };

/**
 * Unified `api` object — backward-compatible facade over modular domain APIs.
 * New code should import domain APIs directly; this object exists for legacy components.
 */
export const api = {
    // ─── System ────────────────────────────────────────────────────────────────
    ...systemApi,

    // ─── v45 / Monitoring ──────────────────────────────────────────────────────
    v45: {
        ...monitoringApi,
        training: trainingApi,
        optimizer: optimizerApi,
    },

    // ─── Intelligence / Premium ────────────────────────────────────────────────
    premium: intelligenceApi,
    optimizer: optimizerApi,

    // ─── Datasets ──────────────────────────────────────────────────────────────
    datasets: datasetApi,

    // ─── Search / Nexus ────────────────────────────────────────────────────────
    nexus: searchApi,

    // ─── Flattened Monitoring ──────────────────────────────────────────────────
    getClusterStatus: monitoringApi.getClusterStatus,
    streamSystemLogs: monitoringApi.streamSystemLogs,
    getLiveAlerts: monitoringApi.getLiveAlerts,
    getLiveQueues: monitoringApi.getLiveQueues,
    getLiveHealth: monitoringApi.getLiveHealth,

    // ─── ETL ───────────────────────────────────────────────────────────────────
    syncETL: etlApi.sync,
    getETLJobs: etlApi.getJobs,
    getETLJob: etlApi.getJobStatus,

    // ─── ML / Training ─────────────────────────────────────────────────────────
    getTrainingHistory: trainingApi.getHistory,
    getMLJobs: trainingApi.getMLJobs,
    generateDataset: datasetApi.generate,
    uploadDataset: datasetApi.upload,

    // ─── LLM / AutoML ──────────────────────────────────────────────────────────
    getLLMBenchmarks: async () => (await apiClient.get('/llm/benchmarks')).data,
    getAutoMLExperiments: async () => (await apiClient.get('/llm/automl')).data,
    getLLMConfig: async () => (await apiClient.get('/llm/config')).data,

    // ─── Connectors ────────────────────────────────────────────────────────────
    getConnectors: async () => (await apiClient.get('/connectors')).data,
};