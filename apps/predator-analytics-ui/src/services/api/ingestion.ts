import { apiClient } from './config';

export const ingestionApi = {
    uploadFile: async (file: File | FormData) => {
        const formData = file instanceof FormData ? file : (() => {
            const fd = new FormData();
            fd.append('file', file);
            return fd;
        })();
        return (await apiClient.post('/ingest/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })).data;
    },
    startJob: async (config: any) => {
        return (await apiClient.post('/ingest/job', config)).data;
    },
    getJobStatus: async (id: string) => {
        return (await apiClient.get(`/ingest/job/${id}`)).data;
    },
    getFeed: async (type: string = 'all') => {
        return (await apiClient.get(`/ingest/feed?type=${type}`)).data;
    }
};
