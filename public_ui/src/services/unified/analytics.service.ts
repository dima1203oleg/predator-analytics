// Types
export interface TimeSeriesData {
  name: string;
  value: number;
  prediction: number;
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

// Mock Data
const MOCK_TIME_SERIES: TimeSeriesData[] = [
  { name: 'Січ', value: 4000, prediction: 2400 },
  { name: 'Лют', value: 3000, prediction: 1398 },
  { name: 'Бер', value: 2000, prediction: 9800 },
  { name: 'Кві', value: 2780, prediction: 3908 },
  { name: 'Тра', value: 1890, prediction: 4800 },
  { name: 'Чер', value: 2390, prediction: 3800 },
  { name: 'Лип', value: 3490, prediction: 4300 },
];

const MOCK_PIE_DATA: PieChartData[] = [
  { name: 'Експорт (ЄС)', value: 400, color: '#0088FE' },
  { name: 'Імпорт (Азія)', value: 300, color: '#00C49F' },
  { name: 'Внутрішній ринок', value: 300, color: '#FFBB28' },
  { name: 'Транзит', value: 200, color: '#FF8042' },
];

const MOCK_REGION_DATA: RegionData[] = [
  { name: 'Київ', imports: 4000, exports: 2400 },
  { name: 'Львів', imports: 3000, exports: 1398 },
  { name: 'Одеса', imports: 2000, exports: 9800 },
  { name: 'Дніпро', imports: 2780, exports: 3908 },
  { name: 'Харків', imports: 1890, exports: 4800 },
  { name: 'Вінниця', imports: 2390, exports: 3800 },
];

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AnalyticsService {
  async getForecast(): Promise<TimeSeriesData[]> {
    await delay(800 + Math.random() * 500); // Simulate variable latency
    return MOCK_TIME_SERIES;
  }

  async getMarketStructure(): Promise<PieChartData[]> {
    await delay(600 + Math.random() * 300);
    return MOCK_PIE_DATA;
  }

  async getRegionalActivity(): Promise<RegionData[]> {
    await delay(1000 + Math.random() * 500);
    return MOCK_REGION_DATA;
  }
}

export const analyticsService = new AnalyticsService();
