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
    getRealtimeMetrics: async () => {
        const res = await v45Client.get('/monitoring/metrics');
        return res.data;
    },
    getWafLogs: async () => {
        const res = await v45Client.get('/security/waf/logs');
        return Array.isArray(res.data) ? res.data : (res.data?.logs ?? []);
    },
    getSecurityLogs: async () => {
        const res = await v45Client.get('/security/audit/logs');
        return Array.isArray(res.data) ? res.data : (res.data?.logs ?? []);
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
    },
    getNotifications: async () => {
        const res = await v45Client.get('/monitoring/notifications');
        return Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
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

export const azrApi = {
    getStatus: async () => {
        return (await v45Client.get('/azr/status')).data;
    },
    getDecisions: async (limit: number = 20) => {
        const res = await v45Client.get(`/azr/decisions?limit=${limit}`);
        return Array.isArray(res.data) ? res.data : (res.data?.decisions || []);
    },
    verifyDecision: async (id: string) => {
        return (await v45Client.post(`/azr/decisions/${id}/verify`)).data;
    },
    getAudit: async (limit: number = 20) => {
        const res = await v45Client.get(`/azr/audit?limit=${limit}`);
        return Array.isArray(res.data) ? res.data : (res.data?.audit || []);
    },
    governance: {
        propose: async (proposal: any) => {
            return (await v45Client.post('/azr/governance/propose', proposal)).data;
        }
    }
};
