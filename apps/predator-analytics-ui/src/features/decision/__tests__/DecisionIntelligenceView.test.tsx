import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DecisionIntelligenceView from '../DecisionIntelligenceView';
import { decisionApi } from '@/services/api/decision';

vi.mock('@/services/api/decision', () => ({
  decisionApi: {
    getRecommendation: vi.fn(),
    getProcurementAnalysis: vi.fn(),
    getMarketEntryAnalysis: vi.fn(),
    getCounterpartyProfile: vi.fn(),
    findNiches: vi.fn(),
    getQuickScore: vi.fn(),
  },
}));

vi.mock('@/components/ViewHeader', () => ({
  ViewHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock('@/components/TacticalCard', () => ({
  TacticalCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
  SelectItem: ({ children, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) => (
    <option {...props}>{children}</option>
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <progress value={value} max={100} data-testid="progress" />,
}));

vi.mock('@/utils/cn', () => ({
  cn: (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(' '),
}));

// ─── TEST DATA ─────────────────────────────────────────────────────────────────

const mockRecommendation = {
  ueid: '12345678',
  product_code: '87032310',
  company_name: 'ТОВ Тест',
  timestamp: '2026-04-01T00:00:00Z',
  summary: 'Рекомендується активна закупівля товару',
  confidence: 91,
  risk_score: 34,
  risk_level: 'low',
  scenarios: [
    {
      name: 'Агресивне входження',
      probability: 75,
      impact: 'high',
      description: 'Швидке захоплення ринкової частки',
      actions: ['Закупівля', 'Маркетинг', 'Логістика'],
    },
  ],
  signals: ['Зростання попиту', 'Стабільні ціни'],
  forecast: {
    trend: 'growth',
    next_period_demand: 120,
    confidence: 0.9,
    interpretation: 'Позитивний прогноз на наступний період',
  },
  procurement: {
    advice: 'Закуповувати з Китаю',
    best_country: 'CN',
    estimated_savings: 15000,
    market_avg_price: 25000,
    hhi: 0.35,
  },
  competitor_threats: [],
};

const mockProcurementAnalysis = {
  product_code: '87032310',
  analysis_period: '2025-04-01 to 2026-04-01',
  total_records: 1250,
  unique_suppliers: 45,
  unique_countries: 12,
  market_avg_price: 25000,
  price_volatility: 0.15,
  top_suppliers: [
    { name: 'Supplier A', country: 'CN', total_value_usd: 5000000, avg_price: 24000, market_share: 25, score: 85 },
    { name: 'Supplier B', country: 'DE', total_value_usd: 3000000, avg_price: 26000, market_share: 15, score: 78 },
  ],
  country_analysis: [
    { country: 'CN', total_value_usd: 8000000, avg_price: 23500, market_share: 40, reliability_score: 82 },
    { country: 'DE', total_value_usd: 4000000, avg_price: 26500, market_share: 20, reliability_score: 95 },
  ],
  seasonality: {
    pattern: 'Пік у 4 кварталі',
    peak_month: 'Грудень',
    low_month: 'Січень',
    seasonal_coefficient: 1.4,
  },
  hhi: 0.28,
  advice: 'Рекомендується диверсифікація постачальників з фокусом на Китай',
  data_source: 'real',
};

const mockCounterpartyProfile = {
  edrpou: '12345678',
  company_name: 'ТОВ Тестова Компанія',
  basic_info: {
    full_name: 'ТОВ "Тестова Компанія"',
    short_name: 'ТОВ ТК',
    registration_date: '2015-03-15',
    legal_form: 'Товариство з обмеженою відповідальністю',
    status: 'активна',
  },
  risk_profile: {
    cers_score: 42,
    risk_level: 'medium',
    key_factors: [
      { factor: 'Санкції', value: 0, weight: 0.3, contribution: 0 },
      { factor: 'Офшори', value: 15, weight: 0.25, contribution: 3.75 },
      { factor: 'Суди', value: 8, weight: 0.2, contribution: 1.6 },
    ],
    sanctions_status: {
      is_sanctioned: false,
      sources: [],
    },
  },
  activity_analysis: {
    total_declarations: 156,
    total_value_usd: 4500000,
    avg_transaction_value: 28846,
    first_declaration: '2019-01-15',
    last_declaration: '2026-03-20',
    top_products: [
      { code: '87032310', name: 'Автомобілі', value_usd: 2000000, transactions: 45 },
    ],
    trading_partners: 12,
  },
  red_flags: [],
  recommendations: ['Провести додаткову перевірку контрагентів'],
};

const mockNicheAnalysis = {
  query_params: {
    min_transactions: 5,
    max_players: 5,
    limit: 20,
  },
  total_analyzed: 150,
  niches: [
    {
      product_code: '90013000',
      product_name: 'Оптичні прилади',
      total_transactions: 12,
      total_value_usd: 850000,
      unique_companies: 3,
      avg_price: 70833,
      growth_trend: 'зростаючий',
      competition_level: 'Низька',
      market_concentration: 0.45,
      opportunity_score: 78,
      entry_barrier: 'середній',
      recommendation: 'Вигідна ніша для входу',
    },
  ],
  insights: ['Знайдено 3 перспективні ніші', 'Середня оцінка можливості: 72/100'],
  data_source: 'real',
};

const mockQuickScore = {
  edrpou: '12345678',
  cers_score: 35,
  risk_level: 'low',
  key_factors: [
    { factor: 'Санкції', value: 0, weight: 0.3 },
    { factor: 'Офшори', value: 5, weight: 0.25 },
    { factor: 'Суди', value: 2, weight: 0.2 },
  ],
  sanctions_status: {
    is_sanctioned: false,
    sources: [],
  },
  activity_summary: {
    total_declarations: 89,
    total_value_usd: 2300000,
    last_activity: '2026-03-15',
  },
  red_flags: [],
};

describe('DecisionIntelligenceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерить основний заголовок і вкладки', () => {
    render(<DecisionIntelligenceView />);

    expect(screen.getByText(/Decision Intelligence Engine/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Рекомендації/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Закупівлі/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Контрагенти/i })).toBeInTheDocument();
  });

  it('валідує форму рекомендацій і викликає API', async () => {
    vi.mocked(decisionApi.getRecommendation).mockResolvedValue(mockRecommendation);

    render(<DecisionIntelligenceView />);

    fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('87032310'), { target: { value: '87032310' } });
    fireEvent.click(screen.getByRole('button', { name: /Отримати рекомендацію/i }));

    await waitFor(() => {
      expect(decisionApi.getRecommendation).toHaveBeenCalledWith({
        ueid: '12345678',
        product_code: '87032310',
        company_name: '',
        edrpou: '',
      });
    });

    expect(await screen.findByText(/ТОВ Тест/i)).toBeInTheDocument();
    expect(await screen.findByText(/Рекомендується активна закупівля товару/i)).toBeInTheDocument();
  });

  it('відображає помилку API', async () => {
    vi.mocked(decisionApi.getRecommendation).mockRejectedValue({
      response: { data: { detail: 'Помилка сервера' } },
    });

    render(<DecisionIntelligenceView />);

    fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('87032310'), { target: { value: '87032310' } });
    fireEvent.click(screen.getByRole('button', { name: /Отримати рекомендацію/i }));

    expect(await screen.findByText(/Помилка сервера/i)).toBeInTheDocument();
  });

  // ─── ЗАКУПІВЛІ ───────────────────────────────────────────────────────────────
  describe('Вкладка Закупівлі', () => {
    it('викликає API аналізу закупівель і показує результати', async () => {
      vi.mocked(decisionApi.getProcurementAnalysis).mockResolvedValue(mockProcurementAnalysis);

      render(<DecisionIntelligenceView />);

      fireEvent.click(screen.getByRole('button', { name: /Закупівлі/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Аналізувати закупівлі/i })).toBeInTheDocument();
      });
    });
  });

  // ─── КОНТРАГЕНТИ ─────────────────────────────────────────────────────────────
  describe('Вкладка Контрагенти', () => {
    it('викликає API профілю контрагента', async () => {
      vi.mocked(decisionApi.getCounterpartyProfile).mockResolvedValue(mockCounterpartyProfile);

      render(<DecisionIntelligenceView />);

      fireEvent.click(screen.getByRole('button', { name: /Контрагенти/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Сформувати досьє/i })).toBeInTheDocument();
      });
    });
  });

  // ─── НІШІ ────────────────────────────────────────────────────────────────────
  describe('Вкладка Ніші', () => {
    it('викликає API пошуку ніш', async () => {
      vi.mocked(decisionApi.findNiches).mockResolvedValue(mockNicheAnalysis);

      render(<DecisionIntelligenceView />);

      fireEvent.click(screen.getByRole('button', { name: /Ніші/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Знайти ніші/i })).toBeInTheDocument();
      });
    });
  });

  // ─── QUICK SCORE ────────────────────────────────────────────────────────────
  describe('Вкладка Quick Score', () => {
    it('валідує наявність ЄДРПОУ', async () => {
      render(<DecisionIntelligenceView />);

      fireEvent.click(screen.getByRole('button', { name: /Quick Score/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Розрахувати скор/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Розрахувати скор/i }));

      expect(await screen.findByText(/Необхідно вказати ЄДРПОУ/i)).toBeInTheDocument();
    });
  });
});
