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
      { 
        id: 'nvidia', 
        node: 'nvidia-master', 
        role: 'МАЙСТЕР_ВУЗОЛ_GPU',   
        cpu: 45, ram: 62, vram: 55, vramGb: 4.4, temp: 68, 
        net: '↑ 1.4 МБ/с ↓ 5.2 МБ/с', 
        status: 'online',   
        uptime: '12д 4г 21хв', 
        ip: '192.168.0.199' 
      },
      { 
        id: 'macbook', 
        node: 'macbook-edge',  
        role: 'КРАЙОВИЙ_ВУЗОЛ',    
        cpu: 22, ram: 48, temp: 54,               
        net: '↑ 0.4 МБ/с ↓ 1.1 МБ/с', 
        status: 'online',   
        uptime: '3г 14хв' 
      },
      { 
        id: 'colab', 
        node: 'colab-mirror',  
        role: 'ХМАРНЕ_ДЗЕРКАЛО', 
        cpu: 12, ram: 34,                          
        net: '↑ 2.1 МБ/с ↓ 8.4 МБ/с', 
        status: 'online',  
        uptime: '4г 12хв',
        extended: {
          zrok_url: 'https://predator-mirror.share.zrok.io',
          zrok_id: '1eeje4um7yvA',
          databases: {
            postgres: 'running',
            clickhouse: 'running',
            neo4j: 'running',
            redis: 'running',
            opensearch: 'running',
            qdrant: 'running',
            minio: 'running'
          },
          last_sync: new Date().toISOString()
        }
      },
    ],
    infrastructure: {
      components: {
        postgresql: { status: 'UP', latency: '12ms', version: '16.2', role: 'SSOT' },
        clickhouse: { status: 'UP', latency: '45ms', version: '24.3', role: 'OLAP' },
        neo4j: { status: 'UP', latency: '28ms', version: '5.17', role: 'GRAPH' },
        redis: { status: 'UP', latency: '2ms', version: '7.2', role: 'CACHE' },
        opensearch: { status: 'UP', latency: '34ms', version: '2.12', role: 'SEARCH' },
        qdrant: { status: 'UP', latency: '18ms', version: '1.8', role: 'VECTOR' },
        minio: { status: 'UP', latency: '5ms', version: 'latest', role: 'S3' },
        kafka: { status: 'WARN', latency: '341ms', version: '7.6', role: 'STREAM' },
      }
    },
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
      'local-k3s':     { label: 'Локальний K3s',     ip: '192.168.1.10', status: 'online',  load: 34 },
      'nvidia-server': { label: 'Сервер NVIDIA', ip: '192.168.0.199',     status: 'online',  load: 61 },
      'colab-mirror':  { label: 'Дзеркало Colab',  ip: 'zrok-tunnel',  status: 'offline', load: 0  },
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
      name: `${['Інгестія', 'Аналіз', 'Краулер', 'Скоринг'][i % 4]}-${String(i + 1).padStart(3, '0')}`,
      type: ['Інгестія', 'Аналіз', 'Краулер', 'Скоринг'][i % 4],
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
      { name: 'core-api',          namespace: 'predator',  syncStatus: 'СИНХРОНІЗОВАНО',    healthStatus: 'ЗДОРОВИЙ',     revision: 'a1b2c3d', lastSync: '2 хв тому' },
      { name: 'graph-service',     namespace: 'predator',  syncStatus: 'СИНХРОНІЗОВАНО',    healthStatus: 'ЗДОРОВИЙ',     revision: 'd4e5f6g', lastSync: '2 хв тому' },
      { name: 'ingestion-worker',  namespace: 'predator',  syncStatus: 'НЕ_СИНХРОННО', healthStatus: 'ДЕГРАДАЦІЯ',    revision: 'h7i8j9k', lastSync: '15 хв тому' },
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
      { name: 'customs.raw.xml',       partitions: 8,  lag: 1204, throughput: '2.4 МБ/с',  consumers: 3, status: 'warn' },
      { name: 'entities.enriched',     partitions: 4,  lag: 0,    throughput: '0.8 МБ/с',  consumers: 2, status: 'ok' },
      { name: 'sanctions.feed',        partitions: 2,  lag: 0,    throughput: '0.1 МБ/с',  consumers: 1, status: 'ok' },
      { name: 'graph.relationships',   partitions: 6,  lag: 0,    throughput: '1.1 МБ/с',  consumers: 2, status: 'ok' },
    ],
    datasets: [
      { id: '1', name: 'customs-ner-v4', type: 'Розпізнавання сутностей (NER)', records: 1240000, sizeGb: 4.2, version: '4.0.1', status: 'ready', updatedAt: '2026-04-18' }
    ],
    factoryModules: [
      { id: '1', name: 'customs-etl-adapter', template: 'ETL::ПотоковаІнгестія', status: 'deployed', createdBy: 'admin', createdAt: '2026-04-15' }
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
      role:         ['адмін', 'клієнт_преміум', 'клієнт_базовий', 'клієнт_преміум'][i % 4],
      ip:           `10.0.${Math.floor(i / 4)}.${(i % 4) * 10 + 1}`,
      userAgent:    ['Chrome/124 macOS', 'Firefox/125 Ubuntu', 'Chrome/124 Win10'][i % 3],
      lastActivity: `${i * 2 + 1}хв тому`,
      createdAt:    new Date(Date.now() - i * 1_800_000).toISOString(),
      expiresIn:    `${60 - i * 2}хв`,
    })),
    keys: [
      { id: '1', name: 'сервіс-інгестії',   owner: 'система',             scopes: 'read:customs,write:kafka',  lastUsed: '1хв тому',   expiresAt: '2026-12-31', status: 'active' },
      { id: '2', name: 'ключ-графа',   owner: 'система',             scopes: 'read:neo4j,write:neo4j',    lastUsed: '2хв тому',   expiresAt: '2026-12-31', status: 'active' },
      { id: '3', name: 'зовнішній-партнер-01', owner: 'partner@abc.com',    scopes: 'read:entities',             lastUsed: '3д тому',    expiresAt: '2025-06-30', status: 'expired' },
      { id: '4', name: 'відкликаний-тест',      owner: 'old-service',        scopes: 'write:*',                   lastUsed: '30д тому',   expiresAt: 'n/a',        status: 'revoked' },
    ]
  },
  system: {
    status: {
      status: 'ok',
      healthy: true,
      overall_status: 'ЗДОРОВИЙ',
      version: 'v56.5-ELITE',
      environment: 'продакшн',
      uptime: '12д 4г 21хв',
      last_sync: new Date().toISOString(),
      services: [
        { name: 'API Шлюз', status: 'ok', label: 'API', latency_ms: 12 },
        { name: 'Кластер Kafka', status: 'ok', label: 'KAFKA', latency_ms: 5 },
        { name: 'БД Neo4j', status: 'ok', label: 'NEO4J', latency_ms: 24 },
        { name: 'Кеш Redis', status: 'ok', label: 'REDIS', latency_ms: 2 },
        { name: 'Вузол Ollama', status: 'ok', label: 'OLLAMA', latency_ms: 890 },
      ],
      summary: { total: 5, healthy: 5, degraded: 0, failed: 0 },
      metrics: { api_qps: 124, active_users: 12 },
      timestamp: new Date().toISOString(),
    },
    engines: [
      { id: 'qwen3-coder', status: 'оптимально', score: 98, throughput: 1240, latency: 450, load: 32, trend: 'стабільно', tone: 'emerald' },
      { id: 'nemotron-30b', status: 'оптимально', score: 94, throughput: 850, latency: 1200, load: 55, trend: 'покращується', tone: 'emerald' },
      { id: 'vision-mini', status: 'калібрування', score: 88, throughput: 120, latency: 2400, load: 12, trend: 'тестування', tone: 'amber' },
      { id: 'search-rag', status: 'оптимально', score: 91, throughput: 3400, latency: 120, load: 18, trend: 'стабільно', tone: 'emerald' },
    ],
    logs: [
      { id: 'l1', level: 'info', service: 'core-api', message: 'Систему моніторингу активовано', timestamp: new Date().toISOString() },
      { id: 'l2', level: 'warn', service: 'ingestion', message: 'Виявлено затримку в Kafka topic: customs.raw', timestamp: new Date().toISOString() },
      { id: 'l3', level: 'info', service: 'ai-engine', message: 'Модель Qwen3-Coder завантажена у VRAM', timestamp: new Date().toISOString() },
    ]
  },
  dashboard: {
    summary: {
      total_declarations: 4_218_932,
      total_value_usd: 12_450_000_000,
      high_risk_count: 142,
      medium_risk_count: 854,
      import_count: 2_843_102,
      export_count: 1_375_830,
      graph_nodes: 154_200,
      graph_edges: 892_100,
      search_documents: 14_205_000,
      vectors: 14_205_000,
      active_pipelines: 12,
      completed_pipelines: 4_580,
    },
    alerts: [
      { id: 'a1', type: 'risk', message: 'Аномальна активність у секторі ПММ — виявлено кругове перевезення', severity: 'critical', timestamp: new Date().toISOString(), sector: 'Паливо', company: 'ТОВ «ЕНЕРДЖИ-ГРУП»', value: 45_000_000 },
      { id: 'a2', type: 'market', message: 'Різке зростання імпорту електроніки з нових коридорів через Туреччину', severity: 'warning', timestamp: new Date().toISOString(), sector: 'Електроніка', company: 'Global Tech LLC', value: 12_000_000 },
      { id: 'a3', type: 'info', message: 'Плановий ребілд пошукового індексу завершено — +2.4M документів', severity: 'info', timestamp: new Date().toISOString(), sector: 'Система', company: 'PREDATOR AI', value: 0 },
    ],
    categories: {
      'Електроніка': { count: 1250, value: 45000000, avgRisk: 42 },
      'Енергетика': { count: 840, value: 120000000, avgRisk: 15 },
    },
    countries: {
      'Китай': { count: 4500, value: 890000000 },
      'Польща': { count: 12000, value: 540000000 },
    },
    customs_offices: {
      'Одеська': { count: 1200, value: 89000000, highRisk: 12 },
      'Київська': { count: 4500, value: 450000000, highRisk: 4 },
    }
  }
};

