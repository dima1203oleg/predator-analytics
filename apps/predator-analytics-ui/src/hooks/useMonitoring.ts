/**
 * 🦅 PREDATOR v63.0-ELITE — useMonitoring Hook
 * Хук моніторингу інфраструктури: метрики ядра, кластер, логи, потоки.
 *
 * ✅ СПРАВЖНІ ДАНІ: Викликає /system/stats, /system/cluster, /system/logs
 * 🔄 FALLBACK: Mock-дані коли backend недоступний (offline mode)
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { systemApi } from '@/services/api/system';
import { monitoringApi, etlApi } from '@/services/api/monitoring';
import { useBackendStatus } from './useBackendStatus';

/* ── Типи ─────────────────────────────────────────────── */

interface CoreMetrics {
  cpu_usage_pct: number;
  memory_usage_pct: number;
  api_latency_ms: number;
  disk_usage_pct: number;
}

type NodeTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

interface ClusterNode {
  id: string;
  name: string;
  statusLabel: string;
  tone: NodeTone;
  cpu_percent: number;
  memory_percent: number;
  detail?: string;
}

interface ClusterInfo {
  statusLabel: string;
  nodeCount: number;
  podCount: number;
  nodes: ClusterNode[];
}

interface LogEntry {
  timestampLabel: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
  latencyLabel?: string;
}

interface PipelineJob {
  id: string;
  title: string;
  statusLabel: string;
  stageLabel: string;
  tone: NodeTone;
  isActive: boolean;
  progress: number;
  progressLabel: string;
  processedLabel?: string;
  startedAtLabel: string;
}

interface MonitoringCoreResult {
  metrics: CoreMetrics;
  cluster: ClusterInfo;
  logs: LogEntry[];
  pipelines: PipelineJob[];
  lastUpdateLabel: string;
  isLoading: boolean;
  refresh: () => void;
  /** Чи використовуються реальні дані (false = мок) */
  isTruthData: boolean;
}

/* ── Mock-дані (offline fallback) ──────────────────────── */

const EMPTY_METRICS: CoreMetrics = {
  cpu_usage_pct: 0,
  memory_usage_pct: 0,
  api_latency_ms: 0,
  disk_usage_pct: 0,
};

const EMPTY_NODES: ClusterNode[] = [];
const EMPTY_LOGS: LogEntry[] = [];
const EMPTY_PIPELINES: PipelineJob[] = [];

/* ── Mappers: API → UI типи ───────────────────────────── */

const mapApiStatsToMetrics = (stats: any): CoreMetrics => ({
  cpu_usage_pct: +(stats.cpu_percent ?? stats.cpu_usage ?? 0).toFixed(1),
  memory_usage_pct: +(stats.memory_percent ?? stats.memory_usage ?? 0).toFixed(1),
  api_latency_ms: +(stats.avg_latency ?? 0).toFixed(1),
  disk_usage_pct: +(stats.disk_percent ?? stats.disk_usage ?? 0).toFixed(1),
});

const mapApiClusterToNodes = (cluster: any): ClusterNode[] => {
  const nodes = Array.isArray(cluster?.nodes) ? cluster.nodes : cluster?.items ?? [];
  if (nodes.length === 0) return EMPTY_NODES;
  return nodes.map((n: any, i: number) => ({
    id: String(n.id ?? n.name ?? `node-${i}`),
    name: String(n.name ?? n.id ?? `Вузол ${i + 1}`),
    statusLabel: String(n.status ?? n.statusLabel ?? 'НЕВІДОМО'),
    tone: (n.tone ?? n.status === 'online' ? 'emerald' : n.status === 'degraded' ? 'amber' : 'rose') as NodeTone,
    cpu_percent: Math.min(99, Math.max(0, Math.round(n.cpu_percent ?? n.cpu ?? 0))),
    memory_percent: Math.min(99, Math.max(0, Math.round(n.memory_percent ?? n.memory ?? 0))),
    detail: n.detail ?? n.description ?? undefined,
  }));
};

const mapApiLogsToEntries = (logs: any[]): LogEntry[] => {
  if (!Array.isArray(logs) || logs.length === 0) return EMPTY_LOGS;
  return logs.slice(0, 20).map((log: any) => ({
    timestampLabel: typeof log.timestamp === 'string'
      ? log.timestamp.slice(11, 19)
      : new Date().toLocaleTimeString('uk-UA', { hour12: false }),
    level: (log.level ?? 'INFO').toUpperCase() as LogEntry['level'],
    service: String(log.service ?? log.source ?? 'SYSTEM').toUpperCase(),
    message: String(log.message ?? log.msg ?? log.event ?? 'Подія без тексту'),
    latencyLabel: log.latency_ms ? `${log.latency_ms}ms` : undefined,
  }));
};

