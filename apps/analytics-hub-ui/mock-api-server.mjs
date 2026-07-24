import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = 9080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// HEALTH
// ──────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', source: 'mock-api', version: 'v57.0-MOCK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', source: 'mock-api' });
});

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
app.post('/api/v1/auth/token', (req, res) => {
  res.json({
    access_token: 'mock-token-predator-2024',
    token_type: 'bearer',
    expires_in: 3600,
    role: 'admin',
    tenant_id: '00000000-0000-0000-0000-000000000000'
  });
});

// ──────────────────────────────────────────────
// INGESTION — upload file
// ──────────────────────────────────────────────
app.post('/api/v1/ingestion/upload', upload.single('file'), (req, res) => {
  const fileName = req.file?.originalname || req.body?.filename || 'unknown';
  const fileSize = req.file?.size || 0;
  const jobId = `mock-job-${Date.now()}`;

  console.log(`[MOCK] File upload: ${fileName} (${fileSize} bytes)`);

  res.status(202).json({
    job_id: jobId,
    status: 'queued',
    file_name: fileName,
    file_size: fileSize,
    message: `Файл ${fileName} прийнято до обробки (Mock режим)`
  });
});

// ──────────────────────────────────────────────
// INGESTION — jobs list
// ──────────────────────────────────────────────
app.get('/api/v1/ingestion/jobs', (req, res) => {
  res.json([
    {
      id: 'mock-job-001',
      status: 'completed',
      file_name: 'Лютий_2024.xlsx',
      file_size: 204800,
      created_at: new Date(Date.now() - 60000).toISOString(),
      progress: 100
    }
  ]);
});

// ──────────────────────────────────────────────
// INGESTION — progress stream (SSE)
// ──────────────────────────────────────────────
app.get('/api/v1/ingestion/progress/:jobId/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const steps = [
    { phase: 'VALIDATING', progress: 20, message: '[MOCK] Валідація структури файлу...' },
    { phase: 'ETL_PROCESSING', progress: 40, message: '[MOCK] ETL обробка та нормалізація...' },
    { phase: 'STREAMING', progress: 60, message: '[MOCK] Потокова передача до Redpanda...' },
    { phase: 'WRITING_DB', progress: 80, message: '[MOCK] Запис у PostgreSQL/ClickHouse...' },
    { phase: 'INDEXING', progress: 90, message: '[MOCK] Індексація в OpenSearch/Qdrant...' },
    { phase: 'DONE', progress: 100, message: '[MOCK] ✅ Імпорт завершено успішно!' }
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(interval);
      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }
    const step = steps[i++];
    res.write(`data: ${JSON.stringify(step)}\n\n`);
  }, 1500);

  req.on('close', () => clearInterval(interval));
});

// ──────────────────────────────────────────────
// INGESTION — source (URL/API)
// ──────────────────────────────────────────────
app.post('/api/v1/ingestion/source', (req, res) => {
  const jobId = `mock-job-src-${Date.now()}`;
  console.log(`[MOCK] Source ingestion:`, req.body);
  res.status(202).json({
    job_id: jobId,
    status: 'queued',
    message: `Джерело ${req.body?.url || 'unknown'} прийнято до обробки (Mock режим)`
  });
});

// ──────────────────────────────────────────────
// OSINT SEARCH
// ──────────────────────────────────────────────
app.get('/api/v1/osint/search', (req, res) => {
  const q = req.query.q || '';
  console.log(`[MOCK] OSINT search: "${q}"`);
  setTimeout(() => {
    res.json([
      {
        id: '3111724753',
        type: 'person',
        name: 'Кізима Дмитро Миколайович',
        code: '3111724753',
        status: 'SUSPICIOUS',
        riskScore: 85,
        description: 'Особа з високим рівнем ризику. Знайдено зв\'язки з фіктивними компаніями.'
      },
      {
        id: 'comp-mock-1',
        type: 'company',
        name: 'ТОВ АГРО-ТРАНС',
        code: '12345678',
        status: 'ACTIVE',
        riskScore: 65,
        description: 'Агропромислова компанія'
      }
    ]);
  }, 500);
});

// Legacy OSINT search
app.post('/api/osint/search', (req, res) => {
  res.json({
    id: '3111724753', type: 'person',
    name: 'Кізима Дмитро Миколайович',
    code: req.body?.query || '3111724753',
    status: 'SUSPICIOUS', riskScore: 85,
    address: 'с. Угерсько, Стрийський р-н',
    description: 'Особа з високим рівнем ризику',
    relationships: [
      { targetId: 'comp-1', targetName: 'ТОВ АГРО-ТРАНС', type: 'Засновник', risk: 'HIGH' }
    ]
  });
});

// OSINT scan
app.post('/api/v1/osint/scan/start', (req, res) => {
  res.json({ status: 'ok', job_id: 'mock-scan-123', message: 'Сканування розпочато' });
});

// ──────────────────────────────────────────────
// ADIP
// ──────────────────────────────────────────────
app.get('/adip/tasks', (req, res) => {
  res.json([]);
});

app.post('/adip/tasks', (req, res) => {
  res.json({ id: `task-${Date.now()}`, status: 'created' });
});

// ──────────────────────────────────────────────
// ETL
// ──────────────────────────────────────────────
app.get('/etl/status', (req, res) => {
  res.json({ status: 'idle', sources: [] });
});

// ──────────────────────────────────────────────
// 404 fallback
// ──────────────────────────────────────────────
app.use((req, res) => {
  console.log(`[MOCK 404] ${req.method} ${req.url}`);
  res.status(404).json({ detail: `Mock: маршрут ${req.url} не знайдено` });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦅 PREDATOR Mock API Server running on http://localhost:${PORT}`);
  console.log(`   Підтримує: /api/v1/ingestion/upload, /search, /health, /auth/token`);
});
