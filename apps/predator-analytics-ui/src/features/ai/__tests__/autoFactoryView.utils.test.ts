import { describe, expect, it } from 'vitest';
import { normalizeAutoFactorySnapshot } from '../autoFactoryView.utils';

describe('autoFactoryView.utils', () => {
  it('повертає чесний порожній стан без локальних вигадок', () => {
    const snapshot = normalizeAutoFactorySnapshot(null, [], [], null, [], null, null);

    expect(snapshot.hasAnyData).toBe(false);
    expect(snapshot.statusLabel).toBe('Очікування');
    expect(snapshot.metrics[0].value).toBe('Н/д');
    expect(snapshot.bugs).toEqual([]);
    expect(snapshot.logs).toEqual([]);
    expect(snapshot.reliability[0].valueLabel).toBe('Н/д');
  });

  it('нормалізує активний OODA статус, реальні баги та телеметрію', () => {
    const snapshot = normalizeAutoFactorySnapshot(
      {
        is_running: true,
        current_phase: 'decide',
        cycles_completed: 1542,
        improvements_made: 18,
        last_update: '2026-03-30T09:30:00Z',
        logs: ['[09:30] SYSTEM: Синтез рішення триває'],
      },
      [
        {
          id: 'bug-1',
          description: 'Потрібно зменшити затримку ETL',
          component: 'etl',
          file: 'services/etl.py:44',
          severity: 'high',
          status: 'running',
          fixProgress: 62,
        },
      ],
      [{ id: 'gold-1' }, { id: 'gold-2' }],
      {
        avg_score: 96.4,
        total_patterns: 8,
      },
      ['[09:31] WARN: Зростання черги'],
      {
        cpu_usage: 0,
        cpu_percent: 61,
        cpu_count: 8,
        memory_usage: 0,
        memory_percent: 52,
        memory_total: 0,
        memory_used: 0,
        memory_available: 0,
        disk_usage: 0,
        disk_percent: 0,
        disk_total: 0,
        disk_used: 0,
        disk_free: 0,
        network_bytes_sent: 0,
        network_bytes_recv: 0,
        active_connections: 0,
        active_tasks: 12,
        uptime: '1d',
        uptime_seconds: 0,
        documents_total: 0,
        search_rate: 0,
        avg_latency: 183,
        indexing_rate: 0,
        total_indices: 0,
        storage_gb: 0,
        last_sync: null,
        timestamp: '2026-03-30T09:31:00Z',
      },
      {
        status: 'ok',
        healthy: true,
        overall_status: 'healthy',
        version: '55.1',
        environment: 'test',
        uptime: '1d',
        services: [],
        summary: { total: 10, healthy: 9, degraded: 1, failed: 0 },
        metrics: {},
        last_sync: null,
        timestamp: '2026-03-30T09:31:00Z',
      },
    );

    expect(snapshot.isRunning).toBe(true);
    expect(snapshot.cycleLabel).toBe('1� 542');
    expect(snapshot.avgScoreLabel).toBe('96%');
    expect(snapshot.pipeline.find((stage) => stage.id === 'decide')?.status).toBe('active');
    expect(snapshot.bugs[0].progressLabel).toBe('62%');
    expect(snapshot.metrics[2].value).toBe('1');
    expect(snapshot.logs).toHaveLength(2);
    expect(snapshot.reliability[1].valueLabel).toBe('90%');
  });
});
