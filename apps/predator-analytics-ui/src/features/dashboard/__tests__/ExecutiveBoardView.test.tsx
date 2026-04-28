import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ExecutiveBoardView from '../ExecutiveBoardView';

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
        accent: 'rose',
        items: [
          {
            id: 'overview',
            label: 'Огляд системи',
            path: '/overview',
            icon: () => null,
            description: 'Операційний стан ядра.',
          },
        ],
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
  countries: {},
  customs_offices: {
    'Київська митниця': { count: 44, value: 980000, highRisk: 3 },
  },
  infrastructure: {},
  engines: {},
  generated_at: new Date().toISOString(),
};

describe('ExecutiveBoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показує KPI, оперативний контур та сигнали після завантаження', async () => {
    getOverviewMock.mockResolvedValue(overviewFixture);

    render(
      <MemoryRouter>
        <ExecutiveBoardView />
      </MemoryRouter>,
    );

    expect(screen.getByText(/PREDATOR v61.0-ELITE/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/ОПЕРАТИВНИЙ КОНТУ /i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Критичні сигнали/i)).toBeInTheDocument();
    expect(screen.getByText(/Покриття даних/i)).toBeInTheDocument();
    expect(screen.getByText(/Швидкі дії/i)).toBeInTheDocument();
    
    // Перевірка KPI values
    expect(screen.getByText(/12 450/i)).toBeInTheDocument(); // Декларації
    expect(screen.getByText(/18 200/i)).toBeInTheDocument(); // Граф зв'язків
  });

  it('показує алерти з даними фікстури', async () => {
    getOverviewMock.mockResolvedValue(overviewFixture);

    render(
      <MemoryRouter>
        <ExecutiveBoardView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Аномалія в торговому потоці/)).toBeInTheDocument();
      expect(screen.getByText(/ТОВ Орбіта/)).toBeInTheDocument();
    });
  });

  it('переходить у автономний режим при помилці API', async () => {
    getOverviewMock.mockRejectedValue(new Error('API error'));

    render(
      <MemoryRouter>
        <ExecutiveBoardView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Автономний режим — Mock API/)).toBeInTheDocument();
    });
  });
});
