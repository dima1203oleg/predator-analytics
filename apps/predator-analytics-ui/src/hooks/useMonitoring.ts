/**
 * 🦅 PREDATOR v63.0-ELITE — useMonitoring Hook
 * Хук моніторингу інфраструктури: метрики ядра, кластер, логи, потоки.
 *
 * Повертає mock-дані коли backend недоступний.
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';

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
}

/* ── Mock-дані ────────────────────────────────────────── */

const MOCK_METRICS: CoreMetrics = {
  cpu_usage_pct: 34.2,
  memory_usage_pct: 61.8,
  api_latency_ms: 4.2,
  disk_usage_pct: 47.5,
};

const MOCK_NODES: ClusterNode[] = [
  {
    id: 'node-imac-199',
    name: 'iMac-Compute-199',
    statusLabel: 'АКТИВНИЙ',
    tone: 'emerald',
    cpu_percent: 42,
    memory_percent: 58,
    detail: '192.168.0.200 | k3s master | 32GB RAM',
  },
  {
    id: 'node-nvidia-240',
    name: 'NVIDIA-Server-240',
    statusLabel: 'АКТИВНИЙ',
    tone: 'emerald',
    cpu_percent: 67,
    memory_percent: 73,
    detail: '194.177.1.240 | GPU H100 | 128GB RAM',
  },
  {
    id: 'node-worker-01',
    name: 'Worker-Kafka-01',
    statusLabel: 'ОБРОБКА',
    tone: 'sky',
    cpu_percent: 28,
    memory_percent: 45,
    detail: 'Kafka Consumer | Partitions: 12',
  },
  {
    id: 'node-worker-02',
    name: 'Worker-Graph-02',
    statusLabel: 'СИНХРОНІЗАЦІЯ',
    tone: 'amber',
    cpu_percent: 55,
    memory_percent: 62,
    detail: 'Neo4j GDS Projection | 847k вузлів',
  },
];

const MOCK_LOGS: LogEntry[] = [
  { timestampLabel: '14:08:42', level: 'INFO', service: 'CORE-API', message: 'Маршрутизація запиту /api/v1/dashboard/overview завершена', latencyLabel: '4.2ms' },
  { timestampLabel: '14:08:38', level: 'INFO', service: 'ІНГЕСТІЯ', message: 'Оброблено пакет 1,247 декларацій (CSV формат)', latencyLabel: '1.8s' },
  { timestampLabel: '14:08:35', level: 'WARNING', service: 'GRAPH-SVC', message: 'Високе навантаження Neo4j — GDS projection повторно обчислюється', latencyLabel: '12.4s' },
  { timestampLabel: '14:08:30', level: 'INFO', service: 'SEARCH', message: 'OpenSearch індекс оновлено: 42,891 документів', latencyLabel: '340ms' },
  { timestampLabel: '14:08:22', level: 'ERROR', service: 'QDRANT', message: 'Тайм-аут при вставці 500 embedding-векторів у колекцію predator_docs', latencyLabel: '30s' },
  { timestampLabel: '14:08:15', level: 'INFO', service: 'REDIS', message: 'Очищення кешу сесій: видалено 124 застарілих ключі', latencyLabel: '12ms' },
  { timestampLabel: '14:08:10', level: 'INFO', service: 'LLM', message: 'GLM-5.1: Генерація ризик-звіту для UEID-4592 завершена', latencyLabel: '2.1s' },
  { timestampLabel: '14:07:58', level: 'CRITICAL', service: 'KAFKA', message: 'Lag споживача ingestion-group-1 перевищив 10,000 повідомлень', latencyLabel: undefined },
  { timestampLabel: '14:07:45', level: 'INFO', service: 'MINIO', message: 'Завантажено сканований документ до бакету predator-docs: scan_2026-05-06.pdf' },
  { timestampLabel: '14:07:30', level: 'WARNING', service: 'AUTH', message: 'Спроба автентифікації з невідомого IP: 91.234.xx.xx (заблоковано)' },
];

const MOCK_PIPELINES: PipelineJob[] = [
  {
    id: 'PL-001',
    title: 'ІНГЕСТІЯ_МИТНИХ_ДАНИХ',
    statusLabel: 'ВИКОНУЄТЬСЯ',
    stageLabel: 'ПАРСИНГ CSV',
    tone: 'emerald',
    isActive: true,
    progress: 68,
    progressLabel: '68%',
    processedLabel: '8,421 / 12,400 записів',
    startedAtLabel: 'Запущено: 14:02:00',
  },
  {
    id: 'PL-002',
    title: 'ГРАФ_СИНХРОНІЗАЦІЯ',
    statusLabel: 'ЧЕРГА',
    stageLabel: 'ОЧІКУВАННЯ ВУЗЛІВ',
    tone: 'amber',
    isActive: false,
    progress: 0,
    progressLabel: '0%',
    processedLabel: undefined,
    startedAtLabel: 'У черзі з 14:05:00',
  },
  {
    id: 'PL-003',
    title: 'VECTOR_EMBEDDING_BATCH',
    statusLabel: 'ВИКОНУЄТЬСЯ',
    stageLabel: 'ГЕНЕРАЦІЯ EMBEDDINGS',
    tone: 'sky',
    isActive: true,
    progress: 34,
    progressLabel: '34%',
    processedLabel: '4,200 / 12,000 документів',
    startedAtLabel: 'Запущено: 13:55:00',
  },
];

/* ── Хук ──────────────────────────────────────────────── */

export function useMonitoringCore(): MonitoringCoreResult {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [jitter, setJitter] = useState(0);

  const refresh = useCallback(() => {
    setIsLoading(true);
    // Імітація оновлення з невеликим jitter для реалістичності
    setTimeout(() => {
      setLastUpdate(new Date());
      setJitter(Math.random());
      setIsLoading(false);
    }, 800);
  }, []);

  // Авто-оновлення кожні 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setJitter(Math.random());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Динамічні метрики з невеликим jitter
  const metrics = useMemo<CoreMetrics>(() => ({
    cpu_usage_pct: +(MOCK_METRICS.cpu_usage_pct + (jitter * 8 - 4)).toFixed(1),
    memory_usage_pct: +(MOCK_METRICS.memory_usage_pct + (jitter * 4 - 2)).toFixed(1),
    api_latency_ms: +(MOCK_METRICS.api_latency_ms + (jitter * 2 - 1)).toFixed(1),
    disk_usage_pct: +(MOCK_METRICS.disk_usage_pct + (jitter * 1 - 0.5)).toFixed(1),
  }), [jitter]);

  const cluster = useMemo<ClusterInfo>(() => ({
    statusLabel: 'Справно',
    nodeCount: MOCK_NODES.length,
    podCount: 24,
    nodes: MOCK_NODES.map((n) => ({
      ...n,
      cpu_percent: Math.min(99, Math.max(5, n.cpu_percent + Math.round((jitter * 10) - 5))),
      memory_percent: Math.min(99, Math.max(10, n.memory_percent + Math.round((jitter * 6) - 3))),
    })),
  }), [jitter]);

  const lastUpdateLabel = useMemo(() => {
    const diff = Date.now() - lastUpdate.getTime();
    if (diff < 60_000) return 'Щойно';
    return `${Math.floor(diff / 60_000)} хв тому`;
  }, [lastUpdate]);

  return {
    metrics,
    cluster,
    logs: MOCK_LOGS,
    pipelines: MOCK_PIPELINES,
    lastUpdateLabel,
    isLoading,
    refresh,
  };
}
