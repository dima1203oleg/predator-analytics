import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';
import AIControlPlane from '../AIControlPlane';

const { getEngines, getStatus, getStats, getLogs } = vi.hoisted(() => ({
  getEngines: vi.fn(),
  getStatus: vi.fn(),
  getStats: vi.fn(),
  getLogs: vi.fn(),
}));

vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    nodes: [],
    healingProgress: 100,
    activeFailover: false,
    isOffline: false,
    isTruthOnly: true,
    modeLabel: 'Режим правдивих даних',
    sourceLabel: 'localhost:9080/api/v1',
    sourceType: 'local',
    statusLabel: 'Зʼєднання активне',
  }),
}));

vi.mock('@/services/api/system', () => ({
  systemApi: {
    getEngines,
    getStatus,
    getStats,
    getLogs,
  },
}));

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('@/components/CyberGrid', () => ({
  CyberGrid: () => <div data-testid="cyber-grid" />,
}));

vi.mock('@/components/layout/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/TacticalCard', () => ({
  TacticalCard: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div>
      {title ? <div>{title}</div> : null}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ViewHeader', () => ({
  ViewHeader: ({ title, stats, actions }: { title: React.ReactNode; stats?: Array<{ label: string; value: string }>; actions?: React.ReactNode }) => (
    <div>
      <div>{title}</div>
      {stats?.map((stat) => (
        <div key={stat.label}>
          <span>{stat.label}</span>
          <span>{stat.value}</span>
        </div>
      ))}
      {actions}
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const statusPayload: SystemStatusResponse = {
  status: 'ok',
  healthy: true,
  overall_status: 'healthy',
  version: '55.1',
  environment: 'test',
  uptime: '2d',
  last_sync: '2026-03-30T10:00:00Z',
  services: [],
  summary: {
    total: 10,
    healthy: 9,
    degraded: 1,
    failed: 0,
  },
  metrics: {},
  timestamp: '2026-03-30T11:00:00Z',
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
  avg_latency: 14,
  indexing_rate: 16,
  total_indices: 28,
  storage_gb: 412,
  last_sync: '2026-03-30T10:00:00Z',
  timestamp: '2026-03-30T11:01:00Z',
};

describe('AIControlPlane', () => {
  beforeEach(() => {
    getEngines.mockResolvedValue({
      neural_behavioral: { id: 'behavioral', score: 89, trend: '+2.1%', status: 'optimal', throughput: 42400, latency: 12, load: 45 },
      influence_mapping: { id: 'influence', score: 68, trend: '-3.2%', status: 'calibrating', throughput: 12500, latency: 45, load: 88 },
    });
    getStatus.mockResolvedValue(statusPayload);
    getStats.mockResolvedValue(statsPayload);
    getLogs.mockResolvedValue([
      { id: 'log-1', timestamp: '2026-03-30T11:02:00Z', service: 'core-api', level: 'INFO', message: 'Цикл перевірки завершено.' },
    ]);
  });

  it('рендерить підтверджені рушії та журнал із системних маршрутів', async () => {
    render(<AIControlPlane />);

    expect(await screen.findByText(/Контур керування/i)).toBeInTheDocument();
    expect(screen.getByText('Поведінкове ядро')).toBeInTheDocument();
    expect(screen.getByText('Мапування впливу')).toBeInTheDocument();
    expect(screen.getByText('Джерела: /system/engines, /system/status, /system/stats, /system/logs/stream')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Журнал/i }));

    expect(await screen.findByText('Цикл перевірки завершено.')).toBeInTheDocument();
  });
});
