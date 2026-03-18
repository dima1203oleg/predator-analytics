/**
 * Типи для моніторингу інфраструктури — сервери, GPU, сховище
 */

// ─── Дані з /api/v1/system/infrastructure ───────────────────────────────────

/** Компонент інфраструктури (PostgreSQL, OpenSearch, Qdrant, ...) */
export interface InfraComponent {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  version: string;
  latency_ms: number;
  /** Кількість записів — тільки для PostgreSQL */
  records?: number;
  /** Кількість документів — тільки для OpenSearch */
  documents?: number;
  /** Кількість векторів — тільки для Qdrant */
  vectors?: number;
  /** Кількість вузлів — тільки для GraphDB */
  nodes?: number;
  /** Кількість ребер — тільки для GraphDB */
  edges?: number;
  /** Кількість файлів — тільки для MinIO */
  files?: number;
  /** Кількість ключів — тільки для Redis */
  keys?: number;
}

/** Повна відповідь GET /api/v1/system/infrastructure */
export interface InfrastructureResponse {
  status: string;
  components: {
    postgresql: InfraComponent;
    opensearch: InfraComponent;
    qdrant: InfraComponent;
    graphdb: InfraComponent;
    minio: InfraComponent;
    redis: InfraComponent;
  };
}

/** Ключі компонентів для ітерації */
export type InfraComponentKey = keyof InfrastructureResponse['components'];

// ─── Серверні вузли (для розширеного UI) ─────────────────────────────────────

/** Вузол серверної інфраструктури */
export interface ServerNode {
  server_id: string;
  hostname: string;
  role: 'api' | 'worker' | 'gpu' | 'database' | 'cache';
  status: 'healthy' | 'degraded' | 'down';
  cpu_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  uptime_hours: number;
  location: string;
}

/** GPU пристрій */
export interface GpuDevice {
  gpu_id: string;
  server_id: string;
  name: string;
  utilization_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  temperature_c: number;
  power_draw_w: number;
  fan_speed_percent: number;
  active_processes: number;
  driver_version: string;
}

/** Пул сховища */
export interface StoragePool {
  pool_id: string;
  name: string;
  type: 'ssd' | 'hdd' | 'nvme' | 'object';
  used_gb: number;
  total_gb: number;
  iops: number;
  throughput_mbps: number;
}
