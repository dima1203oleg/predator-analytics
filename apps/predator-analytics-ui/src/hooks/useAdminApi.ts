/**
 * PREDATOR Analytics v58.2-WRAITH — Admin API Hooks
 * React Query hooks for Infrastructure, Agents, Failover.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type InfraTelemetryResponse, type FailoverStatus, type AgentStats, type GitOpsStatus, type DataOpsStatus, type SecuritySession, type SecurityApiKey } from '../services/adminApi';

const ADMIN_KEYS = {
  telemetry: ['admin', 'telemetry'] as const,
  failover: ['admin', 'failover'] as const,
  agents: ['admin', 'agents'] as const,
  gitops: ['admin', 'gitops'] as const,
  dataops: ['admin', 'dataops'] as const,
  audit: ['admin', 'audit'] as const,
  sessions: ['admin', 'security', 'sessions'] as const,
  keys: ['admin', 'security', 'keys'] as const,
  systemStatus: ['admin', 'system', 'status'] as const,
  systemStats: ['admin', 'system', 'stats'] as const,
  systemNodes: ['admin', 'system', 'nodes'] as const,
  aiEngines: ['admin', 'system', 'engines'] as const,
  systemLogs: ['admin', 'system', 'logs'] as const,
};

// ─── System & AI ─────────────────────────────────────────────────────────────

export function useSystemStatus() {
  return useQuery({
    queryKey: ADMIN_KEYS.systemStatus,
    queryFn: () => adminApi.system.getStatus(),
    refetchInterval: 10000,
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.systemStats,
    queryFn: () => adminApi.system.getStats(),
    refetchInterval: 2000, // Faster for meters
  });
}

export function useAIEngines() {
  return useQuery({
    queryKey: ADMIN_KEYS.aiEngines,
    queryFn: () => adminApi.system.getEngines(),
    refetchInterval: 5000,
  });
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ADMIN_KEYS.systemLogs,
    queryFn: () => adminApi.system.getLogs(),
    refetchInterval: 8000,
  });
}

export function useSystemNodes() {
  return useQuery({
    queryKey: ADMIN_KEYS.systemNodes,
    queryFn: () => adminApi.system.getNodes(),
    refetchInterval: 5000,
  });
}

// ─── Telemetry ───────────────────────────────────────────────────────────────

export function useInfraTelemetry() {
  return useQuery<InfraTelemetryResponse>({
    queryKey: ADMIN_KEYS.telemetry,
    queryFn: () => adminApi.infra.getTelemetry(),
    refetchInterval: 3000, // Real-time poll every 3s
    staleTime: 2000,
  });
}

// ─── Failover ───────────────────────────────────────────────────────────────

export function useFailoverStatus() {
  return useQuery<FailoverStatus>({
    queryKey: ADMIN_KEYS.failover,
    queryFn: () => adminApi.failover.getStatus(),
    staleTime: 10000,
  });
}

export function useToggleFailover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (node: string) => adminApi.failover.toggle(node),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.failover });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.telemetry });
    },
  });
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export function useAgentsStats() {
  return useQuery<AgentStats>({
    queryKey: ADMIN_KEYS.agents,
    queryFn: () => adminApi.agents.getStats(),
    refetchInterval: 5000,
  });
}

// ─── GitOps ──────────────────────────────────────────────────────────────────

export function useGitOpsStatus() {
  return useQuery<GitOpsStatus>({
    queryKey: ADMIN_KEYS.gitops,
    queryFn: () => adminApi.gitops.getStatus(),
    refetchInterval: 10000,
  });
}

// ─── DataOps ─────────────────────────────────────────────────────────────────

export function useDataOpsStatus() {
  return useQuery<DataOpsStatus>({
    queryKey: ADMIN_KEYS.dataops,
    queryFn: () => adminApi.dataops.getStatus(),
    refetchInterval: 10000,
  });
}

// ─── Security Audit ──────────────────────────────────────────────────────────

export function useAuditLogs() {
  return useQuery({
    queryKey: ADMIN_KEYS.audit,
    queryFn: () => adminApi.security.getAuditLogs(),
    staleTime: 30000,
  });
}

export function useSecuritySessions() {
  return useQuery<SecuritySession[]>({
    queryKey: ADMIN_KEYS.sessions,
    queryFn: () => adminApi.security.getSessions(),
    refetchInterval: 10000,
  });
}

export function useSecurityKeys() {
  return useQuery<SecurityApiKey[]>({
    queryKey: ADMIN_KEYS.keys,
    queryFn: () => adminApi.security.getKeys(),
    staleTime: 60000,
  });
}

// ─── Generic Hook ────────────────────────────────────────────────────────────

/**
 * useAdminApi — Універсальний хук для доступу до адмін-панелі.
 * Дозволяє використовувати один інтерфейс для різних типів даних.
 */
export function useAdminApi(key: keyof typeof ADMIN_KEYS): any {
  const map: Record<keyof typeof ADMIN_KEYS, () => any> = {
    telemetry: useInfraTelemetry,
    failover: useFailoverStatus,
    agents: useAgentsStats,
    gitops: useGitOpsStatus,
    dataops: useDataOpsStatus,
    audit: useAuditLogs,
    sessions: useSecuritySessions,
    keys: useSecurityKeys,
    systemStatus: useSystemStatus,
    systemStats: useSystemStats,
    systemNodes: useSystemNodes,
    aiEngines: useAIEngines,
    systemLogs: useSystemLogs,
  };

  const hook = map[key];
  if (!hook) {
    throw new Error(`[PREDATOR] Unknown useAdminApi key: ${key}`);
  }

  return hook();
}
