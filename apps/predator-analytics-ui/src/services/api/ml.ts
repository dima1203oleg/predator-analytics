import { apiClient, v45Client } from './config';

export const trainingApi = {
    trigger: async () => {
        return (await v45Client.post('/ml/training/start')).data;
    },
    getStatus: async () => {
        return (await v45Client.get('/ml/training/status')).data;
    },
    getHistory: async () => {
        return (await v45Client.get('/ml/training/history')).data;
    },
    getMLJobs: async () => {
        return (await v45Client.get('/ml/jobs')).data;
    }
};

export const datasetApi = {
    list: async () => {
        const res = await apiClient.get('/datasets');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    activateReference: async (id: string) => {
        return (await apiClient.post(`/datasets/${id}/activate-reference`)).data;
    },
    upload: async (formData: FormData, onProgress?: (progressEvent: any) => void) => {
        const response = await apiClient.post('/data/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress,
        });
        return response.data;
    },
    generate: async (config: any) => {
        return (await v45Client.post('/dataset/generate', config)).data;
    }
};