// ─── Допоміжні функції ───────────────────────────────────────────────────────

const sendJSON = (res, data, status = 200) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-version'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-version'
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
  if ((path === '/api/v2/admin/agents' || path === '/api/v1/agents') && req.method === 'GET') {
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

  // Health check
  if (path === '/health' || path === '/api/v1/health' || path === '/api/v45/monitoring/health') {
    return sendJSON(res, { status: 'ok', uptime: systemState.system.status.uptime });
  }

  // 7. System (V1)
  if (path === '/api/v1/system/status' && req.method === 'GET') {
    systemState.system.status.timestamp = new Date().toISOString();
    return sendJSON(res, systemState.system.status);
  }

  if (path === '/api/v1/system/stats' && req.method === 'GET') {
    const memoryTotal = 32 * 1024 * 1024 * 1024; // 32GB in bytes
    const memoryUsed = memoryTotal * (0.45 + Math.random() * 0.05);
    const vramTotal = 8192;   // 8GB
    return sendJSON(res, {
      cpu_percent: 15 + Math.random() * 20,
      memory_percent: (memoryUsed / memoryTotal) * 100,
      memory_total: memoryTotal,
      memory_used: memoryUsed,
      memory_available: memoryTotal - memoryUsed,
      disk_percent: 12 + Math.random() * 2,
      disk_total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
      disk_used: 0.24 * 1024 * 1024 * 1024 * 1024,
      disk_free: 1.76 * 1024 * 1024 * 1024 * 1024,
      gpu_available: true,
      gpu_name: 'NVIDIA RTX 4090 (Mock)',
      gpu_temp: 65 + Math.random() * 5,
      gpu_utilization: 30 + Math.random() * 10,
      gpu_mem_total: 8 * 1024 * 1024 * 1024,
      gpu_mem_used: 4.2 * 1024 * 1024 * 1024 + Math.random() * 500 * 1024 * 1024,
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

  // 8. Dashboard
  if (path === '/api/v1/dashboard/overview' && req.method === 'GET') {
    // Симуляція динамічних змін
    systemState.dashboard.summary.total_declarations += Math.floor(Math.random() * 5);
    systemState.dashboard.summary.total_value_usd += Math.floor(Math.random() * 10000);
    
    return sendJSON(res, {
      ...systemState.dashboard,
      generated_at: new Date().toISOString()
    });
  }

  if (path === '/api/v1/alerts' && req.method === 'GET') {
    return sendJSON(res, { items: systemState.dashboard.alerts });
  }

  if (path === '/api/v1/factory/stats' && req.method === 'GET') {
    return sendJSON(res, {
      active_agents: 42,
      total_tasks: 1250,
      success_rate: 98.5,
      avg_latency_ms: 120,
      vram_usage_gb: 4.2
    });
  }

  // 9. System Nodes (v58.2-WRAITH)
  if (path === '/api/v1/system/nodes' && req.method === 'GET') {
    return sendJSON(res, systemState.infra.nodes);
  }

  // 10. System Infrastructure (v58.2-WRAITH)
  if (path === '/api/v1/system/infrastructure' && req.method === 'GET') {
    return sendJSON(res, systemState.infra.infrastructure);
  }

  // 404
  sendJSON(res, { error: 'Not Found', path }, 404);
});

server.listen(PORT, () => {
  console.log(`🦅 PREDATOR Mock API Server running at http://localhost:${PORT}`);
});
