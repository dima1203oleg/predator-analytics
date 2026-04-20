/**
 * PREDATOR Analytics v58.2-WRAITH — Mock API Server
 * Port: 9080 (HR-10)
 * Usage: node mock-api-server.mjs
 */

import http from 'http';

const PORT = 9080;

// ─── Стан Системи (Dynamic State) ───────────────────────────────────────────

let systemState = {
  infra: {
    nodes: [
      { id: '1', node: 'nvidia-master', role: 'GPU Master',   cpu: 45, ram: 62, vram: 55, vramGb: 4.4, temp: 68, net: '↑ 1.4 MB/s ↓ 5.2 MB/s', status: 'online',   uptime: '12д 4г 21хв' },
      { id: '2', node: 'macbook-edge',  role: 'Edge Node',    cpu: 22, ram: 48, temp: 54,               net: '↑ 0.4 MB/s ↓ 1.1 MB/s', status: 'online',   uptime: '3г 14хв' },
      { id: '3', node: 'colab-mirror',  role: 'Cloud Mirror', cpu: 0,  ram: 0,                          net: '—',                       status: 'offline',  uptime: 'недоступний' },
    ],
    services: [
      { name: 'core-api',         status: 'ok',   latencyMs: 12,  version: 'v1.4.2', lastCheck: 'зараз' },
      { name: 'graph-service',    status: 'ok',   latencyMs: 28,  version: 'v1.2.0', lastCheck: 'зараз' },
      { name: 'ingestion-worker', status: 'warn', latencyMs: 341, version: 'v1.1.5', lastCheck: 'зараз' },
      { name: 'ollama',           status: 'ok',   latencyMs: 890, version: '0.1.42', lastCheck: 'зараз' },
    ]
  },
  failover: {
    activeMode: 'SOVEREIGN',
    activeNode: 'local-k3s',
    nodes: {
      'local-k3s':     { label: 'Local K3s',     ip: '192.168.1.10', status: 'online',  load: 34 },
      'nvidia-server': { label: 'NVIDIA Server', ip: '10.0.0.5',     status: 'online',  load: 61 },
      'colab-mirror':  { label: 'Colab Mirror',  ip: 'zrok-tunnel',  status: 'offline', load: 0  },
    },
    history: Array.from({ length: 42 }, (_, i) => ({
      id: String(i + 1),
      ts: new Date(Date.now() - i * 3_600_000).toISOString(),
      from: ['local-k3s', 'nvidia-server', 'colab-mirror'][i % 3],
      to:   ['nvidia-server', 'colab-mirror', 'local-k3s'][i % 3],
      reason: ['VRAM >90%', 'Плановий тест', 'Мережева помилка', 'Ручне перемикання', 'Failover тригер'][i % 5],
      user:   i % 4 === 0 ? 'auto-sentinel' : 'admin@predator',
      duration: `${(i * 7 + 1) % 120}с`,
    }))
  },
  agents: {
    stats: {
      total: 64,
      alive: 58,
      dead: 2,
      idle: 4,
      avgCpu: 32
    },
    list: Array.from({ length: 64 }, (_, i) => ({
      id: `agent-${String(i + 1).padStart(3, '0')}`,
      name: `${['Ingestion', 'Analyze', 'Crawler', 'Scorer'][i % 4]}-${String(i + 1).padStart(3, '0')}`,
      type: ['Ingestion', 'Analyze', 'Crawler', 'Scorer'][i % 4],
      status: ['alive', 'alive', 'idle', 'dead'][i % 4],
      cpu: Math.floor(Math.random() * 50),
      ram: Math.floor(Math.random() * 40),
      queueDepth: Math.floor(Math.random() * 10),
      successRate: 99.5,
      tasksTotal: 1200 + i,
      lastActivity: 'зараз',
      model: 'qwen3-coder:30b'
    }))
  },
  gitops: {
    argoApps: [
      { name: 'core-api',          namespace: 'predator',  syncStatus: 'Synced',    healthStatus: 'Healthy',     revision: 'a1b2c3d', lastSync: '2 хв тому' },
      { name: 'graph-service',     namespace: 'predator',  syncStatus: 'Synced',    healthStatus: 'Healthy',     revision: 'd4e5f6g', lastSync: '2 хв тому' },
      { name: 'ingestion-worker',  namespace: 'predator',  syncStatus: 'OutOfSync', healthStatus: 'Degraded',    revision: 'h7i8j9k', lastSync: '15 хв тому' },
    ],
    ciRuns: Array.from({ length: 15 }, (_, i) => ({
      id: `run-${1000 + i}`,
      branch: 'main',
      commit: 'a1b2c3d',
      status: i === 0 ? 'running' : 'success',
      duration: '45с',
      trigger: 'push',
      ts: new Date().toISOString()
    })),
    etlPipelines: [
      { id: '1', name: 'customs-xml-ingest', source: 'minio/customs', status: 'running', recordsIn: 1200, recordsOut: 1100, lag: 100, lastRun: 'зараз' }
    ]
  },
  dataops: {
    kafkaTopics: [
      { name: 'customs.raw.xml',       partitions: 8,  lag: 1204, throughput: '2.4 MB/s',  consumers: 3, status: 'warn' },
      { name: 'entities.enriched',     partitions: 4,  lag: 0,    throughput: '0.8 MB/s',  consumers: 2, status: 'ok' },
      { name: 'sanctions.feed',        partitions: 2,  lag: 0,    throughput: '0.1 MB/s',  consumers: 1, status: 'ok' },
      { name: 'graph.relationships',   partitions: 6,  lag: 0,    throughput: '1.1 MB/s',  consumers: 2, status: 'ok' },
    ],
    datasets: [
      { id: '1', name: 'customs-ner-v4', type: 'NER', records: 1240000, sizeGb: 4.2, version: '4.0.1', status: 'ready', updatedAt: '2026-04-18' }
    ],
    factoryModules: [
      { id: '1', name: 'customs-etl-adapter', template: 'ETL::XmlIngestion', status: 'deployed', createdBy: 'admin', createdAt: '2026-04-15' }
    ]
  },
  security: {
    recentEvents: [
      { id: 'log-1', ts: new Date().toISOString(), user: 'admin@predator', method: 'GET', endpoint: '/api/v2/admin/telemetry', status: 200, latencyMs: 15, ip: '127.0.0.1' },
      { id: 'log-2', ts: new Date().toISOString(), user: 'analyst.dmytro@corp', method: 'POST', endpoint: '/api/v1/decisions', status: 201, latencyMs: 85, ip: '192.168.1.15' },
    ],
    sessions: Array.from({ length: 12 }, (_, i) => ({
      id:           `sess-${i + 1}`,
      user:         ['admin@predator', 'analyst.dmytro@corp', 'viewer.test@corp', 'analyst.olena@corp'][i % 4],
      role:         ['admin', 'client_premium', 'client_basic', 'client_premium'][i % 4],
      ip:           `10.0.${Math.floor(i / 4)}.${(i % 4) * 10 + 1}`,
      userAgent:    ['Chrome/124 macOS', 'Firefox/125 Ubuntu', 'Chrome/124 Win10'][i % 3],
      lastActivity: `${i * 2 + 1}хв тому`,
      createdAt:    new Date(Date.now() - i * 1_800_000).toISOString(),
      expiresIn:    `${60 - i * 2}хв`,
    })),
    keys: [
      { id: '1', name: 'ingestion-service',   owner: 'system',             scopes: 'read:customs,write:kafka',  lastUsed: '1хв тому',   expiresAt: '2026-12-31', status: 'active' },
      { id: '2', name: 'graph-service-key',   owner: 'system',             scopes: 'read:neo4j,write:neo4j',    lastUsed: '2хв тому',   expiresAt: '2026-12-31', status: 'active' },
      { id: '3', name: 'external-partner-01', owner: 'partner@abc.com',    scopes: 'read:entities',             lastUsed: '3д тому',    expiresAt: '2025-06-30', status: 'expired' },
      { id: '4', name: 'revoked-test',      owner: 'old-service',        scopes: 'write:*',                   lastUsed: '30д тому',   expiresAt: 'n/a',        status: 'revoked' },
    ]
  },
  system: {
    status: {
      status: 'ok',
      healthy: true,
      overall_status: 'HEALTHY',
      version: 'v56.5-ELITE',
      environment: 'production',
      uptime: '12d 4h 21m',
      last_sync: new Date().toISOString(),
      services: [
        { name: 'API Gateway', status: 'ok', label: 'API', latency_ms: 12 },
        { name: 'Kafka Cluster', status: 'ok', label: 'KAFKA', latency_ms: 5 },
        { name: 'Neo4j DB', status: 'ok', label: 'NEO4J', latency_ms: 24 },
        { name: 'Redis Cache', status: 'ok', label: 'REDIS', latency_ms: 2 },
        { name: 'Ollama Node', status: 'ok', label: 'OLLAMA', latency_ms: 890 },
      ],
      summary: { total: 5, healthy: 5, degraded: 0, failed: 0 },
      metrics: { api_qps: 124, active_users: 12 },
      timestamp: new Date().toISOString(),
    },
    engines: [
      { id: 'qwen3-coder', status: 'optimal', score: 98, throughput: 1240, latency: 450, load: 32, trend: 'stable', tone: 'emerald' },
      { id: 'nemotron-30b', status: 'optimal', score: 94, throughput: 850, latency: 1200, load: 55, trend: 'improving', tone: 'emerald' },
      { id: 'vision-mini', status: 'calibrating', score: 88, throughput: 120, latency: 2400, load: 12, trend: 'testing', tone: 'amber' },
      { id: 'search-rag', status: 'optimal', score: 91, throughput: 3400, latency: 120, load: 18, trend: 'stable', tone: 'emerald' },
    ],
    logs: [
      { id: 'l1', level: 'info', service: 'core-api', message: 'Систему моніторингу активовано', timestamp: new Date().toISOString() },
      { id: 'l2', level: 'warn', service: 'ingestion', message: 'Виявлено затримку в Kafka topic: customs.raw', timestamp: new Date().toISOString() },
      { id: 'l3', level: 'info', service: 'ai-engine', message: 'Модель Qwen3-Coder завантажена у VRAM', timestamp: new Date().toISOString() },
    ]
  }
};

