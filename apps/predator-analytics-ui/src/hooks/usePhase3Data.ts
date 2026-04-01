/**
 * Custom Hooks для Phase 3 Components
 * Укр: Хуки для підключення компонентів до даних
 *
 * Використовують TanStack Query для:
 * - Кешування
 * - Фонової синхронізації
 * - Управління помилками
 * - Рефетчування
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as api from '@/services/api';

// ============================================================================
// 👥 CUSTOMER SUCCESS HOOKS
// ============================================================================

export function useCustomerHealthScores() {
  return useQuery({
    queryKey: ['customers', 'health'],
    queryFn: api.getCustomerHealthScores,
    staleTime: 5 * 60 * 1000, // 5 хвилин
    refetchInterval: 30 * 1000, // Рефетч кожні 30 сек для live updates
  });
}

export function useCustomerHealthMetrics() {
  const { data = [] } = useCustomerHealthScores();

  return {
    totalCustomers: data.length,
    healthyCount: data.filter((c) => c.healthScore >= 80).length,
    atRiskCount: data.filter((c) => c.churnRisk === 'high').length,
    avgHealthScore: data.length > 0 ? Math.round(data.reduce((sum, c) => sum + c.healthScore, 0) / data.length) : 0,
    totalMRR: data.reduce((sum, c) => sum + c.mrr, 0),
    avgMRR: data.length > 0 ? Math.round(data.reduce((sum, c) => sum + c.mrr, 0) / data.length) : 0,
  };
}

// ============================================================================
// 📊 ANALYTICS HOOKS
// ============================================================================

export function useAnalyticsMetrics() {
  return useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: api.getAnalyticsMetrics,
    staleTime: 60 * 1000, // 1 хвилина
    refetchInterval: 60 * 1000, // Рефетч кожну хвилину
  });
}

export function useUsageHeatmap() {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: api.getUsageHeatmap,
    staleTime: 10 * 60 * 1000, // 10 хвилин
  });
}

export function useAnalyticsRefresh() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);
}

// ============================================================================
// 📋 REPORTING HOOKS
// ============================================================================

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: api.getReports,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useCallback(
    async (reportData: any) => {
      const newReport = await api.createReport(reportData);
      // Інвалідувати кеш щоб рефетчити список
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      return newReport;
    },
    [queryClient],
  );
}

export function useReportSchedules() {
  const { data = [] } = useReports();

  return {
    activeReports: data.filter((r) => r.status === 'active').length,
    totalRecipients: data.reduce((sum, r) => sum + r.recipients.length, 0),
    nextRun: data.length > 0 ? data[0].nextRun : null,
  };
}

// ============================================================================
// 🔌 INTEGRATION HOOKS
// ============================================================================

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: api.getIntegrations,
    staleTime: 2 * 60 * 1000, // 2 хвилини
    refetchInterval: 60 * 1000, // Рефетч кожну хвилину
  });
}

export function useIntegrationStatus() {
  const { data = [] } = useIntegrations();

  return {
    connectedCount: data.filter((i) => i.status === 'connected').length,
    totalIntegrations: data.length,
    errorCount: data.filter((i) => i.status === 'error').length,
    totalEvents: data.reduce((sum, i) => sum + i.events, 0),
  };
}

// ============================================================================
// ⚙️ SETTINGS HOOKS
// ============================================================================

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: api.getOrganization,
    staleTime: 30 * 60 * 1000, // 30 хвилин
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team', 'members'],
    queryFn: api.getTeamMembers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit', 'log'],
    queryFn: () => api.getAuditLog(50),
    staleTime: 60 * 1000, // 1 хвилина
  });
}

// ============================================================================
// 📈 COMBINED METRICS HOOKS
// ============================================================================

export function usePlatformDashboard() {
  const analyticsMetrics = useAnalyticsMetrics();
  const customerMetrics = useCustomerHealthMetrics();
  const integrationStatus = useIntegrationStatus();
  const reportSchedules = useReportSchedules();

  const isLoading = analyticsMetrics.isLoading;
  const error = analyticsMetrics.error || null;

  return {
    analytics: analyticsMetrics.data,
    customers: customerMetrics,
    integrations: integrationStatus,
    reports: reportSchedules,
    isLoading,
    error,
  };
}

// ============================================================================
// 🔄 REAL-TIME SUBSCRIPTIONS (Future WebSocket support)
// ============================================================================

/**
 * Hook для підписки на real-time оновлення (коли WebSocket буде готовий)
 * For now uses polling via refetchInterval
 */
export function useRealtimeMetrics(channel: 'analytics' | 'customers' | 'integrations') {
  const queries: any = {
    analytics: useAnalyticsMetrics(),
    customers: useCustomerHealthScores(),
    integrations: useIntegrations(),
  };

  return queries[channel] || queries.analytics;
}

// ============================================================================
// 📊 DATA EXPORT HOOKS
// ============================================================================

export function useExportData(format: 'json' | 'csv' = 'json') {
  return useCallback(
    async (data: any[], filename: string) => {
      let content: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      } else {
        // Simple CSV conversion
        const headers = Object.keys(data[0] || {});
        const rows = data.map((obj) => headers.map((h) => JSON.stringify(obj[h] || '')).join(','));
        content = [headers.join(','), ...rows].join('\n');
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [format],
  );
}

// ============================================================================
// 🔍 SEARCH & FILTER HOOKS
// ============================================================================

export function useCustomerSearch(query: string) {
  const { data = [], isLoading } = useCustomerHealthScores();

  const filtered = data.filter(
    (customer) =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email.toLowerCase().includes(query.toLowerCase()),
  );

  return { results: filtered, isLoading, totalCount: data.length };
}

export function useIntegrationFilter(status?: 'connected' | 'error' | 'disconnected') {
  const { data = [], isLoading } = useIntegrations();

  const filtered = status ? data.filter((i) => i.status === status) : data;

  return { integrations: filtered, isLoading, totalCount: data.length };
}
