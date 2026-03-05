import { apiClient, v45Client } from './config';

export const monitoringApi = {
    getLiveAlerts: async () => {
        return (await v45Client.get('/monitoring/alerts')).data;
    },
    getLiveQueues: async () => {
        return (await v45Client.get('/monitoring/queues')).data;
    },
    getLiveHealth: async () => {
        return (await v45Client.get('/monitoring/health')).data;
    },
    getClusterStatus: async () => {
        return (await apiClient.get('/system/cluster')).data;
    },
    streamSystemLogs: async () => {
        try {
            const res = await apiClient.get('/system/logs/stream?limit=50');
            const data = res.data;
            if (!Array.isArray(data)) return [];
            return data.map((log: any) => ({
                id: log.id || Math.random().toString(36).substr(2, 9),
                timestamp: log.timestamp || new Date().toISOString(),
                service: log.service || 'system',
                level: log.level || 'INFO',
                msg: log.message || log.msg
            }));
        } catch (e) {
            return [];
        }
    }
};

export const etlApi = {
    sync: async () => {
        return (await v45Client.post('/etl/sync')).data;
    },
    getJobs: async (limit: number = 20) => {
        const data = (await apiClient.get(`/ingest/jobs?limit=${limit}`)).data;
        return Array.isArray(data) ? data : (data?.jobs ?? data?.items ?? []);
    },
    getJobStatus: async (id: string) => {
        return (await apiClient.get(`/ingest/status/${id}`)).data;
    }
};
