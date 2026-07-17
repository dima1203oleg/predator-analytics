type UnknownRecord = Record<string, unknown>;

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'recovering';
export type RegistryAvailability = 'online' | 'offline' | 'unknown';
export type PodStatus = 'Running' | 'Pending' | 'Terminating' | 'Restarting';

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'detected' | 'fixing' | 'fixed';
export type InfinitePhase = 'observe' | 'orient' | 'decide' | 'act';

export interface FactoryBugRecord {
  id: string;
  description: string;
  severity: BugSeverity;
  component: string;
  file: string;
  status: BugStatus;
  fixProgress: number;
}

export interface FactoryHealthCheckRecord {
  id: string;
  service: string;
  endpoint: string;
  status: HealthStatus;
  latency: number | null;
  uptime: string;
  lastCheckLabel: string;
}

export interface FactoryPodRecord {
  id: string;
  name: string;
  status: PodStatus;
  restarts: number;
  replicas: number;
  cpu: string;
  mem: string;
  uptime: string;
}

export interface FactoryRegistryStatsSnapshot {
  postgres: { rows: string; size: string; status: RegistryAvailability };
  neo4j: { nodes: string; edges: string; status: RegistryAvailability };
  opensearch: { docs: string; indices: string; status: RegistryAvailability };
  qdrant: { points: string; collections: string; status: RegistryAvailability };
  redis: { keys: string; memory: string; status: RegistryAvailability };
  kafka: { topics: string; messages_sec: string; status: RegistryAvailability };
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toRecordArray = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const formatCount = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatTime = (value?: string | null): string => {
  if (!value) {
    return 'Н/д';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Н/д';
  }

  return parsed.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const normalizeHealthStatus = (value?: string | null): HealthStatus => {
  const normalized = value?.trim().toLowerCase() ?? 'unknown';

  if (['ok', 'healthy', 'online', 'running', 'ready', 'success'].includes(normalized)) {
    return 'healthy';
  }

  if (['warning', 'warn', 'degraded', 'partial'].includes(normalized)) {
    return 'degraded';
  }

  if (['recovering', 'starting', 'initializing'].includes(normalized)) {
    return 'recovering';
  }

  return 'down';
};

const normalizePodStatus = (value?: string | null): PodStatus => {
  const normalized = value?.trim().toLowerCase() ?? 'unknown';

  if (['running', 'ready', 'healthy', 'online'].includes(normalized)) {
    return 'Running';
  }

  if (['terminating', 'stopping', 'deleting'].includes(normalized)) {
    return 'Terminating';
  }

  if (['restarting', 'crashloopbackoff', 'backoff'].includes(normalized)) {
    return 'Restarting';
  }

  return 'Pending';
};

const deriveEndpoint = (serviceName: string, details?: UnknownRecord | null): string => {
  const explicitEndpoint =
    readString(details?.endpoint) ??
    readString(details?.dsn) ??
    readString(details?.url);

  if (explicitEndpoint) {
    return explicitEndpoint;
  }

  return serviceName;
};

export const createEmptyRegistryStats = (): FactoryRegistryStatsSnapshot => ({
  postgres: { rows: 'Н/д', size: 'Н/д', status: 'unknown' },
  neo4j: { nodes: 'Н/д', edges: 'Н/д', status: 'unknown' },
  opensearch: { docs: 'Н/д', indices: 'Н/д', status: 'unknown' },
  qdrant: { points: 'Н/д', collections: 'Н/д', status: 'unknown' },
  redis: { keys: 'Н/д', memory: 'Н/д', status: 'unknown' },
  kafka: { topics: 'Н/д', messages_sec: 'Н/д', status: 'unknown' },
});

export const normalizeRegistryStats = (graphSummary: unknown): FactoryRegistryStatsSnapshot => {
  const next = createEmptyRegistryStats();

  if (!isRecord(graphSummary)) {
    return next;
  }

  const nodeCount = readNumber(graphSummary.node_count) ?? readNumber(graphSummary.nodes);
  const relationshipCount =
    readNumber(graphSummary.relationship_count) ??
    readNumber(graphSummary.edges);

  if (nodeCount != null || relationshipCount != null) {
    next.neo4j = {
      nodes: formatCount(nodeCount),
      edges: formatCount(relationshipCount),
      status: 'online',
    };
  }

  return next;
};

export const normalizeHealthChecks = (input: unknown): FactoryHealthCheckRecord[] => {
  if (!isRecord(input)) {
    return [];
  }

  const timestamp =
    readString(input.timestamp) ??
    readString(input.generated_at) ??
    null;

  if (Array.isArray(input.services)) {
    return toRecordArray(input.services).map((service, index) => ({
      id: readString(service.name) ?? `service-${index}`,
      service:
        readString(service.label) ??
        readString(service.name) ??
        `Сервіс ${index + 1}`,
      endpoint: deriveEndpoint(
        readString(service.name) ?? `service-${index}`,
        isRecord(service.details) ? service.details : null,
      ),
      status: normalizeHealthStatus(readString(service.status)),
      latency: readNumber(service.latency_ms),
      uptime: 'Н/д',
      lastCheckLabel: formatTime(timestamp),
    }));
  }

  if (isRecord(input.services)) {
    return Object.entries(input.services).map(([key, value], index) => {
      const service = isRecord(value) ? value : {};
      const latencySeconds = readNumber(service.duration_seconds);
      const latency =
        latencySeconds == null
          ? readNumber(service.latency_ms)
          : Math.round(latencySeconds * 1000);

      return {
        id: key || `service-${index}`,
        service: key || `Сервіс ${index + 1}`,
        endpoint: deriveEndpoint(key, isRecord(service.details) ? service.details : null),
        status: normalizeHealthStatus(readString(service.status)),
        latency,
        uptime: 'Н/д',
        lastCheckLabel: formatTime(timestamp),
      };
    });
  }

  return [];
};

export const normalizeClusterPods = (input: unknown): FactoryPodRecord[] => {
  if (!isRecord(input)) {
    return [];
  }

  return toRecordArray(input.pods).map((pod, index) => ({
    id: readString(pod.id) ?? readString(pod.name) ?? `pod-${index}`,
    name: readString(pod.name) ?? `Под ${index + 1}`,
    status: normalizePodStatus(
      readString(pod.status) ??
      readString(pod.phase) ??
      readString(pod.state),
    ),
    restarts:
      Math.max(
        0,
        Math.round(
          readNumber(pod.restarts) ??
          readNumber(pod.restart_count) ??
          readNumber(pod.restartCount) ??
          0,
        ),
      ),
    replicas:
      Math.max(
        1,
        Math.round(
          readNumber(pod.replicas) ??
          readNumber(pod.ready_replicas) ??
          readNumber(pod.ready) ??
          1,
        ),
      ),
    cpu: readString(pod.cpu) ?? 'Н/д',
    mem:
      readString(pod.memory) ??
      readString(pod.mem) ??
      'Н/д',
    uptime:
      readString(pod.age) ??
      readString(pod.uptime) ??
      'Н/д',
  }));
};

export const deriveImprovementProgress = (
  isRunning: boolean,
  phase: string | null | undefined,
): number => {
  if (!isRunning) {
    return 0;
  }

  const normalized = phase?.trim().toLowerCase() ?? 'observe';

  if (normalized === 'observe') return 25;
  if (normalized === 'orient') return 50;
  if (normalized === 'decide') return 75;
  if (normalized === 'act') return 100;

  return 10;
};

export const normalizePodLogs = (
  input: unknown,
  pod?: { id: string; name: string } | null,
): string[] => {
  const podTokens = pod
    ? [pod.id, pod.name]
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const lines = (Array.isArray(input) ? input : [])
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          id: `line-${index}`,
          search: entry.toLowerCase(),
          line: entry,
        };
      }

      if (!isRecord(entry)) {
        return null;
      }

      const timestamp = formatTime(readString(entry.timestamp) ?? readString(entry.created_at));
      const service = readString(entry.service) ?? 'system';
      const level = (readString(entry.level) ?? 'INFO').toUpperCase();
      const message =
        readString(entry.msg) ??
        readString(entry.message) ??
        readString(entry.line) ??
        'Подія без тексту';
      const line = `[${timestamp}] ${service.toUpperCase()} ${level}: ${message}`;

      return {
        id: readString(entry.id) ?? `line-${index}`,
        search: `${service} ${message}`.toLowerCase(),
        line,
      };
    })
    .filter((entry): entry is { id: string; search: string; line: string } => entry !== null);

  const filtered =
    podTokens.length > 0
      ? lines.filter((entry) => podTokens.some((token) => entry.search.includes(token)))
      : lines;

  return filtered.slice(-50).map((entry) => entry.line);
};
