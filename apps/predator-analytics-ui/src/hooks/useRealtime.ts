import { useState, useEffect } from 'react';
import { realTimeDataService, RealTimeMetrics, RealTimeAlert, SystemStatus } from '@/services/realtime.service';

export const useRealtimeMetrics = (intervalMs = 5000) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      const data = await realTimeDataService.getMetrics();
      if (mounted) setMetrics(data);
    };
    fetch();
    const interval = setInterval(fetch, intervalMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return metrics;
};

export const useRealtimeAlerts = (limit = 20, intervalMs = 5000) => {
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      const data = await realTimeDataService.getAlerts(limit);
      if (mounted) setAlerts(data);
    };
    fetch();
    const interval = setInterval(fetch, intervalMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [limit, intervalMs]);

  return alerts;
};

export const useSystemStatus = (intervalMs = 10000) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      const data = await realTimeDataService.getSystemStatus();
      if (mounted) setStatus(data);
    };
    fetch();
    const interval = setInterval(fetch, intervalMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return status;
};
