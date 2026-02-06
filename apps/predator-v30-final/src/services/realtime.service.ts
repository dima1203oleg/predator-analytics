/**
 * PREDATOR V30 - Real-Time Data Service
 * Централізований сервіс для отримання реальних даних з бекенду
 * Замінює всі mock/симуляції на справжні API виклики
 */

import { api } from './api';

export interface RealTimeMetrics {
  alerts: number;
  opportunities: number;
  riskScore: number;
  marketScore: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  documentsProcessed: number;
}

export interface RealTimeAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SystemStatus {
  healthy: boolean;
  services: { name: string; status: string; latency?: number }[];
  uptime: string;
  version: string;
}

class RealTimeDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data;
    }
    return null;
  }

  /**
   * Отримати ключові метрики системи
   */
  async getMetrics(): Promise<RealTimeMetrics> {
    const cacheKey = 'metrics';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const [statsRes, alertsRes] = await Promise.allSettled([
        fetch('/api/v1/stats/system'),
        fetch('/api/v1/alerts?limit=100')
      ]);

      let stats: any = {};
      let alerts: any[] = [];

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        stats = await statsRes.value.json();
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const alertData = await alertsRes.value.json();
        alerts = alertData.alerts || alertData || [];
      }

      const metrics: RealTimeMetrics = {
        alerts: alerts.filter((a: any) => !a.acknowledged).length,
        opportunities: alerts.filter((a: any) => a.type === 'opportunity').length,
        riskScore: stats.risk_score || 0,
        marketScore: stats.market_score || 0,
        cpuUsage: stats.cpu_usage || 0,
        memoryUsage: stats.memory_usage || 0,
        activeConnections: stats.active_connections || 0,
        documentsProcessed: stats.documents_processed || stats.total_documents || 0
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      return {
        alerts: 0,
        opportunities: 0,
        riskScore: 0,
        marketScore: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0,
        documentsProcessed: 0
      };
    }
  }

  /**
   * Отримати активні алерти/сповіщення
   */
  async getAlerts(limit: number = 20): Promise<RealTimeAlert[]> {
    const cacheKey = `alerts-${limit}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/v1/alerts?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        const alerts: RealTimeAlert[] = (data.alerts || data || []).map((a: any) => ({
          id: a.id || a._id || Math.random().toString(36).substr(2, 9),
          type: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info',
          title: a.title || a.message || 'Alert',
          summary: a.description || a.summary || '',
          source: a.source || 'PREDATOR',
          timestamp: a.timestamp || a.created_at || new Date().toISOString(),
          acknowledged: a.acknowledged || false
        }));

        this.setCache(cacheKey, alerts);
        return alerts;
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }

    return [];
  }

  /**
   * Отримати статус системи
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const cacheKey = 'system-status';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/v1/health');
      if (response.ok) {
        const data = await response.json();

        const status: SystemStatus = {
          healthy: data.status === 'ok' || data.healthy === true,
          services: Object.entries(data.services || {}).map(([name, info]: [string, any]) => ({
            name,
            status: info.status || (info.healthy ? 'healthy' : 'error'),
            latency: info.latency
          })),
          uptime: data.uptime || 'N/A',
          version: data.version || 'v30.0'
        };

        this.setCache(cacheKey, status);
        return status;
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }

    return {
      healthy: false,
      services: [],
      uptime: 'N/A',
      version: 'N/A'
    };
  }

  /**
   * Отримати статистику інгесту даних
   */
  async getIngestionStats(days: number = 7): Promise<{ total: number; today: number; timeline: { date: string; count: number }[] }> {
    try {
      const response = await fetch(`/api/v1/stats/ingestion?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        return {
          total: data.total_documents || data.total || 0,
          today: data.documents_today || data.today || 0,
          timeline: (data.timeline || []).map((t: any) => ({
            date: t.date || t.period,
            count: t.count || t.documents || 0
          }))
        };
      }
    } catch (err) {
      console.error('Failed to fetch ingestion stats:', err);
    }

    return { total: 0, today: 0, timeline: [] };
  }

  /**
   * Отримати пошукову статистику
   */
  async getSearchStats(days: number = 7): Promise<{ total: number; avgLatency: number; popularQueries: string[] }> {
    try {
      const response = await fetch(`/api/v1/stats/search?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        return {
          total: data.total_searches || data.total || 0,
          avgLatency: data.avg_response_time || data.avg_latency || 0,
          popularQueries: data.popular_queries || []
        };
      }
    } catch (err) {
      console.error('Failed to fetch search stats:', err);
    }

    return { total: 0, avgLatency: 0, popularQueries: [] };
  }

  /**
   * Очистити кеш
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const realTimeDataService = new RealTimeDataService();
