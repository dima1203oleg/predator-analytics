/**
 * 🦅 PREDATOR Analytics v58.5-ELITE — Dashboard Hooks
 * TanStack Query хуки для головного командного дашборду.
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardOverview, type DashboardAlert } from '../services/api/dashboard';

const DASHBOARD_KEYS = {
  overview: ['dashboard', 'overview'] as const,
  alerts:   ['dashboard', 'alerts'] as const,
};

/**
 * Хук для отримання глобальної статистики дашборду.
 * Оновлюється кожні 30 секунд.
 */
export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: DASHBOARD_KEYS.overview,
    queryFn: () => dashboardApi.getOverview(),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

/**
 * Хук для отримання активних алертів.
 * Оновлюється кожні 10 секунд (критично для моніторингу).
 */
export function useDashboardAlerts(limit: number = 10) {
  return useQuery<{ items: DashboardAlert[] }>({
    queryKey: [...DASHBOARD_KEYS.alerts, limit],
    queryFn: () => dashboardApi.getAlerts(limit),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
