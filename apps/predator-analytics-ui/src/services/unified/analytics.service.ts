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

import { RiskEntity } from '@/types/intelligence';

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
  /**
   * Запустити AML скорінг для сутності
   */
  async getAMLScore(entity_id: string, entity_name: string, entity_type: 'organization' | 'person'): Promise<any> {
    try {
      const res = await apiClient.post('/analytics/aml/score', {
        entity_id,
        entity_name,
        entity_type,
        data: {},
      });
      return res.data;
    } catch (err) {
      console.error('[AnalyticsService] getAMLScore помилка:', err);
      throw err;
    }
  }

  /**
   * Запустити пакетний AML скорінг
   */
  async getAMLBatch(entities: { entity_id: string, entity_name: string, entity_type: string }[]): Promise<any> {
    try {
      const res = await apiClient.post('/analytics/aml/batch', {
        entities: entities.map(e => ({ ...e, data: {} })),
      });
      return res.data;
    } catch (err) {
      console.error('[AnalyticsService] getAMLBatch помилка:', err);
      throw err;
    }
  }

  /**
   * Отримати налаштування рівнів ризику
   */
  async getAMLRiskLevels(): Promise<any> {
    try {
      const res = await apiClient.get('/analytics/aml/risk-levels');
      return res.data?.levels || [];
    } catch (err) {
      console.warn('[AnalyticsService] getAMLRiskLevels API недоступний:', err);
      return [];
    }
  }
  /**
   * Отримати обсяги торгівлі (Trade Volume)
   */
  async getTradeVolume(range: string = '1m'): Promise<any[]> {
    try {
      const res = await apiClient.get(`/analytics/customs/volume?range=${range}`);
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getTradeVolume API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати структуру категорій товарів
   */
  async getCategoryStructure(): Promise<any[]> {
    try {
      const res = await apiClient.get('/analytics/customs/categories');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getCategoryStructure API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати топ імпортерів
   */
  async getTopImporters(limit: number = 5): Promise<any[]> {
    try {
      const res = await apiClient.get(`/analytics/customs/top-importers?limit=${limit}`);
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getTopImporters API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати сигнали митних ризиків
   */
  async getRiskAlerts(): Promise<any[]> {
    try {
      const res = await apiClient.get('/analytics/customs/risks');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getRiskAlerts API недоступний:', err);
      return [];
    }
  }
  /**
   * Отримати геополітичні гарячі точки
   */
  async getGeopoliticalHotspots(): Promise<any[]> {
    try {
      const res = await apiClient.get('/analytics/geopolitical/hotspots');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getGeopoliticalHotspots API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати глобальний профіль ризику
   */
  async getGlobalRiskProfile(): Promise<any> {
    try {
      const res = await apiClient.get('/analytics/geopolitical/profile');
      return res.data;
    } catch (err) {
      console.warn('[AnalyticsService] getGlobalRiskProfile API недоступний:', err);
      return null;
    }
  }

  /**
   * 💰 FINANCIAL SIGINT // ФІНАНСОВА РОЗВІДКА
   * Отримує комплексний зріз фінансової розвідки: SWIFT, офшори, заморожені активи.
   */
  async getFinancialSigint(ueid?: string): Promise<any> {
    try {
      if (ueid) {
        // Якщо вказано конкретний ідентифікатор - генеруємо звіт за ним
        const res = await apiClient.get(`/intelligence/report/${ueid}`);
        return res.data;
      }
      
      // В іншому випадку отримуємо загальний потік через фінансовий API
      const res = await apiClient.post('/finance/portfolio-risk/var', {});
      return res.data;
    } catch (err) {
      console.warn('[AnalyticsService] getFinancialSigint API недоступний або стався збій:', err);
      return null;
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
