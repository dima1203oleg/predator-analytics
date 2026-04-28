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

export interface AMLFactor {
  id: string;
  name: string;
  category: string;
  score: number;
  weight: number;
  detected: boolean;
  description: string;
  evidence_count: number;
}

export interface AMLResult {
  total_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: AMLFactor[];
  summary: string;
  calculated_at: string;
  entity_id: string;
  entity_name: string;
  entity_type: 'organization' | 'person';
  recommendations?: string[];
  meta: {
    node_source: string;
    latency_ms: number;
    stability_score: number;
    timestamp: string;
  };
}

export interface SwiftFlowData {
  hour: string;
  normal: number;
  suspicious: number;
}

export interface OffshoreData {
  name: string;
  value: number;
  amount: string;
  color: string;
}

export interface SuspiciousTx {
  id: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  time: string;
  risk: number;
  type: string;
  route: string;
}

export interface FrozenAsset {
  entity: string;
  amount: string;
  date: string;
  authority: string;
  reason: string;
  status: string;
}

export interface AmlRadarData {
  subject: string;
  A: number;
  B: number;
}

export interface TransactionFlow {
  source: string;
  target: string;
  value: number;
  /** Альтернативне ім'я джерела (зворотна сумісність) */
  from?: string;
  /** Альтернативне ім'я цілі (зворотна сумісність) */
  to?: string;
  /** Сума транзакції (зворотна сумісність з amount) */
  amount?: number;
  /** Валюта транзакції */
  currency?: string;
  /** Дата транзакції */
  date?: string;
  /** Оцінка ризику (0-1) */
  risk_score?: number;
}

export interface FinancialSigintResult {
  swift: SwiftFlowData[];
  offshore: OffshoreData[];
  suspicious: SuspiciousTx[];
  frozen: FrozenAsset[];
  aml: AmlRadarData[];
  flow?: TransactionFlow[];
}

export interface UBONode {
  id: string;
  name: string;
  type: 'person' | 'company' | 'offshore' | 'state';
  share?: number;
  nationality?: string;
  risk: number; // 0-100
  pep?: boolean;
  sanctioned?: boolean;
  country?: string;
  children?: UBONode[];
}

export interface BatchResultData {
  total: number;
  total_processed?: number;
  distribution: Record<string, number>;
  scores: (AMLResult & { 
    entity_id: string; 
    entity_name: string; 
    detected_factors: number;
  })[];
  results?: (AMLResult & { 
    entity_id: string; 
    entity_name: string; 
    detected_factors: number;
  })[];
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
  async getAMLScore(entity_id: string, entity_name: string, entity_type: 'organization' | 'person'): Promise<AMLResult> {
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
  async getAMLBatch(entities: { entity_id: string, entity_name: string, entity_type: string }[]): Promise<BatchResultData> {
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
   * Отримати карту бенефіціарів (UBO Map)
   */
  async getUBOMap(ueid: string): Promise<UBONode | null> {
    try {
      const res = await apiClient.get(`/intelligence/ubo-map/${ueid}`);
      return res.data;
    } catch (err) {
      console.warn('[AnalyticsService] getUBOMap API недоступний:', err);
      return null;
    }
  }

  /**
   * Пошук компаній за запитом
   */
  async searchCompanies(query: string): Promise<any[]> {
    try {
      const res = await apiClient.get('/company/search', { params: { q: query } });
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] searchCompanies API недоступний:', err);
      return [];
    }
  }

  /**
   * Отримати потік сигналів (Signal Feed)
   */
  async getSignalFeed(): Promise<any[]> {
    try {
      const res = await apiClient.get('/telegram/feed');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch (err) {
      console.warn('[AnalyticsService] getSignalFeed API недоступний:', err);
      return [];
    }
  }

  /**
   * 🏛️ PROZORRO INTELLIGENCE // КОНТУ�  ЗАКУПІВЕЛЬ
   */
  async getTenders(limit: number = 24): Promise<any[]> {
    try {
      const res = await apiClient.get('/osint_ua/prozorro/tenders', { params: { limit } });
      return res.data?.tenders || [];
    } catch (err) {
      console.warn('[AnalyticsService] getTenders API недоступний:', err);
      return [];
    }
  }

  async getTenderStats(): Promise<any> {
    try {
      const res = await apiClient.get('/osint_ua/prozorro/stats');
      return res.data;
    } catch (err) {
      console.warn('[AnalyticsService] getTenderStats API недоступний:', err);
      return null;
    }
  }

  /**
   * 💰 FINANCIAL SIGINT // ФІНАНСОВА � ОЗВІДКА
   * Отримує комплексний зріз фінансової розвідки: SWIFT, офшори, заморожені активи.
   */
  async getFinancialSigint(ueid?: string): Promise<FinancialSigintResult | null> {
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
