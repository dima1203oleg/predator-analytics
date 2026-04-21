/**
 * PREDATOR Analytics v58.2-WRAITH — Admin API Service
 * Integration with /api/v2/admin/*
 */

import { v2Client } from './v2Api';
import { apiClient } from './api/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NodeMetric {
  id: string;
  node: string;
  role: string;
  cpu: number;
  ram: number;
  vram?: number;
  vramGb?: number;
  temp?: number;
  net: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
}

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'warn' | 'down';
  latencyMs: number;
  version: string;
  lastCheck: string;
}

export interface InfraTelemetryResponse {
  nodes: NodeMetric[];
  services: ServiceStatus[];
}

export interface FailoverStatus {
  activeMode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD';
  activeNode: string;
  nodes: Record<string, FailoverNodeInfo>;
  history: FailoverHistoryEvent[];
}

export interface FailoverNodeInfo {
  label: string;
  ip: string;
  status: 'online' | 'offline' | 'standby';
  load: number;
}

export interface FailoverHistoryEvent {
  id: string;
  ts: string;
  from: string;
  to: string;
  reason: string;
  user: string;
  duration: string;
}

export interface AgentStats {
  stats: {
    total: number;
    alive: number;
    dead: number;
    idle: number;
    avgCpu: number;
  };
  list: any[];
}

export interface GitOpsStatus {
  argoApps: any[];
  ciRuns: any[];
  etlPipelines: any[];
}

export interface DataOpsStatus {
  kafkaTopics: KafkaTopic[];
  datasets: DatasetRecord[];
  factoryModules: FactoryModule[];
}

export interface KafkaTopic {
  name: string;
  partitions: number;
  lag: number;
  throughput: string;
  consumers: number;
  status: 'ok' | 'warn' | 'error';
}

export interface DatasetRecord {
  id: string;
  name: string;
  type: string;
  records: number;
  sizeGb: number;
  version: string;
  status: 'ready' | 'training' | 'outdated' | 'draft';
  updatedAt: string;
}

export interface FactoryModule {
  id: string;
  name: string;
  template: string;
  status: 'deployed' | 'pending' | 'failed' | 'draft';
  createdBy: string;
  createdAt: string;
}

export interface SecuritySession {
  id: string;
  user: string;
  role: string;
  ip: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
  expiresIn: string;
}

export interface SecurityApiKey {
  id: string;
  name: string;
  owner: string;
  scopes: string;
  lastUsed: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface SystemEngine {
  id: string;
  status: 'optimal' | 'calibrating' | 'degraded' | 'offline';
  score: number;
  throughput: number;
  latency: number;
  load: number;
  trend: string;
  tone: string;
}

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_total: number;
  memory_used: number;
  gpu_available: boolean;
  gpu_name?: string;
  gpu_temp?: number;
  gpu_utilization?: number;
  gpu_mem_total?: number;
  gpu_mem_used?: number;
  uptime_seconds: number;
  timestamp: string;
}

export interface SystemStatus {
  status: string;
  healthy: boolean;
  overall_status: string;
  version: string;
  uptime: string;
  services: Array<{
    name: string;
    status: string;
    label: string;
    latency_ms: number;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
  };
  timestamp: string;
}



// ─── API Implementation ──────────────────────────────────────────────────────

export const adminApi = {
  system: {
    getStatus: async (): Promise<SystemStatus> => {
      return (await apiClient.get<SystemStatus>('/system/status')).data;
    },
    getStats: async (): Promise<SystemStats> => {
      return (await apiClient.get<SystemStats>('/system/stats')).data;
    },
    getEngines: async (): Promise<SystemEngine[]> => {
      return (await apiClient.get<SystemEngine[]>('/system/engines')).data;
    },
    getLogs: async (): Promise<{ logs: any[] }> => {
      return (await apiClient.get<{ logs: any[] }>('/system/logs/stream')).data;
    },
  },
  infra: {
    getTelemetry: async (): Promise<InfraTelemetryResponse> => {
      return (await v2Client.get<InfraTelemetryResponse>('/admin/telemetry')).data;
    },
  },
  dataops: {
    getStatus: async (): Promise<DataOpsStatus> => {
      return (await v2Client.get<DataOpsStatus>('/admin/dataops')).data;
    },
  },
  gitops: {
    getStatus: async (): Promise<GitOpsStatus> => {
      return (await v2Client.get<GitOpsStatus>('/admin/gitops')).data;
    },
  },
  failover: {
    getStatus: async (): Promise<FailoverStatus> => {
      return (await v2Client.get<FailoverStatus>('/admin/failover')).data;
    },
    toggle: async (node: string): Promise<{ success: boolean; activeNode: string }> => {
      return (await v2Client.post('/admin/failover/toggle', { node })).data;
    },
  },
  agents: {
    getStats: async (): Promise<AgentStats> => {
      return (await v2Client.get<AgentStats>('/admin/agents')).data;
    },
  },
  security: {
    getAuditLogs: async (): Promise<any[]> => {
      return (await v2Client.get<any[]>('/admin/security/audit')).data;
    },
    getSessions: async (): Promise<SecuritySession[]> => {
      return (await v2Client.get<SecuritySession[]>('/admin/security/sessions')).data;
    },
    getKeys: async (): Promise<SecurityApiKey[]> => {
      return (await v2Client.get<SecurityApiKey[]>('/admin/security/keys')).data;
    },
  }
};

export default adminApi;
