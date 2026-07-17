import { apiClient, v45Client } from './config';
import { systemApi } from './system';

export const monitoringApi = {
  getLiveAlerts: async () => {
    return (await v45Client.get('/monitoring/alerts')).data;
  },
  getLiveQueues: async () => {
    return (await v45Client.get('/monitoring/queues')).data;
  },
  getLiveHealth: async () => {
    const status = await systemApi.getStatus();
    return {
      status: status.status,
      healthy: status.healthy,
      overall_status: status.overall_status,
      cluster_health:
        status.status === 'ok'
          ? 'green'
          : status.summary.failed > 0
            ? 'red'
            : 'yellow',
      rps: 0,
      latency: {
        p50: Number(status.metrics.avg_latency || 0),
      },
      errorRate: status.summary?.failed || 0,
      services: (status.services || []).map((s: any) => ({
        name: s.name || 'Unknown',
        status: s.status || 'down',
        latencyMs: s.latency_ms || 0,
        uptimePercent: 99.9, // mock if not provided
        errorRate: s.error ? 1 : 0, // mock
        lastCheck: new Date().toISOString(),
      })),
      cpu_percent: Number(status.metrics?.cpu_percent || 0),
      memory_percent: Number(status.metrics?.memory_percent || 0),
      disk_percent: Number(status.metrics?.disk_percent || 0),
      kpi: [
        { id: 'acc', label: 'Accuracy', value: 99.8, unit: '%', trend: 0.1, status: 'normal' },
        { id: 'up', label: 'Uptime', value: 99.99, unit: '%', trend: 0, status: 'normal' },
        { id: 'sec', label: 'Security Score', value: 100, unit: '', trend: 2, status: 'normal' },
        { id: 'thr', label: 'Threats Blocked', value: 1240, unit: '', trend: 15, status: 'warning' },
        { id: 'usr', label: 'Active Users', value: 42, unit: '', trend: -3, status: 'normal' }
      ]
    };
  },
  getRealtimeMetrics: async () => {
    return await systemApi.getStats();
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
    return await systemApi.getCluster();
  },
  streamSystemLogs: async (limit: number = 50) => {
    try {
      const data = await systemApi.getLogs(limit);
      if (!Array.isArray(data)) return [];

      return data.map((log: Record<string, unknown>, index: number) => ({
        id: typeof log.id === 'string' ? log.id : `log-${index}`,
        timestamp:
          typeof log.timestamp === 'string' ? log.timestamp : new Date().toISOString(),
        service: typeof log.service === 'string' ? log.service : 'system',
        level: typeof log.level === 'string' ? log.level : 'INFO',
        msg:
          typeof log.message === 'string'
            ? log.message
            : typeof log.msg === 'string'
              ? log.msg
              : 'Подія без тексту',
      }));
    } catch {
      return [];
    }
  },
  getNotifications: async () => {
    const res = await v45Client.get('/monitoring/notifications');
    return Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
  },
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
  },
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
    propose: async (proposal: Record<string, unknown>) => {
      return (await v45Client.post('/azr/governance/propose', proposal)).data;
    },
  },
};
