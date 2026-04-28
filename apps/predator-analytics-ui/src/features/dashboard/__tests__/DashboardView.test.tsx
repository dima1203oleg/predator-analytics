import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardView from '../DashboardView';
import { useRole } from '@/store/useRoleStore';
import { SubscriptionTier, useUserStore } from '@/store/useUserStore';
import { UserRole } from '@/config/roles';

const getOverviewMock = vi.fn();

vi.mock('@/services/api/dashboard', () => ({
  dashboardApi: {
    getOverview: () => getOverviewMock(),
  },
}));

vi.mock('@/components/ECharts', () => ({
  default: () => <div data-testid="mock-echart">EChart Placeholder</div>,
}));

vi.mock('echarts', () => ({
  default: {
    graphic: {
      RadialGradient: class MockGradient {},
    },
  },
  graphic: {
    RadialGradient: class MockGradient {},
  },
}));

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({ children, ...props }: any) => {
          const Tag = typeof prop === 'string' ? prop : 'div';
          return <Tag {...props}>{children}</Tag>;
        };
      },
    }
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;

  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        return (props: Record<string, unknown>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
      }

      return target[prop as keyof typeof target];
    },
  });
});

vi.mock('@/components/TacticalCard', () => ({
  TacticalCard: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <section>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  ),
}));

vi.mock('@/components/ViewHeader', () => ({
  ViewHeader: ({
    title,
    stats,
    actions,
  }: {
    title: React.ReactNode;
    stats?: { label: string; value: string }[];
    actions?: React.ReactNode;
  }) => (
    <header>
      <div>{title}</div>
      {stats?.map((stat) => (
        <div key={stat.label}>
          <span>{stat.label}</span>
          <span>{stat.value}</span>
        </div>
      ))}
      {actions}
    </header>
  ),
}));

vi.mock('@/components/layout/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock('@/components/ui/NeuralPulse', () => ({
  NeuralPulse: () => <div data-testid="neural-pulse" />,
}));

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-bg" />,
}));

const overviewFixture = {
  summary: {
    total_declarations: 15800,
    total_value_usd: 11200000,
    high_risk_count: 17,
    medium_risk_count: 42,
    import_count: 9100,
    export_count: 6700,
    graph_nodes: 21000,
    graph_edges: 48500,
    search_documents: 33200,
    vectors: 91000,
    active_pipelines: 9,
    completed_pipelines: 81,
  },
  radar: [
    { name: 'Електроніка', value: 81, count: 44 },
    { name: 'Хімія', value: 62, count: 28 },
  ],
  top_risk_companies: [
    {
      name: 'ТОВ Навігатор',
      edrpou: '12345678',
      maxRisk: 96,
      totalValue: 440000,
      count: 6,
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      type: 'trade',
      message: '� ізкий стрибок митної вартості',
      severity: 'critical' as const,
      timestamp: new Date().toISOString(),
      sector: 'Електроніка',
      company: 'ТОВ Навігатор',
      value: 120000,
    },
  ],
  categories: {},
  countries: {
    КИТАЙ: { count: 120, value: 7500000 },
  },
  customs_offices: {
    'Київська митниця': { count: 41, value: 820000, highRisk: 4 },
  },
  infrastructure: {
    postgresql: { status: 'UP', records: 100 },
    neo4j: { status: 'UP', nodes: 200 },
  },
  engines: {
    graph: {
      id: 'graph',
      name: 'Графовий двигун',
      score: 99,
      trend: '+3%',
      status: 'optimal' as const,
      throughput: 240,
      latency: 22,
      load: 61,
    },
  },
  generated_at: new Date().toISOString(),
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('відмальовує актуальний заголовок і ключові віджети після завантаження', async () => {
    getOverviewMock.mockResolvedValue(overviewFixture);

    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/ГОЛОВНИЙ/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/СИНХ� ОНІЗАЦІЯ_ЯД� А/i)).toBeInTheDocument();
    expect(screen.getByText(/ДВИГУНИ_АНАЛІЗУ/i)).toBeInTheDocument();
    expect(screen.getByText(/ВЕ� ТИКАЛЬ_� ИЗИКІВ/i)).toBeInTheDocument();
    expect(screen.getByText(/� ізкий стрибок митної вартості/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-echart').length).toBeGreaterThan(0);
  });

  test('показує повідомлення про помилку, якщо бекенд недоступний', async () => {
    getOverviewMock.mockRejectedValue(new Error('offline'));

    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Зв'язок з API розірвано/i)).toBeInTheDocument();
    });
  });
});

describe('useRole hook', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isClient: false,
    });
  });

  test('відображає роль basic_client за замовчуванням', () => {
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe(UserRole.CLIENT_BASIC);
  });

  test('оновлюється при зміні користувача в useUserStore', () => {
    const { result } = renderHook(() => useRole());

    act(() => {
      useUserStore.getState().setUser({
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@predator.ua',
        role: UserRole.ADMIN,
        tier: SubscriptionTier.ENTERPRISE,
        tenant_id: '1',
        tenant_name: 'test',
        last_login: '',
        data_sectors: [],
      });
    });

    expect(result.current.role).toBe(UserRole.ADMIN);
  });
});
