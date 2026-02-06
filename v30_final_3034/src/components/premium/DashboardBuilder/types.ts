/**
 * PREDATOR Premium Dashboard Builder - Types
 * Типи для конструктора дашбордів
 */

export type WidgetType =
  | 'area_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'line_chart'
  | 'radar_chart'
  | 'treemap'
  | 'heatmap'
  | 'gauge'
  | 'kpi_card'
  | 'table'
  | 'map'
  | 'timeline'
  | 'network_graph'
  | 'sankey'
  | 'funnel';

export type DataSource =
  | 'customs_registry'
  | 'tax_data'
  | 'company_registry'
  | 'court_cases'
  | 'sanctions'
  | 'real_estate'
  | 'vehicles'
  | 'beneficial_owners'
  | 'contracts'
  | 'financial_reports';

export type PersonaType = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'ANALYST';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: DataSource;
  query?: string;
  filters?: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: WidgetStyle;
  refreshInterval?: number; // seconds
  aiGenerated?: boolean;
}

export interface WidgetStyle {
  colorScheme: 'amber' | 'cyan' | 'emerald' | 'rose' | 'purple' | 'blue';
  variant: 'default' | 'holographic' | 'glass' | 'solid';
  animation: boolean;
  transparency: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  persona: PersonaType;
  category: string;
  thumbnail?: string;
  widgets: WidgetConfig[];
  isDefault?: boolean;
  isPremium?: boolean;
}

export interface SavedDashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  persona: PersonaType;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  views: number;
}

export interface AIRecommendation {
  id: string;
  widgetType: WidgetType;
  title: string;
  description: string;
  reasoning: string;
  dataSource: DataSource;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface WidgetData {
  loading: boolean;
  error?: string;
  data: any;
  lastUpdated?: string;
}

// Preset templates for each persona
export const PERSONA_TEMPLATES: Record<PersonaType, DashboardTemplate[]> = {
  TITAN: [
    {
      id: 'titan-competitor-analysis',
      name: 'Competitor Intelligence Hub',
      description: 'Аналіз конкурентів, цін та ринкових часток',
      persona: 'TITAN',
      category: 'Business Intelligence',
      widgets: []
    },
    {
      id: 'titan-market-overview',
      name: 'Market Overview Dashboard',
      description: 'Оглядовий дашборд ринку та трендів',
      persona: 'TITAN',
      category: 'Market Analysis',
      widgets: []
    },
    {
      id: 'titan-supply-chain',
      name: 'Supply Chain Analytics',
      description: 'Аналіз ланцюгів постачання та постачальників',
      persona: 'TITAN',
      category: 'Operations',
      widgets: []
    }
  ],
  INQUISITOR: [
    {
      id: 'inquisitor-fraud-detection',
      name: 'Fraud Detection Center',
      description: 'Виявлення шахрайських схем та аномалій',
      persona: 'INQUISITOR',
      category: 'Compliance',
      widgets: []
    },
    {
      id: 'inquisitor-entity-investigation',
      name: 'Entity Investigation Hub',
      description: 'Розслідування компаній та бенефіціарів',
      persona: 'INQUISITOR',
      category: 'Investigation',
      widgets: []
    },
    {
      id: 'inquisitor-risk-matrix',
      name: 'Risk Assessment Matrix',
      description: 'Матриця оцінки ризиків та загроз',
      persona: 'INQUISITOR',
      category: 'Risk Management',
      widgets: []
    }
  ],
  SOVEREIGN: [
    {
      id: 'sovereign-national-overview',
      name: 'National Economic Overview',
      description: 'Макроекономічний огляд та індикатори',
      persona: 'SOVEREIGN',
      category: 'Government',
      widgets: []
    },
    {
      id: 'sovereign-budget-leakage',
      name: 'Budget Leakage Monitor',
      description: 'Моніторинг втрат бюджету та корупції',
      persona: 'SOVEREIGN',
      category: 'Audit',
      widgets: []
    },
    {
      id: 'sovereign-strategic-resources',
      name: 'Strategic Resource Control',
      description: 'Контроль стратегічних ресурсів та імпорту',
      persona: 'SOVEREIGN',
      category: 'Security',
      widgets: []
    }
  ],
  ANALYST: [
    {
      id: 'analyst-data-explorer',
      name: 'Data Explorer Pro',
      description: 'Професійний інструмент дослідження даних',
      persona: 'ANALYST',
      category: 'Analytics',
      widgets: []
    },
    {
      id: 'analyst-custom-reports',
      name: 'Custom Report Builder',
      description: 'Конструктор індивідуальних звітів',
      persona: 'ANALYST',
      category: 'Reporting',
      widgets: []
    }
  ]
};

// Widget library with metadata
export const WIDGET_LIBRARY: Record<WidgetType, {
  name: string;
  description: string;
  icon: string;
  category: string;
  supportedDataSources: DataSource[];
  defaultSize: { width: number; height: number };
}> = {
  area_chart: {
    name: 'Діаграма області',
    description: 'Графік області для візуалізації трендів',
    icon: 'AreaChart',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'tax_data', 'financial_reports'],
    defaultSize: { width: 4, height: 3 }
  },
  bar_chart: {
    name: 'Стовпчаста діаграма',
    description: 'Стовпчаста діаграма для порівнянь',
    icon: 'BarChart',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'company_registry', 'contracts'],
    defaultSize: { width: 4, height: 3 }
  },
  pie_chart: {
    name: 'Кругова діаграма',
    description: 'Кругова діаграма для розподілу',
    icon: 'PieChart',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'tax_data', 'contracts'],
    defaultSize: { width: 3, height: 3 }
  },
  line_chart: {
    name: 'Лінійний графік',
    description: 'Лінійний графік для часових рядів',
    icon: 'LineChart',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'financial_reports', 'tax_data'],
    defaultSize: { width: 6, height: 3 }
  },
  radar_chart: {
    name: 'Радарна діаграма',
    description: 'Радарна діаграма для багатовимірного аналізу',
    icon: 'Radar',
    category: 'Charts',
    supportedDataSources: ['company_registry', 'financial_reports'],
    defaultSize: { width: 3, height: 3 }
  },
  treemap: {
    name: 'Деревоподібна карта',
    description: 'Деревоподібна карта для ієрархічних даних',
    icon: 'Grid',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'contracts', 'company_registry'],
    defaultSize: { width: 4, height: 4 }
  },
  heatmap: {
    name: 'Теплова карта',
    description: 'Теплова карта для щільності даних',
    icon: 'Grid3x3',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'tax_data', 'court_cases'],
    defaultSize: { width: 6, height: 4 }
  },
  gauge: {
    name: 'Індикатор',
    description: 'Індикатор для KPI метрик',
    icon: 'Gauge',
    category: 'KPI',
    supportedDataSources: ['customs_registry', 'tax_data', 'financial_reports'],
    defaultSize: { width: 2, height: 2 }
  },
  kpi_card: {
    name: 'KPI Картка',
    description: 'Карточка ключового показника',
    icon: 'CreditCard',
    category: 'KPI',
    supportedDataSources: ['customs_registry', 'tax_data', 'contracts', 'financial_reports'],
    defaultSize: { width: 2, height: 1 }
  },
  table: {
    name: 'Таблиця даних',
    description: 'Інтерактивна таблиця даних',
    icon: 'Table',
    category: 'Data',
    supportedDataSources: ['customs_registry', 'company_registry', 'court_cases', 'contracts', 'sanctions'],
    defaultSize: { width: 6, height: 4 }
  },
  map: {
    name: 'Географічна карта',
    description: 'Географічна карта з даними',
    icon: 'Globe',
    category: 'Geo',
    supportedDataSources: ['customs_registry', 'company_registry', 'real_estate'],
    defaultSize: { width: 6, height: 4 }
  },
  timeline: {
    name: 'Хронологія',
    description: 'Хронологія подій та транзакцій',
    icon: 'Timeline',
    category: 'Time',
    supportedDataSources: ['court_cases', 'contracts', 'company_registry'],
    defaultSize: { width: 6, height: 3 }
  },
  network_graph: {
    name: 'Граф зв\'язків',
    description: 'Граф зв\'язків між сутностями',
    icon: 'Network',
    category: 'Relations',
    supportedDataSources: ['beneficial_owners', 'company_registry', 'contracts'],
    defaultSize: { width: 6, height: 5 }
  },
  sankey: {
    name: 'Діаграма Санкі',
    description: 'Діаграма потоків коштів/товарів',
    icon: 'GitBranch',
    category: 'Flows',
    supportedDataSources: ['customs_registry', 'financial_reports', 'contracts'],
    defaultSize: { width: 6, height: 4 }
  },
  funnel: {
    name: 'Воронка',
    description: 'Воронка для конверсій та процесів',
    icon: 'Filter',
    category: 'Charts',
    supportedDataSources: ['customs_registry', 'court_cases'],
    defaultSize: { width: 3, height: 4 }
  }
};