// ─── Допоміжні функції ───────────────────────────────────────────────────────

const sendJSON = (res, data, status = 200) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
};

// ─── Обробка маршрутів ────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // 1. Телеметрія
  if (path === '/api/v2/admin/telemetry' && req.method === 'GET') {
    // Симуляція зміни метрик
    systemState.infra.nodes.forEach(n => {
      if (n.status === 'online') {
        n.cpu = Math.max(5, Math.min(95, n.cpu + (Math.random() * 10 - 5)));
        n.ram = Math.max(10, Math.min(90, n.ram + (Math.random() * 4 - 2)));
      }
    });
    return sendJSON(res, systemState.infra);
  }

  // 2. Failover
  if (path === '/api/v2/admin/failover' && req.method === 'GET') {
    return sendJSON(res, systemState.failover);
  }

  if (path === '/api/v2/admin/failover/toggle' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const oldNode = systemState.failover.activeNode;
      systemState.failover.activeNode = data.node;
      systemState.failover.history.unshift({
        id: Date.now().toString(),
        ts: new Date().toISOString(),
        from: oldNode,
        to: data.node,
        reason: 'Manual Trigger',
        user: 'admin@predator',
        duration: '2.5s'
      });
      sendJSON(res, { success: true, activeNode: data.node });
    });
    return;
  }

  // 3. Agents
  if (path === '/api/v2/admin/agents' && req.method === 'GET') {
    return sendJSON(res, systemState.agents);
  }

  // 4. GitOps
  if (path === '/api/v2/admin/gitops' && req.method === 'GET') {
    return sendJSON(res, systemState.gitops);
  }

  // 5. DataOps
  if (path === '/api/v2/admin/dataops' && req.method === 'GET') {
    return sendJSON(res, systemState.dataops);
  }

  // 6. Security Audit
  if (path === '/api/v2/admin/security/audit' && req.method === 'GET') {
    return sendJSON(res, systemState.security.recentEvents);
  }
  if (path === '/api/v2/admin/security/sessions' && req.method === 'GET') {
    return sendJSON(res, systemState.security.sessions);
  }
  if (path === '/api/v2/admin/security/keys' && req.method === 'GET') {
    return sendJSON(res, systemState.security.keys);
  }

  // 7. System (V1)
  if (path === '/api/v1/system/status' && req.method === 'GET') {
    systemState.system.status.timestamp = new Date().toISOString();
    return sendJSON(res, systemState.system.status);
  }

  if (path === '/api/v1/system/stats' && req.method === 'GET') {
    const memoryTotal = 32768; // 32GB
    const vramTotal = 8192;   // 8GB
    return sendJSON(res, {
      cpu_percent: 15 + Math.random() * 20,
      memory_percent: 45 + Math.random() * 5,
      memory_total: memoryTotal,
      memory_used: memoryTotal * 0.45,
      gpu_available: true,
      gpu_name: 'NVIDIA RTX 4090 (Mock)',
      gpu_temp: 65 + Math.random() * 5,
      gpu_utilization: 30 + Math.random() * 10,
      gpu_mem_total: vramTotal,
      gpu_mem_used: 4200 + Math.random() * 500,
      uptime_seconds: 1044000,
      timestamp: new Date().toISOString()
    });
  }

  if (path === '/api/v1/system/engines' && req.method === 'GET') {
    return sendJSON(res, systemState.system.engines);
  }

  if (path === '/api/v1/system/logs/stream' && req.method === 'GET') {
    return sendJSON(res, { logs: systemState.system.logs });
  }

  // 404
  sendJSON(res, { error: 'Not Found', path }, 404);
});

server.listen(PORT, () => {
  console.log(`🦅 PREDATOR Mock API Server running at http://localhost:${PORT}`);
});
