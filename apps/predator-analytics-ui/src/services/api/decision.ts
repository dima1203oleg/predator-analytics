import { apiClient } from './config';

export interface RecommendRequest {
  ueid: string;
  product_code: string;
  company_name?: string;
  edrpou?: string;
  context?: Record<string, any>;
}

export interface CounterpartyRequest {
  ueid?: string;
  edrpou?: string;
  company_name?: string;
}

export interface DecisionRecommendation {
  ueid: string;
  product_code: string;
  company_name: string;
  timestamp: string;
  summary: string;
  confidence: number;
  risk_score: number;
  risk_level: string;
  scenarios: Array<{
    name: string;
    probability: number;
    impact: string;
    description: string;
    actions: string[];
  }>;
  signals: string[];
  forecast: {
    trend: string;
    next_period_demand: number;
    confidence: number;
    interpretation: string;
  };
  procurement?: {
    advice: string;
    best_country: string;
    estimated_savings: number;
    market_avg_price: number;
    hhi: number;
  };
  competitor_threats: Array<{
    name: string;
    threat_level: string;
    description: string;
    evidence: string[];
  }>;
}

export interface ProcurementAnalysis {
  product_code: string;
  analysis_period: string;
  total_records: number;
  unique_suppliers: number;
  unique_countries: number;
  market_avg_price: number;
  price_volatility: number;
  top_suppliers: Array<{
    name: string;
    country: string;
    total_value_usd: number;
    avg_price: number;
    market_share: number;
    score: number;
  }>;
  country_analysis: Array<{
    country: string;
    total_value_usd: number;
    avg_price: number;
    market_share: number;
    reliability_score: number;
  }>;
  seasonality?: {
    pattern: string;
    peak_month: string;
    low_month: string;
    seasonal_coefficient: number;
  };
  hhi: number;
  advice: string;
  data_source: string;
}

export interface MarketEntryAnalysis {
  product_code: string;
  market_assessment: {
    total_companies: number;
    total_declarations: number;
    total_value_usd: number;
    avg_transaction_value: number;
  };
  competition_level: string;
  market_concentration: {
    hhi: number;
    interpretation: string;
  };
  price_analysis: {
    avg_price: number;
    price_volatility: number;
    trend: string;
  };
  recommendation: {
    action: string;
    reasoning: string;
    confidence: number;
    key_factors: string[];
  };
  risks: Array<{
    type: string;
    level: string;
    description: string;
  }>;
  opportunities: Array<{
    type: string;
    description: string;
    potential: string;
  }>;
}

export interface CounterpartyProfile {
  ueid?: string;
  edrpou?: string;
  company_name?: string;
  basic_info: {
    full_name: string;
    short_name: string;
    registration_date?: string;
    legal_form?: string;
    status?: string;
  };
  risk_profile: {
    cers_score: number;
    risk_level: string;
    key_factors: Array<{
      factor: string;
      value: number;
      weight: number;
      contribution: number;
    }>;
    sanctions_status: {
      is_sanctioned: boolean;
      sources: string[];
    };
  };
  activity_analysis: {
    total_declarations: number;
    total_value_usd: number;
    avg_transaction_value: number;
    first_declaration: string;
    last_declaration: string;
    top_products: Array<{
      code: string;
      name: string;
      value_usd: number;
      transactions: number;
    }>;
    trading_partners: number;
  };
  red_flags: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
}

export interface NicheAnalysis {
  query_params: {
    min_transactions: number;
    max_players: number;
    limit: number;
  };
  total_analyzed: number;
  niches: Array<{
    product_code: string;
    product_name: string;
    total_transactions: number;
    total_value_usd: number;
    unique_companies: number;
    avg_price: number;
    growth_trend: string;
    competition_level: string;
    market_concentration: number;
    opportunity_score: number;
    entry_barrier: string;
    recommendation: string;
  }>;
  insights: string[];
  data_source: string;
}

export interface QuickScore {
  edrpou: string;
  cers_score: number;
  risk_level: string;
  key_factors: Array<{
    factor: string;
    value: number;
    weight: number;
  }>;
  sanctions_status: {
    is_sanctioned: boolean;
    sources: string[];
  };
  activity_summary: {
    total_declarations?: number;
    total_value_usd?: number;
    last_activity?: string;
  };
  red_flags: string[];
}

export interface BatchRequest {
  edrpou_list: string[];
  analysis_type: 'quick_score' | 'counterparty';
}

export interface BatchItemResponse {
  edrpou: string;
  success: boolean;
  data?: QuickScore | CounterpartyProfile;
  error?: string;
  duration_ms: number;
}

export interface BatchResponse {
  results: BatchItemResponse[];
  summary: {
    total_companies: number;
    successful: number;
    failed: number;
    success_rate: number;
    avg_duration_ms: number;
  };
}

export const decisionApi = {
  // Повна рекомендація Decision Intelligence Engine
  getRecommendation: async (request: RecommendRequest) => {
    const response = await apiClient.post('/decision/recommend', request);
    return response.data as DecisionRecommendation;
  },

  // Аналіз закупівель для товару
  getProcurementAnalysis: async (
    productCode: string,
    countryFilter?: string,
    months: number = 12
  ) => {
    const params = new URLSearchParams();
    if (countryFilter) params.append('country_filter', countryFilter);
    params.append('months', months.toString());

    const response = await apiClient.get(`/decision/procurement/${productCode}?${params}`);
    return response.data as ProcurementAnalysis;
  },

  // Аналіз входу на ринок
  getMarketEntryAnalysis: async (productCode: string) => {
    const response = await apiClient.get(`/decision/market-entry/${productCode}`);
    return response.data as MarketEntryAnalysis;
  },

  // Досьє на контрагента
  getCounterpartyProfile: async (request: CounterpartyRequest) => {
    const response = await apiClient.post('/decision/counterparty', request);
    return response.data as CounterpartyProfile;
  },

  // Пошук ринкових ніш
  findNiches: async (
    minTransactions: number = 5,
    maxPlayers: number = 5,
    limit: number = 20
  ) => {
    const params = new URLSearchParams();
    params.append('min_transactions', minTransactions.toString());
    params.append('max_players', maxPlayers.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/decision/niche-finder?${params}`);
    return response.data as NicheAnalysis;
  },

  // Швидкий ризик-скор за ЄДРПОУ
  getQuickScore: async (edrpou: string) => {
    const response = await apiClient.get(`/decision/quick-score/${edrpou}`);
    return response.data as QuickScore;
  },

  // Масовий аналіз компаній (batch)
  batchAnalysis: async (request: BatchRequest) => {
    const response = await apiClient.post('/decision/batch', request);
    return response.data as BatchResponse;
  }
};
