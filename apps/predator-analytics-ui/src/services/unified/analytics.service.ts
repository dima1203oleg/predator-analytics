import { apiClient } from '../api/config';

export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: any;
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

export interface TimeSeriesData {
  name: string;
  value: number;
  prediction?: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface RegionData {
  name: string;
  imports: number;
  exports: number;
}

export interface SchemeData {
  id: string;
  name: string;
  probability: number;
  impact: number;
  entities: string[];
  description: string;
  type: 'carousel' | 'price' | 'transit' | 'offshore';
}

export interface RiskEntity {
  id: string;
  name: string;
  type: 'company' | 'person' | 'location';
  riskScore: number;
  flags: string[];
  connections: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Отримати прогноз (Forecast)
   */
  async getForecast(): Promise<TimeSeriesData[]> {
    try {
      const res = await apiClient.get('/analytics/forecast');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getForecast API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати структуру ринку (Pie Chart)
   */
  async getMarketStructure(): Promise<PieChartData[]> {
    try {
      const res = await apiClient.get('/analytics/market-structure');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getMarketStructure API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати регіональну активність (Regional Activity)
   */
  async getRegionalActivity(): Promise<RegionData[]> {
    try {
      const res = await apiClient.get('/analytics/regional-activity');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getRegionalActivity API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати зведену аналітику для дашборду
   */
  async getDashboardMetrics(timeRange: string = '1m'): Promise<AnalyticsMetric[]> {
    try {
      const res = await apiClient.get(`/analytics/dashboard-metrics?range=${timeRange}`);
      return Array.isArray(res.data) ? res.data : res.data?.metrics || [];
    } catch (err) {
      console.warn('[AnalyticsService] getDashboardMetrics API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати список ризикових суб'єктів
   */
  async getHighRiskEntities(limit: number = 10): Promise<RiskEntity[]> {
    try {
      const res = await apiClient.get(`/risk/entities?limit=${limit}&min_score=60`);
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getHighRiskEntities API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати виявлені схеми
   */
  async getDetectedSchemes(): Promise<SchemeData[]> {
    try {
      const res = await apiClient.get('/intelligence/schemes');
      return Array.isArray(res.data) ? res.data : res.data?.schemes || [];
    } catch (err) {
      console.warn('[AnalyticsService] getDetectedSchemes API недоступний:', err);
      return [];
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
