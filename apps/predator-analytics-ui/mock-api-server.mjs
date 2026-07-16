// mock-api-server.mjs — Повний Mock API для PREDATOR Analytics
// Обслуговує всі ендпоінти, включаючи SSE стріми телеметрії та подій
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
const app = express();
app.use(express.json());
app.use('/api/v1/ai/stt', express.raw({ type: ['audio/webm', 'audio/wav', 'audio/ogg', 'application/octet-stream'], limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ==========================================
// HEALTH & SYSTEM
// ==========================================
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v66.0-ELITE',
    uptime: Math.floor(process.uptime()),
    services: {
      postgres: 'connected',
      qdrant: 'connected',
      opensearch: 'connected',
      redis: 'connected',
      redpanda: 'connected',
      minio: 'connected',
    },
  });
});

app.get('/api/v1/health/ready', (req, res) => {
  res.json({ status: 'ready', checks: { db: true, cache: true, search: true } });
});

app.get('/api/v1/health/live', (req, res) => {
  res.json({ status: 'live' });
});

// ==========================================
// TELEMETRY SSE STREAM
// ==========================================
app.get('/api/v1/telemetry/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');

  const sendTelemetry = () => {
    const data = {
      cpu_percent: +(15 + Math.random() * 35).toFixed(1),
      ram_percent: +(45 + Math.random() * 25).toFixed(1),
      disk_percent: 42.3,
      gpus: [
        {
          name: 'NVIDIA RTX 4090',
          utilization: +(10 + Math.random() * 40).toFixed(1),
          memory_used: +(4 + Math.random() * 4).toFixed(1),
          memory_total: 24.0,
          temperature: +(45 + Math.random() * 15).toFixed(0),
        },
      ],
      active_workers: Math.floor(8 + Math.random() * 4),
      total_processed: Math.floor(100000 + Math.random() * 50000),
    };
    res.write(`event: telemetry\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendTelemetry();
  const interval = setInterval(sendTelemetry, 3000);

  req.on('close', () => clearInterval(interval));
});

// ==========================================
// EVENTS SSE STREAM
// ==========================================
app.get('/api/v1/events/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');

  const events = [
    { type: 'ingestion', event: 'Завантажено 1,245 митних декларацій', severity: 'info' },
    { type: 'risk', event: 'Виявлено аномалію: маршрут через порт Одеса', severity: 'warning' },
    { type: 'graph', event: 'Оновлено зв\'язки для 38 сутностей', severity: 'info' },
    { type: 'ai', event: 'AI Copilot згенерував інсайт: офшорний зв\'язок', severity: 'success' },
    { type: 'system', event: 'ETL Pipeline завершено успішно', severity: 'info' },
    { type: 'risk', event: 'Risk Engine: нова оцінка для ТОВ "Транс-Логістик"', severity: 'warning' },
  ];
  let idx = 0;

  const sendEvent = () => {
    const ev = events[idx % events.length];
    const payload = { ...ev, timestamp: new Date().toISOString() };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    idx++;
  };

  sendEvent();
  const interval = setInterval(sendEvent, 5000);

  req.on('close', () => clearInterval(interval));
});

// ==========================================
// GRAPH
// ==========================================
app.get('/api/v1/graph/summary', (req, res) => {
  res.json({
    nodes: [
      { id: 'TARGET-01', type: 'PERSON',      riskScore: 90,  label: 'Віктор О.',               connections: 5 },
      { id: 'SHELL-99',  type: 'COMPANY',     riskScore: 85,  label: 'Offshore Holdings Ltd',   connections: 8 },
      { id: 'CYPRUS',    type: 'CLUSTER',     riskScore: 50,  label: 'Кіпр (офшор)',            connections: 6 },
      { id: 'BANK-01',   type: 'COMPANY',     riskScore: 20,  label: 'Global Bank',              connections: 4 },
      { id: 'DOC-123',   type: 'DOCUMENT',    riskScore: 60,  label: 'Транзакція 590M UAH',     connections: 2 },
      { id: 'TRANS-LOG', type: 'COMPANY',     riskScore: 78,  label: 'ТОВ "Транс-Логістик"',   connections: 7 },
      { id: 'PORT-OD',   type: 'CLUSTER',     riskScore: 45,  label: 'Порт Одеса',              connections: 3 },
      { id: 'CUSTOMS-42',type: 'DOCUMENT',    riskScore: 65,  label: 'Декларація #42-2024',     connections: 3 },
      { id: 'RISK-01',   type: 'RISK',        riskScore: 95,  label: 'Схема відмивання',        connections: 4 },
      { id: 'PERSON-02', type: 'PERSON',      riskScore: 72,  label: 'Андрій К. (директор)',   connections: 3 },
      { id: 'BVI-01',    type: 'CLUSTER',     riskScore: 88,  label: 'BVI Holdings',            connections: 5 },
      { id: 'TRANS-02',  type: 'TRANSACTION', riskScore: 70,  label: 'SWIFT $4.2M',             connections: 2 },
    ],
    links: [
      { id: 'e1', source: 'TARGET-01',  target: 'SHELL-99',   weight: 5, type: 'CONTROLS' },
      { id: 'e2', source: 'SHELL-99',   target: 'CYPRUS',     weight: 3, type: 'REGISTERED_IN' },
      { id: 'e3', source: 'SHELL-99',   target: 'BANK-01',    weight: 8, type: 'HAS_ACCOUNT' },
      { id: 'e4', source: 'DOC-123',    target: 'TARGET-01',  weight: 1, type: 'RELATED_TO' },
      { id: 'e5', source: 'TRANS-LOG',  target: 'PORT-OD',    weight: 4, type: 'OPERATES_AT' },
      { id: 'e6', source: 'TRANS-LOG',  target: 'TARGET-01',  weight: 6, type: 'OWNED_BY' },
      { id: 'e7', source: 'CUSTOMS-42', target: 'TRANS-LOG',  weight: 3, type: 'FILED_BY' },
      { id: 'e8', source: 'CUSTOMS-42', target: 'PORT-OD',    weight: 2, type: 'CLEARED_AT' },
      { id: 'e9', source: 'RISK-01',    target: 'TARGET-01',  weight: 9, type: 'IMPLICATES' },
      { id: 'e10',source: 'PERSON-02',  target: 'TRANS-LOG',  weight: 4, type: 'DIRECTOR_OF' },
      { id: 'e11',source: 'BVI-01',     target: 'SHELL-99',   weight: 7, type: 'PARENT_OF' },
      { id: 'e12',source: 'TRANS-02',   target: 'BANK-01',    weight: 5, type: 'PROCESSED_BY' },
      { id: 'e13',source: 'TARGET-01',  target: 'BVI-01',     weight: 6, type: 'BENEFICIARY' },
    ],
  });
});

app.get('/api/v1/graph/customs', (req, res) => {
  res.json({
    nodes: [
      { id: 'C-DECL-001', type: 'DOCUMENT',  label: 'Декларація UA-2024-001', riskScore: 55 },
      { id: 'C-COMP-001', type: 'COMPANY',   label: 'ТОВ "Імпорт-Трейд"',   riskScore: 70 },
      { id: 'C-PORT-001', type: 'CLUSTER',   label: 'Порт Іллічівськ',       riskScore: 30 },
      { id: 'C-GOOD-001', type: 'DOCUMENT',  label: 'Вантаж: Електроніка',   riskScore: 40 },
    ],
    edges: [
      { id: 'ce1', source: 'C-DECL-001', target: 'C-COMP-001', weight: 3 },
      { id: 'ce2', source: 'C-DECL-001', target: 'C-PORT-001', weight: 2 },
      { id: 'ce3', source: 'C-DECL-001', target: 'C-GOOD-001', weight: 4 },
    ],
    total: 4,
  });
});

// ==========================================
// OSINT ENDPOINTS
// ==========================================

// Морський OSINT
app.get('/api/v1/maritime/vessels', (req, res) => {
  res.json({
    vessels: [
      { id: 'v1', name: 'ODESSA STAR', imo: '9876543', flag: 'Panama', risk_score: 88, lat: 46.49, lon: 30.73, status: 'AIS_OFF', last_port: 'Одеса', destination: 'Limassol', cargo_type: 'General' },
      { id: 'v2', name: 'BLACK SEA TRADER', imo: '1234567', flag: 'Marshall Islands', risk_score: 72, lat: 45.98, lon: 31.10, status: 'UNDERWAY', last_port: 'Маріуполь', destination: 'Стамбул', cargo_type: 'Bulk' },
      { id: 'v3', name: 'EURO CARGO', imo: '', flag: 'Unknown', risk_score: 95, lat: 46.20, lon: 29.85, status: 'PHANTOM', last_port: 'Невідомо', destination: 'Невідомо', cargo_type: 'Невідомо' },
      { id: 'v4', name: 'UKRAINE EXPRESS', imo: '7654321', flag: 'Ukraine', risk_score: 15, lat: 46.60, lon: 30.90, status: 'UNDERWAY', last_port: 'Херсон', destination: 'Констанца', cargo_type: 'Container' },
    ],
    total: 4,
    high_risk_count: 2,
  });
});

app.get('/api/v1/maritime/ports', (req, res) => {
  res.json({
    ports: [
      { id: 'port-1', name: 'Одеса',       country: 'UA', risk_level: 'medium', throughput_tons: 25000000 },
      { id: 'port-2', name: 'Іллічівськ',  country: 'UA', risk_level: 'high',   throughput_tons: 18000000 },
      { id: 'port-3', name: 'Миколаїв',    country: 'UA', risk_level: 'low',    throughput_tons: 12000000 },
      { id: 'port-4', name: 'Limassol',    country: 'CY', risk_level: 'high',   throughput_tons: 9000000 },
    ],
  });
});

// Реєстри (ОСІНТ)
app.get('/api/v1/registries/companies', (req, res) => {
  const q = req.query.q || '';
  res.json({
    results: [
      { edrpou: '12345678', name: 'ТОВ "Транс-Логістик"', status: 'active', director: 'Іванов І.І.', capital: 500000, risk_score: 78, founders: ['Offshore Holdings Ltd'] },
      { edrpou: '87654321', name: 'ТОВ "Імпорт-Трейд"', status: 'active', director: 'Петренко В.С.', capital: 100000, risk_score: 55, founders: ['Фізична особа'] },
      { edrpou: '11223344', name: 'ПП "Карго Сервіс"', status: 'liquidating', director: 'Сидоренко А.П.', capital: 50000, risk_score: 82, founders: ['BVI Holdings Ltd'] },
    ],
    total: 3,
    query: q,
  });
});

app.get('/api/v1/registries/persons', (req, res) => {
  res.json({
    results: [
      { id: 'p1', full_name: 'Віктор О.',       dob: '1975-03-15', risk_score: 90, sanctions: true,  pep: true,  companies: ['SHELL-99', 'TRANS-LOG'] },
      { id: 'p2', full_name: 'Андрій К.',        dob: '1981-07-22', risk_score: 72, sanctions: false, pep: false, companies: ['TRANS-LOG'] },
      { id: 'p3', full_name: 'Олена С.',         dob: '1990-11-08', risk_score: 30, sanctions: false, pep: true,  companies: ['BANK-01'] },
    ],
    total: 3,
  });
});

// Тендери (Prozorro OSINT)
app.get('/api/v1/tenders', (req, res) => {
  res.json({
    tenders: [
      { id: 'UA-2024-T001', title: 'Постачання пального для держпідприємств', amount: 15000000, winner: 'ТОВ "Транс-Логістик"', status: 'complete', risk_score: 78, date: '2024-03-15' },
      { id: 'UA-2024-T002', title: 'Закупівля медичних товарів',              amount: 8500000,  winner: 'ТОВ "Медімпорт"',         status: 'active',   risk_score: 45, date: '2024-04-01' },
      { id: 'UA-2024-T003', title: 'Будівельні роботи на об\'єкті А',         amount: 32000000, winner: 'ТОВ "Будстрой-2000"',      status: 'complete', risk_score: 65, date: '2024-01-20' },
    ],
    total: 3,
    high_risk_count: 1,
  });
});

// Data.gov / Відкриті дані
app.get('/api/v1/datagov/datasets', (req, res) => {
  res.json({
    datasets: [
      { id: 'ds-1', name: 'Митні декларації 2024 Q1', records: 456789, last_updated: '2024-04-01', status: 'indexed' },
      { id: 'ds-2', name: 'Реєстр санкцій РНБО',     records: 1823,   last_updated: '2024-04-10', status: 'indexed' },
      { id: 'ds-3', name: 'ПЕП-реєстр України',       records: 24891,  last_updated: '2024-03-28', status: 'indexed' },
      { id: 'ds-4', name: 'Дані Prozorro 2024',        records: 891234, last_updated: '2024-04-12', status: 'indexed' },
    ],
    total: 4,
  });
});

// Пошук по ОСІНТ
app.get('/api/v1/osint/search', (req, res) => {
  const q = req.query.q || '';
  res.json({
    results: [
      { id: 'r1', type: 'company', label: 'ТОВ "Транс-Логістик"',  risk_score: 78, source: 'EDR', matched_field: 'name' },
      { id: 'r2', type: 'person',  label: 'Віктор О. (CEO)',        risk_score: 90, source: 'NACP', matched_field: 'name' },
      { id: 'r3', type: 'vessel',  label: 'ODESSA STAR',            risk_score: 88, source: 'MarineTraffic', matched_field: 'name' },
      { id: 'r4', type: 'tender',  label: 'UA-2024-T001 (Пальне)', risk_score: 78, source: 'Prozorro', matched_field: 'winner' },
    ],
    total: 4,
    query: q,
  });
});

// Admin OSINT (для OsintCenter)
app.get('/api/v2/admin/osint/sources', (req, res) => {
  res.json({
    sources: [
      { id: 's1', name: 'Єдиний держреєстр (EDR)',   type: 'white', status: 'active',   last_sync: '2024-04-12T10:00:00Z', records: 2891234 },
      { id: 's2', name: 'MarineTraffic AIS',          type: 'white', status: 'active',   last_sync: '2024-04-12T11:30:00Z', records: 456789 },
      { id: 's3', name: 'Prozorro OpenData',          type: 'white', status: 'active',   last_sync: '2024-04-12T09:00:00Z', records: 1234567 },
      { id: 's4', name: 'NACP (декларації)',          type: 'white', status: 'active',   last_sync: '2024-04-11T22:00:00Z', records: 89012 },
      { id: 's5', name: 'Офшорні реєстри (Darknet)', type: 'dark',  status: 'warning',  last_sync: '2024-04-10T05:00:00Z', records: 12345 },
      { id: 's6', name: 'Telegram-канали (OSINT)',    type: 'dark',  status: 'active',   last_sync: '2024-04-12T08:00:00Z', records: 5678 },
    ],
  });
});

app.get('/api/v2/admin/osint/quarantine', (req, res) => {
  res.json({
    items: [
      { id: 'q1', source: 'Darknet Registries', content: 'Shell company data BVI-01', reason: 'Unverified source', created_at: '2024-04-11T14:00:00Z' },
      { id: 'q2', source: 'Telegram OSINT',     content: 'Vessel location spoofing EURO CARGO', reason: 'Suspicious data pattern', created_at: '2024-04-12T08:00:00Z' },
    ],
    total: 2,
  });
});

app.get('/api/v2/admin/osint/policies', (req, res) => {
  res.json({
    policies: [
      { id: 'pol-1', domain: 'customs', white_osint: true,  dark_osint: false, description: 'Стандарт митної аналітики' },
      { id: 'pol-2', domain: 'maritime', white_osint: true, dark_osint: true,  description: 'Морська розвідка (дозволений Dark OSINT)' },
      { id: 'pol-3', domain: 'finance',  white_osint: true, dark_osint: false,  description: 'Фінансова аналітика' },
    ],
  });
});

// DB Admin endpoints
app.get('/api/v1/db-admin/health', (req, res) => {
  res.json({
    databases: {
      postgresql: { status: 'healthy', latency_ms: 2,  connections: 12, version: '16.2' },
      clickhouse:  { status: 'healthy', latency_ms: 5,  connections: 4,  version: '24.1' },
      opensearch:  { status: 'healthy', latency_ms: 8,  connections: 6,  version: '2.12' },
      qdrant:      { status: 'healthy', latency_ms: 3,  connections: 2,  version: '1.8.0' },
      neo4j:       { status: 'healthy', latency_ms: 12, connections: 3,  version: '5.17' },
      redis:       { status: 'healthy', latency_ms: 1,  connections: 20, version: '7.2' },
      minio:       { status: 'healthy', latency_ms: 15, connections: 5,  version: 'RELEASE.2024' },
    },
    overall_status: 'healthy',
  });
});

app.get('/api/v1/db-admin/contract', (req, res) => {
  res.json({
    contract: [
      { db: 'PostgreSQL', role: 'SSOT', description: 'Хранитель Істини — метадані, транзакції, юзери' },
      { db: 'ClickHouse',  role: 'OLAP', description: 'Аналітичний Мозок — агрегації, 100M+ записів' },
      { db: 'OpenSearch',  role: 'Search', description: 'Текстова Розвідка — full-text по документах' },
      { db: 'Qdrant',      role: 'Vector', description: 'AI Пам\'ять — ембедінги для RAG' },
      { db: 'Neo4j',       role: 'Graph', description: 'Детектор Зв\'язків — схеми власності, фрод' },
      { db: 'Redis',       role: 'Cache', description: 'Швидка Пам\'ять — сесії, черги' },
      { db: 'MinIO',       role: 'Storage', description: 'Фізичне Сховище — PDF, скани, файли' },
    ],
  });
});

app.get('/api/v1/db-admin/router/stats', (req, res) => {
  res.json({
    routed_queries: { postgresql: 1245, clickhouse: 8923, opensearch: 456, qdrant: 123, neo4j: 234 },
    cache_hit_rate: 0.82,
    total_queries_24h: 11981,
  });
});

app.post('/api/v1/db-admin/router/classify', (req, res) => {
  res.json({ query: req.body?.query || '', recommended_db: 'clickhouse', reason: 'Analytical aggregation detected', confidence: 0.94 });
});

// Stats
app.get('/api/v1/stats/search', (req, res) => {
  res.json({
    total_queries: 15678,
    daily_queries: [120, 98, 145, 202, 187, 234, 210],
    top_queries: ['ТОВ Транс', 'Offshore', 'Panama', 'кіпр', 'SWIFT'],
    avg_response_ms: 145,
  });
});



// ==========================================
// DEEPSEEK TUNING (MOCK)
// ==========================================
let mockTuningStatus = {
  status: "Не знайдено активних чи завершених завдань донавчання."
};

app.post('/api/v1/deepseek_tuning/start_pipeline', (req, res) => {
  mockTuningStatus = {
    cycle: 1,
    max_cycles: 5,
    status: "IN_PROGRESS",
    job: { run_id: "mock_ft_123", status: "training" },
    dataset_metrics: { count: 500, quality_score: 95 },
    eval_metrics: { f1_score: 0.88, hallucination_rate: 0.015 },
    decision: { decision: "pending", reason: "Training in progress" }
  };
  
  // Simulate progress after 10 seconds
  setTimeout(() => {
    mockTuningStatus = {
      cycle: 1,
      max_cycles: 5,
      status: "COMPLETED",
      job: { run_id: "mock_ft_123", status: "training_completed" },
      dataset_metrics: { count: 500, quality_score: 95 },
      eval_metrics: { f1_score: 0.92, hallucination_rate: 0.01 },
      decision: { decision: "deploy", reason: "Нова модель перевершила базову" }
    };
  }, 10000);

  res.json({ message: "Пайплайн автоматичного донавчання DeepSeek запущено (MOCK)" });
});

app.get('/api/v1/deepseek_tuning/status', (req, res) => {
  res.json(mockTuningStatus);
});

// ==========================================
// AGENTS / AI
// ==========================================
app.get('/api/v1/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'risk-engine', name: 'Risk Engine v56.5', status: 'active', uptime: '72h', tasks_completed: 1423 },
      { id: 'insight-engine', name: 'Insight Engine', status: 'active', uptime: '72h', tasks_completed: 891 },
      { id: 'graph-analyzer', name: 'Graph Analyzer', status: 'idle', uptime: '72h', tasks_completed: 345 },
      { id: 'document-parser', name: 'Document Parser', status: 'active', uptime: '48h', tasks_completed: 2103 },
    ],
  });
});

// ==========================================
// MONITORING & STATS
// ==========================================
app.get('/api/v1/monitoring/live-health', (req, res) => {
  res.json({
    kpi: [
      { label: 'Всього Декларацій', value: '124,567', trend: '+12%' },
      { label: 'Виявлено Ризиків', value: '3,891', trend: '+8%' },
      { label: 'Активні Агенти', value: '12', trend: '0%' },
      { label: 'Час Відповіді API', value: '45ms', trend: '-15%' },
    ],
    services: {
      postgres: { status: 'healthy', latency_ms: 2 },
      qdrant: { status: 'healthy', latency_ms: 5 },
      opensearch: { status: 'healthy', latency_ms: 8 },
      redis: { status: 'healthy', latency_ms: 1 },
      redpanda: { status: 'healthy', latency_ms: 3 },
    },
  });
});

// ==========================================
// EXPLAIN (AI Copilot)
// ==========================================
app.post('/api/v1/explain', (req, res) => {
  res.json({
    explanation: 'Ця сутність має високий ризик через зв\'язки з офшорними юрисдикціями (Кіпр, BVI).',
    confidence: 0.94,
    chain: ['Зв\'язок з TARGET-01', 'Реєстрація на Кіпрі', 'Транзакції через BANK-01'],
  });
});

app.post('/api/v1/copilot/chat', async (req, res) => {
  const { message } = req.body;
  
  // Список фолбек-відповідей українською
  const fallbackReplies = [
    `Ви запитали: "${message || ''}". На жаль, нейронна мережа тимчасово недоступна. Спробуйте пізніше або скористайтесь пошуком.`,
    `Ваш запит "${message || ''}" прийнято. Зараз AI-модуль перебуває в режимі обслуговування. Система PREDATOR продовжує працювати в автономному режимі.`,
    `Дякую за запит. Аналітична система обробляє ваше повідомлення. Для термінових запитів використовуйте глобальний пошук (Cmd+K).`,
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const ollamaResponse = await fetch('http://194.177.1.240:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        messages: [
          { role: 'system', content: 'Ти розумний та корисний AI-асистент (PREDATOR Analytics). Відповідай українською мовою. Будь лаконічним.' },
          { role: 'user', content: message }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    
    const data = await ollamaResponse.json();
    let reply = data.message?.content || 'Помилка генерації';
    
    res.json({
      message_id: `msg-${Date.now()}`,
      reply: reply,
      sources: [],
      tokens_used: data.eval_count || 0
    });
  } catch (error) {
    console.warn(`[Copilot] ⚠️ Ollama недоступна, використовую фолбек: ${error.message}`);
    const reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    res.json({
      message_id: `msg-${Date.now()}`,
      reply: reply,
      sources: [],
      tokens_used: 0
    });
  }
});

// ==========================================
// VOICE & AI TTS/STT
// ==========================================
app.post('/api/v1/voice/transcribe', (req, res) => {
  res.json({ text: "Привіт, як я можу допомогти вам з аналітикою?" });
});

const dummyWav = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 
  0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 
  0x40, 0x1f, 0x00, 0x00, 0x40, 0x1f, 0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 
  0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
]);

app.post('/api/v1/voice/synthesize', (req, res) => {
  res.setHeader('Content-Type', 'audio/wav');
  res.send(dummyWav);
});

app.post('/api/v1/ai/stt', async (req, res) => {
  try {
    const audioBuffer = req.body;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: "No audio data provided" });
    }
    
    const tempFilePath = path.join(os.tmpdir(), `stt_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    console.log(`[STT] Processing audio file: ${tempFilePath} (${audioBuffer.length} bytes)`);
    exec(`python3 /Users/Shared/Predator_60/scripts/stt_server.py "${tempFilePath}"`, (error, stdout, stderr) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (error) {
        console.error(`[STT] ❌ Error: ${stderr || error.message}`);
        return res.status(500).json({ error: "STT Engine failed" });
      }
      try {
        const result = JSON.parse(stdout);
        console.log(`[STT] ✅ Success: "${result.text}"`);
        res.json(result);
      } catch (e) {
        console.error(`[STT] JSON Parse error: ${e.message}`);
        res.status(500).json({ error: "Invalid STT response" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/ai/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    console.log(`[TTS] 🎙️ Processing request: "${text.substring(0, 50)}..."`);
    
    const safeText = text.replace(/["'`]/g, '');
    exec(`python3 /Users/Shared/Predator_60/scripts/tts_server.py "${safeText}"`, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[TTS] ❌ Error: ${stderr || error.message}`);
        return res.status(500).json({ error: "TTS Engine failed" });
      }
      res.set('Content-Type', 'audio/wav');
      res.send(stdout);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INGESTION
// ==========================================
app.post('/api/v1/ingestion/upload', (req, res) => {
  const jobId = `job-${Date.now()}`;
  res.json({ job_id: jobId, status: 'queued', message: 'Файл прийнято до обробки' });
});

app.get('/api/v1/ingestion/stream/:jobId', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    if (progress >= 100) {
      res.write(`data: ${JSON.stringify({ progress: 100, status: 'completed', message: 'Обробку завершено' })}\n\n`);
      clearInterval(interval);
      res.end();
    } else {
      res.write(`data: ${JSON.stringify({ progress, status: 'processing', message: `Обробка: ${progress}%` })}\n\n`);
    }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

// ==========================================
// SEARCH
// ==========================================
app.get('/api/v1/search', (req, res) => {
  const q = req.query.q || '';
  res.json({
    results: [
      { id: 'TRANS-LOG', type: 'company', label: 'ТОВ "Транс-Логістик"', score: 0.95 },
      { id: 'TARGET-01', type: 'person', label: 'Віктор О.', score: 0.87 },
    ],
    total: 2,
    query: q,
  });
});

// ==========================================
// RISK
// ==========================================
app.get('/api/v1/risk/score', (req, res) => {
  res.json({ entity_id: req.query.entity_id || 'unknown', risk_score: 78, factors: ['offshore_links', 'high_volume', 'anomalous_route'] });
});

// ==========================================
// CATCH-ALL для невідомих API маршрутів
// ==========================================
app.use('/api', (req, res) => {
  res.json({ message: 'Mock response', path: req.path, method: req.method, mock: true });
});

// Експорт для вбудовування в Vite middleware
export default function (req, res, next) {
  app(req, res, next);
}

// Запуск як standalone сервер на порту 9080
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = 9080;
  app.listen(PORT, () => {
    console.log(`✅ PREDATOR Mock API Server запущено на порту ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
    console.log(`   Graph:  http://localhost:${PORT}/api/v1/graph/summary`);
    console.log(`   SSE:    http://localhost:${PORT}/api/v1/telemetry/stream`);
  });
}