// Data source metadata
export const DATA_SOURCE_META: Record<DataSource, {
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  updateFrequency: string;
}> = {
  customs_registry: {
    name: 'Митний Реєстр',
    description: 'Декларації імпорту/експорту',
    icon: 'Ship',
    isPremium: false,
    updateFrequency: 'Щоденно'
  },
  tax_data: {
    name: 'Податкові Дані',
    description: 'ПДВ, акциз, податок на прибуток',
    icon: 'Receipt',
    isPremium: true,
    updateFrequency: 'Щомісяця'
  },
  company_registry: {
    name: 'Реєстр Компаній',
    description: 'ЄДР, засновники, директори',
    icon: 'Building',
    isPremium: false,
    updateFrequency: 'Щоденно'
  },
  court_cases: {
    name: 'Судові Справи',
    description: 'Єдиний реєстр судових рішень',
    icon: 'Scale',
    isPremium: false,
    updateFrequency: 'Щоденно'
  },
  sanctions: {
    name: 'Санкції',
    description: 'Списки санкцій UA/EU/US/UN',
    icon: 'ShieldAlert',
    isPremium: true,
    updateFrequency: 'Реал-тайм'
  },
  real_estate: {
    name: 'Нерухомість',
    description: 'Реєстр прав на нерухоме майно',
    icon: 'Home',
    isPremium: true,
    updateFrequency: 'Щотижня'
  },
  vehicles: {
    name: 'Транспорт',
    description: 'Реєстр транспортних засобів',
    icon: 'Car',
    isPremium: true,
    updateFrequency: 'Щомісяця'
  },
  beneficial_owners: {
    name: 'Бенефіціари',
    description: 'Кінцеві бенефіціарні власники',
    icon: 'Users',
    isPremium: true,
    updateFrequency: 'Щоквартально'
  },
  contracts: {
    name: 'Контракти',
    description: 'Prozorro та державні закупівлі',
    icon: 'FileContract',
    isPremium: false,
    updateFrequency: 'Щоденно'
  },
  financial_reports: {
    name: 'Фінзвітність',
    description: 'Фінансова звітність компаній',
    icon: 'LineChart',
    isPremium: true,
    updateFrequency: 'Щоквартально'
  }
};
