import { apiClient, v45Client } from './config';

export interface ServiceCheck {
  status: string;
  duration_seconds?: number;
  error?: string;
  details?: Record<string, unknown>;
  version?: string;
  environment?: string;
}

export interface SystemStatusResponse {
  status: string;
  healthy: boolean;
  overall_status: string;
  version: string;
  environment: string;
  uptime: string;
  last_sync: string | null;
  services: Array<{
    name: string;
    status: string;
    label: string;
    latency_ms: number;
    details?: Record<string, unknown>;
    error?: string | null;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
  };
  metrics: Record<string, number | string>;
  timestamp: string;
}

export interface SystemStatsResponse {
  cpu_usage: number;
  cpu_percent: number;
  cpu_count: number;
  memory_usage: number;
  memory_percent: number;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  disk_usage: number;
  disk_percent: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  gpu_available: boolean;
  gpu_name: string;
  gpu_temp: number;
  gpu_utilization: number;
  gpu_mem_total: number;
  gpu_mem_used: number;
  network_bytes_sent: number;
  network_bytes_recv: number;
  active_connections: number;
  active_tasks: number;
  uptime: string;
  uptime_seconds: number;
  documents_total: number;
  search_rate: number;
  avg_latency: number;
  indexing_rate: number;
  total_indices: number;
  storage_gb: number;
  last_sync: string | null;
  timestamp: string;
}

export interface SystemDiagnosticsResponse {
  status: string;
  generated_at: string;
  results: {
    health_status: string;
    overall_status: string;
    infrastructure: Record<string, ServiceCheck>;
    data_ingestion: Record<string, ServiceCheck>;
    ai_brain: Record<string, ServiceCheck>;
    observability: Record<string, ServiceCheck>;
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      failed: number;
    };
    metrics: SystemStatsResponse;
    predictions: Record<string, any>;
  };
  report_markdown: string;
}

export const systemApi = {
  getHealth: async () => {
    return (await apiClient.get('/health')).data;
  },
  getStatus: async (): Promise<SystemStatusResponse> => {
    return (await apiClient.get('/system/status')).data;
  },
  getStats: async (): Promise<SystemStatsResponse> => {
    return (await apiClient.get('/system/stats')).data;
  },
  runDiagnostics: async (): Promise<SystemDiagnosticsResponse> => {
    return (await apiClient.post('/system/diagnostics/run')).data;
  },
  getInfrastructure: async () => {
    return (await apiClient.get('/system/infrastructure')).data;
  },
  getEngines: async () => {
    return (await apiClient.get('/system/engines')).data;
  },
  getCluster: async () => {
    return (await apiClient.get('/system/cluster')).data;
  },
  getLogs: async (limit: number = 50) => {
    return (await apiClient.get(`/system/logs/stream?limit=${limit}`)).data;
  },
  getNeuralLogs: async (limit: number = 20): Promise<any[]> => {
    return (await apiClient.get('/system/logs/neural?limit=' + limit)).data;
  },
  getMetricsHistory: async (): Promise<any[]> => {
    return (await apiClient.get('/system/metrics/history')).data;
  },
  getNexusScenarios: async (): Promise<any[]> => {
    return (await apiClient.get('/system/nexus/scenarios')).data;
  },
  getConfig: async () => {
    return (await apiClient.get('/system/config')).data;
  },
  saveConfig: async (config: Record<string, unknown>) => {
    return (await apiClient.post('/system/config', config)).data;
  },
  restartServices: async () => {
    return (await v45Client.post('/system/restart')).data;
  },
  lockdown: async () => {
    return (await v45Client.post('/system/lockdown')).data;
  },
  getETLStatus: async () => {
    return (await v45Client.get('/system/etl/status')).data;
  },
  getDataCatalog: async () => {
    return (await v45Client.get('/system/data-catalog')).data;
  },
  startEvolutionCycle: async (options?: Record<string, unknown>) => {
    return (await v45Client.post('/system/evolution/start', options)).data;
  },
  syncConnector: async (id: string) => {
    return (await v45Client.post(`/system/connectors/${id}/sync`)).data;
  },
};
