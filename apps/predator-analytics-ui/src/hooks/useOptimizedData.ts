/**
 * 📊 Optimized Data Hooks
 *
 * React Query hooks with proper caching, loading states, and error handling.
 * These hooks replace direct API calls and provide consistent UX.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../providers/QueryProvider';
import { api } from '../services/api';

// ========================
// System Stats Hook
// ========================

interface SystemStats {
  cpu: { percent: number; cores: number };
  memory: { total: number; used: number; percent: number; available: number };
  disk: { total: number; used: number; free: number; percent: number };
  uptime?: number;
}

export const useSystemStats = () => {
  return useQuery({
    queryKey: queryKeys.systemStats,
    queryFn: async (): Promise<SystemStats> => {
      const response = await api.stats.getSystemStats();
      return (response as any).data || response;
    },
    staleTime: 10 * 1000, // 10 seconds for system stats
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    placeholderData: {
      cpu: { percent: 0, cores: 0 },
      memory: { total: 0, used: 0, percent: 0, available: 0 },
      disk: { total: 0, used: 0, free: 0, percent: 0 }
    }
  });
};

// ========================
// Alerts Hook
// ========================

interface Alert {
  id: string;
  title: string;
  level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  source?: string;
  resolved?: boolean;
}

interface UseAlertsOptions {
  level?: string;
  limit?: number;
  resolved?: boolean;
  [key: string]: any;
}

export const useAlerts = (options: UseAlertsOptions = {}) => {
  return useQuery({
    queryKey: queryKeys.alerts(options),
    queryFn: async (): Promise<Alert[]> => {
      try {
        const response = await api.alerts.getActive();
        return response.data?.alerts || response.alerts || [];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

// ========================
// Graph Summary Hook
// ========================

interface GraphSummary {
  total_nodes: number;
  total_edges: number;
  node_types: Record<string, number>;
  avg_connections: number;
}

export const useGraphSummary = () => {
  return useQuery({
    queryKey: queryKeys.graphSummary,
    queryFn: async (): Promise<GraphSummary> => {
      try {
        const response = await api.graph.getSummary();
        return response.data || response;
      } catch {
        return {
          total_nodes: 0,
          total_edges: 0,
          node_types: {},
          avg_connections: 0
        };
      }
    },
    staleTime: 60 * 1000, // Graph data changes less frequently
  });
};

// ========================
// Agents Hook
// ========================

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'stopped';
  type: string;
  lastActivity?: string;
  metrics?: Record<string, number>;
}

export const useAgents = () => {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: async (): Promise<Agent[]> => {
      try {
        const response = await api.agents.getAll();
        return response.data?.agents || response.agents || [];
      } catch {
        return [];
      }
    },
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// ========================
// LLM Providers Hook
// ========================

interface LLMProvider {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  model?: string;
  latency?: number;
  tokensUsed?: number;
}

export const useLLMProviders = () => {
  return useQuery({
    queryKey: queryKeys.llmProviders,
    queryFn: async (): Promise<LLMProvider[]> => {
      try {
        const response = await api.llm.getProviders();
        return response.data?.providers || response.providers || [];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });
};

// ========================
// Training Status Hook
// ========================

interface TrainingStatus {
  isTraining: boolean;
  currentEpoch?: number;
  totalEpochs?: number;
  loss?: number;
  progress?: number;
  queueSize?: number;
}

export const useTrainingStatus = () => {
  return useQuery({
    queryKey: queryKeys.trainingStatus,
    queryFn: async (): Promise<TrainingStatus> => {
      try {
        const response = await api.training.getStatus();
        return response.data || response;
      } catch {
        return { isTraining: false, queueSize: 0 };
      }
    },
    staleTime: 5 * 1000, // Training status changes quickly
    refetchInterval: 10 * 1000,
  });
};

// ========================
// Category Stats Hook
// ========================

interface CategoryStat {
  category: string;
  count: number;
  growth?: number;
  trend?: 'up' | 'down' | 'stable';
}

export const useCategoryStats = () => {
  return useQuery({
    queryKey: queryKeys.categoryStats,
    queryFn: async (): Promise<CategoryStat[]> => {
      try {
        const response = await api.stats.getCategory();
        return response.data?.categories || response.categories || [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
};

// ========================
// Mutation Hooks
// ========================

export const useStartTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      return api.training.start(config);
    },
    onSuccess: () => {
      invalidateQueries.training();
    },
  });
};

export const useRefreshData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.systemStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts() }),
      ]);
    },
  });
};

// ========================
// Combined Dashboard Hook
// ========================

export const useDashboardData = () => {
  const stats = useSystemStats();
  const alerts = useAlerts({ limit: 5 });
  const training = useTrainingStatus();

  return {
    stats: stats.data,
    alerts: alerts.data,
    training: training.data,
    isLoading: stats.isLoading || alerts.isLoading || training.isLoading,
    isError: stats.isError || alerts.isError || training.isError,
    refetch: () => {
      stats.refetch();
      alerts.refetch();
      training.refetch();
    }
  };
};

export default {
  useSystemStats,
  useAlerts,
  useGraphSummary,
  useAgents,
  useLLMProviders,
  useTrainingStatus,
  useCategoryStats,
  useDashboardData,
};
