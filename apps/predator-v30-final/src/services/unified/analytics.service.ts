import { api } from '../api';

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
  name: string; // e.g., "Carousel Fraud", "Under-invoicing"
  probability: number; // 0-100
  impact: number; // Estimated loss in UAH
  entities: string[]; // Names of involved companies
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
    // Mock data
    return [
      { name: 'Jan', value: 4000, prediction: 4200 },
      { name: 'Feb', value: 3000, prediction: 3100 },
      { name: 'Mar', value: 5000, prediction: 5300 },
      { name: 'Apr', value: 2780, prediction: 2900 },
      { name: 'May', value: 1890, prediction: 2100 },
      { name: 'Jun', value: 2390, prediction: 2500 },
      { name: 'Jul', value: 3490, prediction: 3600 },
    ];
  }

  /**
   * Отримати структуру ринку (Pie Chart)
   */
  async getMarketStructure(): Promise<PieChartData[]> {
    return [
      { name: 'Electronics', value: 400, color: '#0088FE' },
      { name: 'Automotive', value: 300, color: '#00C49F' },
      { name: 'Textile', value: 300, color: '#FFBB28' },
      { name: 'Agriculture', value: 200, color: '#FF8042' },
    ];
  }

  /**
   * Отримати регіональну активність (Regional Activity)
   */
  async getRegionalActivity(): Promise<RegionData[]> {
    return [
      { name: 'USA', imports: 4000, exports: 2400 },
      { name: 'China', imports: 3000, exports: 1398 },
      { name: 'Germany', imports: 2000, exports: 9800 },
      { name: 'Poland', imports: 2780, exports: 3908 },
      { name: 'Turkey', imports: 1890, exports: 4800 },
    ];
  }

  /**
   * Отримати зведену аналітику для дашборду
   */
  async getDashboardMetrics(timeRange: string = '1m'): Promise<AnalyticsMetric[]> {
    return [
      { label: 'Total Declarations', value: 12450, change: 12.5, trend: 'up' },
      { label: 'Risk Detected', value: 156, change: -5.2, trend: 'down' },
      { label: 'Total Value (USD)', value: 45000000, change: 8.4, trend: 'up' },
      { label: 'Active Entities', value: 2340, change: 2.1, trend: 'up' }
    ];
  }

  /**
   * Отримати список ризикових суб'єктів (для "гачка")
   */
  async getHighRiskEntities(limit: number = 10): Promise<RiskEntity[]> {
    return [
      { id: '1', name: 'Global Trade LLC', type: 'company', riskScore: 88, flags: ['Under-invoicing', 'Shell Company'], connections: 12 },
      { id: '2', name: 'Ivanov Petro', type: 'person', riskScore: 75, flags: ['Sanctions', 'Politically Exposed'], connections: 5 },
      { id: '3', name: 'Sea Port South', type: 'location', riskScore: 60, flags: ['High Corruption Zone'], connections: 150 },
    ];
  }

  async getDetectedSchemes(): Promise<SchemeData[]> {
    // Mock data for "Hook" detection
    return [
      {
        id: 'SCH-2024-001',
        name: 'Транзитний Перерваний Потік',
        probability: 94,
        impact: 4500000,
        entities: ['ТОВ "Мега-Імпорт"', 'Fictitious Ltd (BVI)', 'ТОВ "Прокладка-А"'],
        description: 'Товар заявлено в режим транзиту, але вивантажено на внутрішньому складі без сплати мита.',
        type: 'transit'
      },
      {
        id: 'SCH-2024-002',
        name: 'Ланцюгове Заниження Вартості',
        probability: 87,
        impact: 1200000,
        entities: ['Alpha Suppliers Inc', 'ТОВ "Брок-Сервіс"', 'ФОП Іваненко'],
        description: 'Ціна товару зменшується на 40% через ланцюг пов\'язаних посередників перед розмитненням.',
        type: 'price'
      }
    ];
  }
}

export const analyticsService = AnalyticsService.getInstance();
