/**
 * 🔄 React Query Configuration
 *
 * Centralized query client with optimized defaults for PREDATOR.
 * Provides smart caching, background refetching, and error handling.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create optimized query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: 30 * 1000, // 30 seconds - data is fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection (formerly cacheTime)

      // Refetching behavior
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Retry behavior
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst',

      // Placeholder data is shown while loading
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // System
  systemStats: ['stats', 'system'] as const,
  systemHealth: ['health'] as const,

  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,

  // Alerts & Signals
  alerts: (filters?: Record<string, unknown>) => ['alerts', filters] as const,
  signals: (filters?: Record<string, unknown>) => ['signals', filters] as const,

  // Graph
  graph: ['graph'] as const,
  graphSummary: ['graph', 'summary'] as const,
  graphNodes: (nodeId?: string) => ['graph', 'nodes', nodeId] as const,

  // Cases
  cases: (filters?: Record<string, unknown>) => ['cases', filters] as const,
  caseDetail: (caseId: string) => ['cases', caseId] as const,

  // Documents
  documents: (filters?: Record<string, unknown>) => ['documents', filters] as const,
  documentDetail: (docId: string) => ['documents', docId] as const,

  // Agents
  agents: ['agents'] as const,
  agentStatus: (agentId: string) => ['agents', agentId, 'status'] as const,

  // LLM
  llmProviders: ['llm', 'providers'] as const,
  llmHealth: ['llm', 'health'] as const,

  // Training
  trainingStatus: ['training', 'status'] as const,
  trainingSessions: ['training', 'sessions'] as const,

  // Categories
  categories: (type?: string) => ['categories', type] as const,
  categoryStats: ['categories', 'stats'] as const,

  // Premium
  premiumFeatures: ['premium', 'features'] as const,
  competitorIntel: ['premium', 'competitor'] as const,
  executiveBrief: ['premium', 'brief'] as const,

  // Real-time (for WebSocket fallback)
  realtimeMetrics: ['realtime', 'metrics'] as const,
};

// Prefetch helper for route transitions
export const prefetchOnRouteChange = async (route: string) => {
  switch (route) {
    case '/':
    case '/overview':
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: queryKeys.systemStats }),
        queryClient.prefetchQuery({ queryKey: queryKeys.dashboardStats }),
      ]);
      break;
    case '/monitoring':
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: queryKeys.systemHealth }),
        queryClient.prefetchQuery({ queryKey: queryKeys.alerts() }),
      ]);
      break;
    case '/agents':
      await queryClient.prefetchQuery({ queryKey: queryKeys.agents });
      break;
    case '/llm':
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: queryKeys.llmProviders }),
        queryClient.prefetchQuery({ queryKey: queryKeys.llmHealth }),
      ]);
      break;
    case '/graph':
      await queryClient.prefetchQuery({ queryKey: queryKeys.graphSummary });
      break;
  }
};

// Provider component
interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Invalidation helpers
export const invalidateQueries = {
  all: () => queryClient.invalidateQueries(),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  system: () => queryClient.invalidateQueries({ queryKey: ['stats'] }),
  alerts: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  agents: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents }),
  llm: () => queryClient.invalidateQueries({ queryKey: ['llm'] }),
  training: () => queryClient.invalidateQueries({ queryKey: ['training'] }),
  graph: () => queryClient.invalidateQueries({ queryKey: queryKeys.graph }),
};

export default queryClient;
