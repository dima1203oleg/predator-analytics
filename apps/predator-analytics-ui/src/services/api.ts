import { apiClient, v45Client, API_BASE_URL, IS_TRUTH_ONLY_MODE } from './api/config';
import { systemApi } from './api/system';
import { monitoringApi, etlApi } from './api/monitoring';
import { trainingApi, datasetApi } from './api/ml';
import { optimizerApi, intelligenceApi, searchApi } from './api/intelligence';

// Export everything under a single 'api' object for backward compatibility
// while cleaning up the implementation details.

export { apiClient, v45Client, API_BASE_URL, IS_TRUTH_ONLY_MODE };

export const api = {
    // Legacy mapping to satisfy existing components
    ...systemApi,
    v45: {
        ...monitoringApi,
        getLiveAlerts: monitoringApi.getLiveAlerts,
        getLiveQueues: monitoringApi.getLiveQueues,
        getLiveHealth: monitoringApi.getLiveHealth,
        training: trainingApi,
        optimizer: optimizerApi,
    },
    premium: intelligenceApi,
    datasets: datasetApi,
    nexus: searchApi,
    
    // Flattened common methods
    getClusterStatus: monitoringApi.getClusterStatus,
    streamSystemLogs: monitoringApi.streamSystemLogs,
    getLiveAlerts: monitoringApi.getLiveAlerts, // Top level redundancy
    
    // ETL
    syncETL: etlApi.sync,
    getETLJobs: etlApi.getJobs,
    getETLJob: etlApi.getJobStatus,
    
    // ML
    getTrainingHistory: trainingApi.getHistory,
    getMLJobs: trainingApi.getMLJobs,
    generateDataset: datasetApi.generate,
    uploadDataset: datasetApi.upload,

    // LLM/Search Compatibility
    getLLMBenchmarks: async () => (await apiClient.get('/llm/benchmarks')).data,
    getAutoMLExperiments: async () => (await apiClient.get('/llm/automl')).data,
    getLLMConfig: async () => (await apiClient.get('/llm/config')).data,
};