const mapApiJobsToPipelines = (jobs: any[]): PipelineJob[] => {
  if (!Array.isArray(jobs) || jobs.length === 0) return EMPTY_PIPELINES;
  return jobs.slice(0, 10).map((job: any, i: number) => ({
    id: String(job.id ?? job.job_id ?? `PL-${String(i).padStart(3, '0')}`),
    title: String(job.title ?? job.name ?? job.type ?? `JOB_${i}`).toUpperCase(),
    statusLabel: String(job.status ?? job.statusLabel ?? 'НЕВІДОМО').toUpperCase(),
    stageLabel: String(job.stage ?? job.stageLabel ?? 'ОБРОБКА').toUpperCase(),
    tone: (job.tone ?? job.status === 'running' ? 'emerald' : job.status === 'queued' ? 'amber' : 'sky') as NodeTone,
    isActive: job.status === 'running' || job.isActive === true,
    progress: Math.min(100, Math.max(0, Math.round(job.progress ?? 0))),
    progressLabel: `${Math.min(100, Math.max(0, Math.round(job.progress ?? 0)))}%`,
    processedLabel: job.processedLabel ?? job.processed ?? undefined,
    startedAtLabel: job.started_at
      ? `Запущено: ${job.started_at.slice(11, 16)}`
      : job.startedAtLabel ?? 'Невідомо',
  }));
};

/* ── Хук ──────────────────────────────────────────────── */

export function useMonitoringCore(): MonitoringCoreResult {
  const { isOffline } = useBackendStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isTruthData, setIsTruthData] = useState(false);

  // Реальні дані з API
  const [realMetrics, setRealMetrics] = useState<CoreMetrics | null>(null);
  const [realCluster, setRealCluster] = useState<ClusterInfo | null>(null);
  const [realLogs, setRealLogs] = useState<LogEntry[] | null>(null);
  const [realPipelines, setRealPipelines] = useState<PipelineJob[] | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchRealData = useCallback(async () => {
    if (isOffline) {
      setIsTruthData(false);
      return;
    }
    setIsLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      // Паралельні запити до всіх endpoints
      const [stats, cluster, logs, jobs] = await Promise.allSettled([
        systemApi.getStats().catch(() => null),
        systemApi.getCluster().catch(() => null),
        monitoringApi.streamSystemLogs(20).catch(() => []),
        etlApi.getJobs(10).catch(() => []),
      ]);

      let hasAnyReal = false;

      if (stats.status === 'fulfilled' && stats.value) {
        setRealMetrics(mapApiStatsToMetrics(stats.value));
        hasAnyReal = true;
      }

      if (cluster.status === 'fulfilled' && cluster.value) {
        const nodes = mapApiClusterToNodes(cluster.value);
        setRealCluster({
          statusLabel: cluster.value.status ?? 'Справно',
          nodeCount: nodes.length,
          podCount: cluster.value.podCount ?? cluster.value.pods ?? 24,
          nodes,
        });
        hasAnyReal = true;
      }

      if (logs.status === 'fulfilled' && logs.value) {
        setRealLogs(mapApiLogsToEntries(logs.value));
        hasAnyReal = true;
      }

      if (jobs.status === 'fulfilled' && jobs.value) {
        setRealPipelines(mapApiJobsToPipelines(jobs.value));
        hasAnyReal = true;
      }

      setIsTruthData(hasAnyReal);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn('[useMonitoring] Помилка завантаження реальних даних:', err);
      setIsTruthData(false);
    } finally {
      setIsLoading(false);
    }
  }, [isOffline]);

  // Первинне завантаження + авто-оновлення
  useEffect(() => {
    fetchRealData();
    const interval = setInterval(fetchRealData, 30_000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchRealData]);

  // Ручне оновлення
  const refresh = useCallback(() => {
    fetchRealData();
  }, [fetchRealData]);

  // Вибір: реальні дані або мок (fallback)
  const metrics = realMetrics ?? EMPTY_METRICS;
  const cluster = realCluster ?? {
    statusLabel: 'Офлайн',
    nodeCount: EMPTY_NODES.length,
    podCount: 0,
    nodes: EMPTY_NODES,
  };
  const logs = realLogs ?? EMPTY_LOGS;
  const pipelines = realPipelines ?? EMPTY_PIPELINES;

  const lastUpdateLabel = useMemo(() => {
    const diff = Date.now() - lastUpdate.getTime();
    if (diff < 60_000) return 'Щойно';
    return `${Math.floor(diff / 60_000)} хв тому`;
  }, [lastUpdate]);

  return {
    metrics,
    cluster,
    logs,
    pipelines,
    lastUpdateLabel,
    isLoading,
    refresh,
    isTruthData,
  };
}
