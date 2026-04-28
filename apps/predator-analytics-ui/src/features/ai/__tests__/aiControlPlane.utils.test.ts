import { describe, expect, it } from 'vitest';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';
import { normalizeAIControlPlaneSnapshot } from '../aiControlPlane.utils';

const createSystemStatus = (): SystemStatusResponse => ({
  status: 'ok',
  healthy: true,
  overall_status: 'healthy',
  version: '55.1',
  environment: 'test',
  uptime: '2d',
  services: [],
  summary: {
    total: 10,
    healthy: 9,
    degraded: 1,
    failed: 0,
  },
  metrics: {},
  last_sync: null,
  timestamp: '2026-03-30T11:00:00Z',
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
  avg_latency: 14,
  indexing_rate: 16,
  total_indices: 28,
  storage_gb: 412,
  last_sync: null,
  timestamp: '2026-03-30T11:01:00Z',
});

describe('aiControlPlane.utils', () => {
  it('повертає чесний порожній стан без вигаданих рушіїв і логів', () => {
    const snapshot = normalizeAIControlPlaneSnapshot(null, null, null, []);

    expect(snapshot.hasAnyData).toBe(false);
    expect(snapshot.activeCount).toBe(0);
    expect(snapshot.metrics[0]?.value).toBe('Н/д');
    expect(snapshot.engines).toEqual([]);
    expect(snapshot.logs).toEqual([]);
  });

  it('нормалізує системні рушії, агрегати та журнал', () => {
    const snapshot = normalizeAIControlPlaneSnapshot(
      {
        neural_behavioral: { id: 'behavioral', score: 89, trend: '+2.1%', status: 'optimal', throughput: 42400, latency: 12, load: 45 },
        influence_mapping: { id: 'influence', score: 68, trend: '-3.2%', status: 'calibrating', throughput: 12500, latency: 45, load: 88 },
        structural_vault: { id: 'structural', score: 97, trend: '+1.4%', status: 'optimal', throughput: 28900, latency: 5, load: 12 },
      },
      createSystemStatus(),
      createSystemStats(),
      [
        { id: 'log-1', timestamp: '2026-03-30T11:02:00Z', service: 'core-api', level: 'INFO', message: 'Цикл перевірки завершено.' },
        { id: 'log-2', timestamp: '2026-03-30T11:01:00Z', service: 'graph-service', level: 'WARN', message: 'Зросла затримка графового обчислення.' },
      ],
    );

    expect(snapshot.hasAnyData).toBe(true);
    expect(snapshot.activeCount).toBe(2);
    expect(snapshot.degradedCount).toBe(1);
    expect(snapshot.metrics[0]?.value).toBe('2 / 3');
    expect(snapshot.metrics[1]?.value).toBe('85%');
    expect(snapshot.metrics[2]?.value).toBe('14 мс');
    expect(snapshot.metrics[3]?.value).toBe('83 800');
    expect(snapshot.metrics[4]?.value).toBe('9 / 10');
    expect(snapshot.engines[0]?.title).toBe('Поведінкове ядро');
    expect(snapshot.engines[1]?.statusLabel).toBe('Калібрування');
    expect(snapshot.logs[1]?.levelLabel).toBe('УВАГА');
    expect(snapshot.lastUpdatedLabel).not.toBeNull();
  });
});
