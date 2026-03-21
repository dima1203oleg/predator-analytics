import { apiClient, v45Client } from './config';

export const trainingApi = {
    trigger: async (options: string | { domain?: string;[key: string]: any } = 'AUTO') => {
        const payload = typeof options === 'string' ? { domain: options } : options;
        return (await v45Client.post('/ml/training/start', payload)).data;
    },
    getStatus: async () => {
        return (await v45Client.get('/ml/training/status')).data;
    },
    getHistory: async () => {
        const res = await v45Client.get('/ml/training/history');
        return Array.isArray(res.data) ? res.data : (res.data?.history || []);
    },
    getMLJobs: async () => {
        const res = await v45Client.get('/ml/jobs');
        return Array.isArray(res.data) ? res.data : (res.data?.jobs || []);
    },
    getArbitrationScores: async () => {
        const res = await v45Client.get('/ml/arbitration/scores');
        return Array.isArray(res.data) ? res.data : (res.data?.scores || []);
    }
};

export const datasetApi = {
    /** List all user datasets */
    list: async () => {
        const res = await apiClient.get('/datasets');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },

    /** Upload a file (File object or FormData) */
    upload: async (file: File | FormData, onProgress?: (e: any) => void) => {
        const formData = file instanceof FormData ? file : (() => {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('name', (file as File).name.replace(/\.[^/.]+$/, ''));
            return fd;
        })();

        const res = await apiClient.post('/datasets/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress,
        });
        return res.data;
    },

    /** Update dataset metadata (e.g. isExampleEnabled) */
    update: async (id: string, patch: Record<string, any>) => {
        return (await apiClient.patch(`/datasets/${id}`, patch)).data;
    },

    /** Delete a dataset by ID */
    delete: async (id: string) => {
        return (await apiClient.delete(`/datasets/${id}`)).data;
    },

    /** Activate a dataset as training reference */
    activateReference: async (id: string) => {
        return (await apiClient.post(`/datasets/${id}/activate-reference`)).data;
    },

    /** Generate a synthetic dataset */
    generate: async (config: any) => {
        return (await v45Client.post('/dataset/generate', config)).data;
    }
};

export const nasApi = {
    getTournaments: async () => {
        const res = await apiClient.get('/ml/nas/tournaments');
        return Array.isArray(res.data) ? res.data : (res.data?.tournaments || []);
    },
    getProviders: async () => {
        const res = await apiClient.get('/ml/nas/providers');
        return Array.isArray(res.data) ? res.data : (res.data?.providers || []);
    },
    getModels: async () => {
        const res = await apiClient.get('/ml/nas/models');
        return Array.isArray(res.data) ? res.data : (res.data?.models || []);
    },
    startEvolutionCycle: async (config: any) => {
        return (await apiClient.post('/ml/nas/evolution', config)).data;
    },
};

export const dataCatalogApi = {
    list: async () => {
        const res = await apiClient.get('/data/catalog');
        return Array.isArray(res.data) ? res.data : (res.data?.items || []);
    },
};

export const mlApi = {
    explain: async (query: string, resultId: string, snippet: string) => {
        return (await v45Client.post('/ml/explain', { query, result_id: resultId, snippet })).data;
    },
    getDocumentSummary: async (id: string) => {
        return (await v45Client.get(`/ml/documents/${id}/summary`)).data;
    }
};

export const mlStudioApi = {
    getStatus: async () => {
        return (await apiClient.get('/ml-studio/status')).data;
    },
    getRuns: async (limit: number = 10) => {
        return (await apiClient.get(`/ml-studio/runs?limit=${limit}`)).data;
    },
    startLoraTraining: async (config: any) => {
        return (await apiClient.post('/ml-studio/train/lora', config)).data;
    },
    getModelRegistry: async () => {
        return (await apiClient.get('/ml-studio/models/registry')).data;
    }
};
