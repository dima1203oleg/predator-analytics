import { describe, expect, it } from 'vitest';
import {
  createEmptyRegistryStats,
  deriveImprovementProgress,
  normalizeClusterPods,
  normalizeHealthChecks,
  normalizePodLogs,
  normalizeRegistryStats,
} from '../systemFactoryView.utils';

describe('systemFactoryView.utils', () => {
  it('повертає чесно порожню реєстрову статистику без вигаданих чисел', () => {
    const snapshot = createEmptyRegistryStats();

    expect(snapshot.postgres.rows).toBe('Н/д');
    expect(snapshot.kafka.messages_sec).toBe('Н/д');
    expect(snapshot.neo4j.status).toBe('unknown');
  });

  it('нормалізує health checks тільки з підтверджених сервісів', () => {
    const checks = normalizeHealthChecks({
      timestamp: '2026-03-30T09:00:00Z',
      services: [
        { name: 'postgresql', label: 'PostgreSQL', status: 'ok', latency_ms: 14 },
        { name: 'neo4j', label: 'Neo4j', status: 'degraded', latency_ms: 48 },
      ],
    });

    expect(checks).toHaveLength(2);
    expect(checks[0].service).toBe('PostgreSQL');
    expect(checks[0].status).toBe('healthy');
    expect(checks[0].latency).toBe(14);
    expect(checks[1].status).toBe('degraded');
    expect(checks[1].uptime).toBe('Н/д');
  });

  it('нормалізує pod telemetry без локальних fallback-ів', () => {
    const pods = normalizeClusterPods({
      pods: [
        {
          id: 'pod-1',
          name: 'predator-core-api',
          status: 'Running',
          restarts: 2,
          replicas: 3,
          cpu: '220m',
          memory: '512Mi',
          age: '4d',
        },
      ],
    });

    expect(pods).toEqual([
      {
        id: 'pod-1',
        name: 'predator-core-api',
        status: 'Running',
        restarts: 2,
        replicas: 3,
        cpu: '220m',
        mem: '512Mi',
        uptime: '4d',
      },
    ]);
  });

  it('фільтрує под-логи тільки за релевантним сервісом', () => {
    const logs = normalizePodLogs(
      [
        {
          timestamp: '2026-03-30T09:15:00Z',
          service: 'predator-core-api',
          level: 'info',
          msg: 'Запит завершено успішно',
        },
        {
          timestamp: '2026-03-30T09:16:00Z',
          service: 'predator-graph-worker',
          level: 'warn',
          msg: 'Зростання черги',
        },
      ],
      { id: 'pod-1', name: 'predator-core-api' },
    );

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/predator-core-api/i);
    expect(logs[0]).toMatch(/запит завершено успішно/i);
  });

  it('обчислює прогрес лише з серверної фази OODA', () => {
    expect(deriveImprovementProgress(false, 'observe')).toBe(0);
    expect(deriveImprovementProgress(true, 'observe')).toBe(25);
    expect(deriveImprovementProgress(true, 'orient')).toBe(50);
    expect(deriveImprovementProgress(true, 'decide')).toBe(75);
    expect(deriveImprovementProgress(true, 'act')).toBe(100);
  });

  it('будує registry stats тільки з підтвердженого графа', () => {
    const snapshot = normalizeRegistryStats({
      node_count: 420,
      relationship_count: 1337,
    });

    expect(snapshot.neo4j.nodes).toBe('420');
    expect(snapshot.neo4j.edges).toBe('1� 337');
    expect(snapshot.neo4j.status).toBe('online');
    expect(snapshot.redis.memory).toBe('Н/д');
  });
});
