/**
 * useSystemMetricsLive — Єдиний хук для системних метрик.
 * Замінює дубльовані fetch у TopBar.tsx та MainLayout.tsx.
 */
import { useQuery } from '@tanstack/react-query';

export interface SystemMetrics {
  /** Використання CPU (%) */
  cpu: number;
  /** Використання RAM (%) */
  memory: number;
  /** Кількість записів у БД */
  records: number;
  /** Сигналів на годину */
  signals: number;
  /** Кількість нових сповіщень */
  alertCount: number;
  /** Час OODA циклу (сек) */
  oodaCycle: number;
}

const FALLBACK: SystemMetrics = {
  cpu: 0,
  memory: 0,
  records: 0,
  signals: 0,
  alertCount: 0,
  oodaCycle: 0,
};

/**
 * Живі системні метрики з автооновленням.
 * @param intervalMs — інтервал оновлення (за замовч. 10 сек)
 */
export const useSystemMetricsLive = (intervalMs = 10_000) => {
  return useQuery<SystemMetrics>({
    queryKey: ['system-metrics-live'],
    queryFn: async (): Promise<SystemMetrics> => {
      const [sysMetrics, dbStats, alertsRes] = await Promise.allSettled([
        fetch('/api/v1/system/metrics').then(r => r.json()),
        fetch('/api/v1/database/stats').then(r => r.json()),
        fetch('/api/v1/alerts?status=new').then(r => r.json()),
      ]);

      const sys = sysMetrics.status === 'fulfilled' ? sysMetrics.value : {};
      const db = dbStats.status === 'fulfilled' ? dbStats.value : {};
      const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value : {};

      return {
        cpu: Math.round(sys.cpu ?? 0),
        memory: Math.round(sys.memory ?? 0),
        records: db.postgresql?.records ?? 0,
        signals: Math.round((sys.events_per_second ?? 0) * 3600),
        alertCount: alerts?.items?.length ?? 0,
        oodaCycle: sys.ooda_cycle ?? 0,
      };
    },
    refetchInterval: intervalMs,
    staleTime: 5_000,
    gcTime: 30_000,
    placeholderData: FALLBACK,
    retry: 2,
    retryDelay: 3000,
  });
};
