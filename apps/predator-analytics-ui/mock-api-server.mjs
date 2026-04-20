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
    history: [
      { id: '1', ts: new Date().toISOString(), from: 'nvidia-server', to: 'local-k3s', reason: 'Планове перемикання', user: 'admin@predator', duration: '12с' }
    ]
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
      { id: 'log-1', ts: new Date().toISOString(), user: 'admin@predator', method: 'GET', endpoint: '/api/v2/admin/telemetry', status: 200, latencyMs: 15, ip: '127.0.0.1' }
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

  // 404
  sendJSON(res, { error: 'Not Found', path }, 404);
});

server.listen(PORT, () => {
  console.log(`🦅 PREDATOR Mock API Server running at http://localhost:${PORT}`);
});
