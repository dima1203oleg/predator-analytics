/**
 * PREDATOR Analytics v58.2-WRAITH — Admin API Service
 * Integration with /api/v2/admin/*
 */

import { v2Client } from './v2Api';

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
  history: any[];
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
  kafkaTopics: any[];
  datasets: any[];
  factoryModules: any[];
}

// ─── API Implementation ──────────────────────────────────────────────────────

export const adminApi = {
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
  }
};

export default adminApi;
