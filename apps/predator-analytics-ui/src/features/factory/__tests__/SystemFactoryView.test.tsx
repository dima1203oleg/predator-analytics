import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        return (props: React.SVGProps<SVGSVGElement>) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
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
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
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
  v45Client: {
    defaults: {},
  },
}));

vi.mock('@/services/api/system', () => ({
  systemApi: systemApiMock,
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

    expect(await screen.findByText(/Сервер: АКТИВНИЙ/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ЗУПИНИТИ/i })).toBeInTheDocument();
    expect(screen.getByText(/Автовідновлення/i)).toBeInTheDocument();
    expect(screen.getByText(/Збереження стану/i)).toBeInTheDocument();
  });
});
