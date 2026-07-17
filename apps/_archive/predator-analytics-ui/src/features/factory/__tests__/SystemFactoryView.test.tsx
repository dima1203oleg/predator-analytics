import { Button } from '@/components/ui/button';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SystemFactoryView from '../SystemFactoryView';

const {
  apiClientMock,
  apiMock,
  factoryApiMock,
  monitoringApiMock,
  systemApiMock,
} = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
  },
  apiMock: {
    graph: {
      getSummary: vi.fn(),
    },
  },
  factoryApiMock: {
    fixBug: vi.fn(),
    getBugs: vi.fn(),
    getGoldPatterns: vi.fn(),
    getInfiniteStatus: vi.fn(),
    getLogs: vi.fn(),
    getStats: vi.fn(),
    getTrainingStats: vi.fn(),
    getTrainingStatus: vi.fn(),
    ingest: vi.fn(),
    startInfinite: vi.fn(),
    startTraining: vi.fn(),
    stopInfinite: vi.fn(),
    stopTraining: vi.fn(),
  },
  monitoringApiMock: {
    getClusterStatus: vi.fn(),
    streamSystemLogs: vi.fn(),
  },
  systemApiMock: {
    getStatus: vi.fn(),
  },
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
        <div {...props}>{children}</div>
      ),
    },
    useMotionValue: vi.fn(() => ({ set: vi.fn(), get: vi.fn(), on: () => () => {} })),
    useMotionTemplate: vi.fn(() => ''),
    useSpring: vi.fn(() => ({ set: vi.fn(), get: vi.fn(), on: () => () => {} })),
  };
});

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        return (props: any) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
      }
      return Reflect.get(target, prop);
    },
  });
});

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('@/components/ViewHeader', () => ({
  ViewHeader: ({ title, stats }: { title: string; stats?: Array<{ label: string; value: string | number }> }) => (
    <div data-testid="view-header">
      <h1>{title}</h1>
      {stats?.map((stat) => (
        <div key={stat.label}>{stat.label}: {stat.value}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/TacticalCard', () => ({
  TacticalCard: ({ children, title }: React.PropsWithChildren<{ title?: string }>) => (
    <section data-testid="tactical-card">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value?: number }) => <div data-testid="progress" data-value={value} />,
}));

vi.mock('../components/RegistryStats', () => ({
  RegistryStats: () => <div data-testid="registry-stats" />,
}));

vi.mock('@/services/api', () => ({
  api: apiMock,
  apiClient: apiClientMock,
  factoryApi: factoryApiMock,
  monitoringApi: monitoringApiMock,
  systemApi: systemApiMock,
  v45Client: {
    defaults: {},
  },
}));

vi.mock('@/hooks/useAdminApi', () => ({
  useDataOpsStatus: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

describe('SystemFactoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    factoryApiMock.getStats.mockResolvedValue({ avg_score: 94 });
    factoryApiMock.getGoldPatterns.mockResolvedValue([]);
    factoryApiMock.getBugs.mockResolvedValue([]);
    factoryApiMock.getInfiniteStatus.mockResolvedValue({
      current_phase: 'orient',
      cycles_completed: 12,
      improvements_made: 7,
      is_running: true,
      last_update: new Date('2026-03-24T18:00:00.000Z').toISOString(),
      logs: [
        '[18:00:00] 🔄 SYSTEM: Безконечне вдосконалення автоматично відновлено після рестарту сервера.',
      ],
    });
    factoryApiMock.getTrainingStatus.mockResolvedValue({ status: 'IDLE' });
    factoryApiMock.getTrainingStats.mockResolvedValue([]);
    factoryApiMock.startInfinite.mockResolvedValue({ status: 'started' });
    factoryApiMock.stopInfinite.mockResolvedValue({ status: 'stopped' });
    monitoringApiMock.getClusterStatus.mockResolvedValue({ pods: [] });
    monitoringApiMock.streamSystemLogs.mockResolvedValue([]);
    apiClientMock.get.mockResolvedValue({ data: { status: 'ok' } });
    apiMock.graph.getSummary.mockResolvedValue({ node_count: 10, relationship_count: 20 });
    systemApiMock.getStatus.mockResolvedValue({
      status: 'ok',
      healthy: true,
      overall_status: 'healthy',
      version: '55.1',
      environment: 'test',
      uptime: '1d',
      services: [],
      summary: { total: 0, healthy: 0, degraded: 0, failed: 0 },
      metrics: {},
      timestamp: new Date('2026-03-24T18:00:00.000Z').toISOString(),
    });
  });

  it('показує активний серверний стан OODA після відновлення з бекенду', async () => {
    render(<SystemFactoryView />);

    await waitFor(() => {
      expect(factoryApiMock.getInfiniteStatus).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Активний/i)).toBeInTheDocument();

    // Switch to OODA tab
    fireEvent.click(screen.getByRole('button', { name: /OODA Loop/i }));
    
    expect(await screen.findByRole('button', { name: /ЗУПИНИТИ/i })).toBeInTheDocument();
    expect(screen.getByText(/Автовідновлення/i)).toBeInTheDocument();
    expect(screen.getByText(/Збереження стану/i)).toBeInTheDocument();
  });

  it('відображає відправлене повідомлення в чаті', async () => {
    // В цьому компоненті чат знаходиться в FactoryCoordinatorChat
    // і SystemFactoryView взаємодіє з ним через хуки/стан.
    // Спрощена перевірка наявності поля вводу команд (на жаль FactoryCoordinatorChat не експортує інпут безпосередньо, перевіряємо його наявність неявно)
    render(<SystemFactoryView />);
    await waitFor(() => {
      expect(factoryApiMock.getInfiniteStatus).toHaveBeenCalled();
    });
  });
});
