import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PredatorV24 from '../PredatorV24';

const getOverviewMock = vi.fn();

vi.mock('@/services/api/dashboard', () => ({
  dashboardApi: {
    getOverview: () => getOverviewMock(),
  },
}));

vi.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: {
      role: 'client_premium',
    },
  }),
}));

vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    isTruthOnly: false,
    modeLabel: 'Локальний робочий режим',
    sourceLabel: 'localhost:9080/api/v1',
    sourceType: 'local',
    statusLabel: 'Зʼєднання активне',
  }),
}));

vi.mock('@/config/navigation', async () => {
  const actual = await vi.importActual<typeof import('@/config/navigation')>('@/config/navigation');

  return {
    ...actual,
    getVisibleNavigation: () => [
      {
        id: 'command',
        label: 'Командний центр',
        description: 'Огляд системи та контроль платформних сигналів.',
        outcome: 'Дає головний зріз для старту дня.',
        accent: 'amber',
        items: [
          {
            id: 'overview',
            label: 'Огляд системи',
            path: '/overview',
            icon: () => null,
            description: 'Операційний стан ядра.',
          },
          {
            id: 'search',
            label: 'Пошук',
            path: '/search',
            icon: () => null,
            description: 'Швидкий пошук по сутностях.',
          },
        ],
      },
      {
        id: 'intelligence',
        label: 'Розвідка',
        description: 'Аналіз ринку та контрагентів.',
        outcome: 'Показує ринки, ризики та наступний крок.',
        accent: 'emerald',
        items: [
          {
            id: 'market',
            label: 'Аналіз ринку',
            path: '/market',
            icon: () => null,
            description: 'Огляд ринкових потоків.',
          },
          {
            id: 'diligence',
            label: 'Перевірка контрагентів',
            path: '/diligence',
            icon: () => null,
            description: 'Профіль компанії та ризики.',
          },
        ],
      },
    ],
    getRecommendedNavigation: () => [
      {
        id: 'overview',
        label: 'Огляд системи',
        path: '/overview',
        icon: () => null,
        description: 'Операційний стан ядра.',
        accent: 'amber',
        sectionId: 'command',
        sectionLabel: 'Командний центр',
        sectionDescription: 'Огляд системи та контроль платформних сигналів.',
        sectionOutcome: 'Дає головний зріз для старту дня.',
      },
      {
        id: 'market',
        label: 'Аналіз ринку',
        path: '/market',
        icon: () => null,
        description: 'Огляд ринкових потоків.',
        accent: 'emerald',
        sectionId: 'intelligence',
        sectionLabel: 'Розвідка',
        sectionDescription: 'Аналіз ринку та контрагентів.',
        sectionOutcome: 'Показує ринки, ризики та наступний крок.',
      },
      {
        id: 'diligence',
        label: 'Перевірка контрагентів',
        path: '/diligence',
        icon: () => null,
        description: 'Профіль компанії та ризики.',
        accent: 'emerald',
        sectionId: 'intelligence',
        sectionLabel: 'Розвідка',
        sectionDescription: 'Аналіз ринку та контрагентів.',
        sectionOutcome: 'Показує ринки, ризики та наступний крок.',
      },
      {
        id: 'search',
        label: 'Пошук',
        path: '/search',
        icon: () => null,
        description: 'Швидкий пошук по сутностях.',
        accent: 'amber',
        sectionId: 'command',
        sectionLabel: 'Командний центр',
        sectionDescription: 'Огляд системи та контроль платформних сигналів.',
        sectionOutcome: 'Дає головний зріз для старту дня.',
      },
    ],
  };
});

const overviewFixture = {
  summary: {
    total_declarations: 12450,
    total_value_usd: 9300000,
    high_risk_count: 12,
    medium_risk_count: 36,
    import_count: 7000,
    export_count: 5450,
    graph_nodes: 18200,
    graph_edges: 45100,
    search_documents: 29800,
    vectors: 112000,
    active_pipelines: 7,
    completed_pipelines: 43,
  },
  radar: [],
  top_risk_companies: [],
  alerts: [
    {
      id: 'alert-1',
      type: 'trade',
      message: 'Аномалія в торговому потоці',
      severity: 'critical' as const,
      timestamp: new Date().toISOString(),
      sector: 'Машинобудування',
      company: 'ТОВ Орбіта',
      value: 220000,
    },
  ],
  categories: {},
  countries: {
    Польща: { count: 12, value: 300000 },
  },
  customs_offices: {
    'Київська митниця': { count: 44, value: 980000, highRisk: 3 },
    'Львівська митниця': { count: 38, value: 870000, highRisk: 1 },
  },
  infrastructure: {
    postgresql: { status: 'UP', records: 100 },
    neo4j: { status: 'UP', nodes: 200 },
  },
  engines: {},
  generated_at: new Date().toISOString(),
};

describe('PredatorV24', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показує ROI, рекомендовані маршрути, сигнали та покриття даних після завантаження', async () => {
    getOverviewMock.mockResolvedValue(overviewFixture);

    render(
      <MemoryRouter>
        <PredatorV24 />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Інтерфейс, який показує де заробити, що зекономити і який ризик зняти першим.'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Що система радить зараз')).toBeInTheDocument();
    });

    expect(await screen.findByText('Аномалія в торговому потоці')).toBeInTheDocument();
    expect(screen.getByText('Заощаджено часу')).toBeInTheDocument();
    expect(screen.getByText('6 бізнес-блоків')).toBeInTheDocument();
    expect(screen.getByText('Перший ROI за 10 хвилин')).toBeInTheDocument();
    expect(screen.getByText('Знайти можливість')).toBeInTheDocument();
    expect(screen.getByText('Порівняти ціни')).toBeInTheDocument();
    expect(screen.getByText('Замовити аудит')).toBeInTheDocument();
    expect(screen.getByText('Покриття даних')).toBeInTheDocument();
    expect(screen.getAllByText('Огляд системи').length).toBeGreaterThan(0);
    expect(screen.getByText('Граф звʼязків')).toBeInTheDocument();
    expect(screen.getByText('Пошуковий індекс')).toBeInTheDocument();
  });

  it('показує повідомлення про недоступність головного огляду', async () => {
    getOverviewMock.mockRejectedValue(new Error('offline'));

    render(
      <MemoryRouter>
        <PredatorV24 />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Головний огляд поки недоступний/)).toBeInTheDocument();
    });
  });
});
