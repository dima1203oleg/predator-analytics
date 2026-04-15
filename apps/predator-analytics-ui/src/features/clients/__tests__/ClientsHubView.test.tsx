import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { DashboardOverview } from '@/services/api/dashboard';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';
import ClientsHubView from '../ClientsHubView';

const { getOverview, getStatus, getStats } = vi.hoisted(() => ({
  getOverview: vi.fn<[], Promise<DashboardOverview>>(),
  getStatus: vi.fn<[], Promise<SystemStatusResponse>>(),
  getStats: vi.fn<[], Promise<SystemStatsResponse>>(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    persona: 'BUSINESS',
    setPersona: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    isTruthOnly: true,
    modeLabel: 'Режим правдивих даних',
    sourceLabel: 'localhost:9080/api/v1',
    sourceType: 'local',
    statusLabel: 'Зʼєднання активне',
    nodes: [],
    healingProgress: 100,
    activeFailover: false,
  }),
}));

vi.mock('@/services/api/dashboard', () => ({
  dashboardApi: {
    getOverview,
  },
}));

vi.mock('@/services/api/system', () => ({
  systemApi: {
    getStatus,
    getStats,
  },
}));

const overviewPayload: DashboardOverview = {
  summary: {
    total_declarations: 3450123,
    total_value_usd: 98000000,
    high_risk_count: 245,
    medium_risk_count: 1280,
    import_count: 840000,
    export_count: 420000,
    graph_nodes: 15200,
    graph_edges: 98400,
    search_documents: 640000,
    vectors: 210000,
    active_pipelines: 7,
    completed_pipelines: 48,
  },
  radar: [],
  top_risk_companies: [],
  alerts: [],
  categories: {},
  countries: {},
  customs_offices: {},
  infrastructure: {},
  engines: {},
  generated_at: '2026-03-30T09:15:00.000Z',
};

const statusPayload: SystemStatusResponse = {
  status: 'ok',
  healthy: true,
  overall_status: 'healthy',
  version: '55.1',
  environment: 'dev',
  uptime: '2d',
  last_sync: '2026-03-30T09:15:00Z',
  services: [],
  summary: {
    total: 12,
    healthy: 10,
    degraded: 1,
    failed: 1,
  },
  metrics: {},
  timestamp: '2026-03-30T09:16:00.000Z',
};

const statsPayload: SystemStatsResponse = {
  cpu_usage: 12,
  cpu_percent: 12,
  cpu_count: 8,
  memory_usage: 40,
  memory_percent: 40,
  memory_total: 64,
  memory_used: 26,
  memory_available: 38,
  disk_usage: 55,
  disk_percent: 55,
  disk_total: 1000,
  disk_used: 550,
  disk_free: 450,
  network_bytes_sent: 1200,
  network_bytes_recv: 4300,
  active_connections: 14,
  active_tasks: 5,
  uptime: '2d',
  uptime_seconds: 172800,
  documents_total: 640000,
  search_rate: 82,
  avg_latency: 183,
  indexing_rate: 16,
  total_indices: 28,
  storage_gb: 412,
  last_sync: '2026-03-30T09:15:00Z',
  timestamp: '2026-03-30T09:16:30.000Z',
};

describe('ClientsHubView', () => {
  beforeEach(() => {
    getOverview.mockResolvedValue(overviewPayload);
    getStatus.mockResolvedValue(statusPayload);
    getStats.mockResolvedValue(statsPayload);
  });

  it('показує клієнтські контури та підвантажує підтверджені агрегати', async () => {
    render(
      <MemoryRouter>
        <ClientsHubView />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText((_, element) =>
        element?.tagName === 'H1' && element.textContent?.includes('Клієнтські контури') === true,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Бізнес та корпорації')).toBeInTheDocument();
    expect(screen.getByText('Банки та фінанси')).toBeInTheDocument();
    expect(screen.getByText('Державні органи')).toBeInTheDocument();
    expect(screen.getAllByText('Декларації').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) => element?.textContent?.replace(/\s/g, '') === '3450123').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) => element?.textContent?.replace(/\s/g, '') === '10/12').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Активувати контур').length).toBeGreaterThan(0);
  });
});
