import { describe, expect, it } from 'vitest';
import type { DashboardOverview } from '@/services/api/dashboard';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';
import { normalizeClientsHubSnapshot } from '../clientsHubView.utils';

const createOverview = (): DashboardOverview => ({
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
  top_risk_companies: [
    { name: 'ТОВ Альфа', edrpou: '12345678', maxRisk: 87, totalValue: 1200000, count: 4 },
    { name: 'ТОВ Бета', edrpou: '87654321', maxRisk: 79, totalValue: 850000, count: 3 },
  ],
  alerts: [
    {
      id: 'a1',
      type: 'risk',
      message: 'Підвищенийризик',
      severity: 'critical',
      timestamp: '2026-03-30T09:10:00.000Z',
      sector: 'banking',
      company: 'ТОВ Альфа',
      value: 10,
    },
  ],
  categories: {},
  countries: {},
  customs_offices: {},
  infrastructure: {},
  engines: {},
  generated_at: '2026-03-30T09:15:00.000Z',
});

const createSystemStatus = (): SystemStatusResponse => ({
  status: 'ok',
  healthy: true,
  overall_status: 'healthy',
  version: '55.1',
  environment: 'dev',
  uptime: '2d',
  services: [],
  summary: {
    total: 12,
    healthy: 10,
    degraded: 1,
    failed: 1,
  },
  metrics: {},
  last_sync: null,
  timestamp: '2026-03-30T09:16:00.000Z',
});

const createSystemStats = (): SystemStatsResponse => ({
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
  last_sync: null,
  timestamp: '2026-03-30T09:16:30.000Z',
});

describe('normalizeClientsHubSnapshot', () => {
  it('повертає чесний порожній стан без вигаданих значень', () => {
    const snapshot = normalizeClientsHubSnapshot(null, null, null);

    expect(snapshot.hasAnyData).toBe(false);
    expect(snapshot.summary[0]?.value).toBe('Н/д');
    expect(snapshot.segments.business.statusLabel).toBe('Немає підтвердження');
    expect(snapshot.segments.business.metrics[0]?.value).toBe('Н/д');
    expect(snapshot.segments.regulators.metrics[0]?.value).toBe('Н/д');
  });

  it('будує сегменти з реальних dashboard та system агрегатів', () => {
    const snapshot = normalizeClientsHubSnapshot(
      createOverview(),
      createSystemStatus(),
      createSystemStats(),
    );

    expect(snapshot.hasAnyData).toBe(true);
    expect(snapshot.summary[0]?.value).toBe('3 450 123');
    expect(snapshot.summary[3]?.value).toBe('10 / 12');
    expect(snapshot.segments.business.statusLabel).toBe('Підтверджено');
    expect(snapshot.segments.business.metrics[0]?.value).toBe('3 450 123');
    expect(snapshot.segments.business.metrics[1]?.value).toBe('98 000 000 $');
    expect(snapshot.segments.banking.metrics[2]?.value).toBe('82');
    expect(snapshot.segments.government.metrics[2]?.value).toBe('7');
    expect(snapshot.segments.law.metrics[1]?.value).toBe('98 400');
    expect(snapshot.segments.regulators.metrics[0]?.value).toBe('10 / 12');
    expect(snapshot.segments.legal.metrics[2]?.value).toBe('183 мс');
  });
});
