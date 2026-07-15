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
      { id: 'TARGET-01', type: 'person', riskScore: 90, label: 'Віктор О.' },
      { id: 'SHELL-99', type: 'company', riskScore: 85, label: 'Offshore Holdings Ltd' },
      { id: 'CYPRUS', type: 'country', riskScore: 50, label: 'Кіпр' },
      { id: 'BANK-01', type: 'company', riskScore: 20, label: 'Global Bank' },
      { id: 'DOC-123', type: 'document', riskScore: 10, label: 'Транзакція 590M' },
      { id: 'TRANS-LOG', type: 'company', riskScore: 78, label: 'ТОВ "Транс-Логістик"' },
      { id: 'PORT-OD', type: 'location', riskScore: 45, label: 'Порт Одеса' },
      { id: 'CUSTOMS-42', type: 'document', riskScore: 65, label: 'Декларація #42-2024' },
    ],
    edges: [
      { source: 'TARGET-01', target: 'SHELL-99', weight: 5 },
      { source: 'SHELL-99', target: 'CYPRUS', weight: 2 },
      { source: 'SHELL-99', target: 'BANK-01', weight: 8 },
      { source: 'DOC-123', target: 'TARGET-01', weight: 1 },
      { source: 'TRANS-LOG', target: 'PORT-OD', weight: 4 },
      { source: 'TRANS-LOG', target: 'TARGET-01', weight: 6 },
      { source: 'CUSTOMS-42', target: 'TRANS-LOG', weight: 3 },
      { source: 'CUSTOMS-42', target: 'PORT-OD', weight: 2 },
    ],
  });
});

app.get('/api/v1/graph/customs', (req, res) => {
  res.json({ nodes: [], edges: [], total: 0 });
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
  
  try {
    const ollamaResponse = await fetch('http://194.177.1.240:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        messages: [
          { role: 'system', content: 'Ти розумний та корисний AI-асистент (PREDATOR Analytics). Відповідай українською мовою. Будь лаконічним.' },
          { role: 'user', content: message }
        ],
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    let reply = data.message?.content || 'Помилка генерації';
    
    res.json({
      message_id: `msg-${Date.now()}`,
      reply: reply,
      sources: [],
      tokens_used: data.eval_count || 0
    });
  } catch (error) {
    console.error(`[Copilot] ❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VOICE & AI TTS/STT
// ==========================================
app.post('/api/v1/voice/transcribe', (req, res) => {
  res.json({ text: "покажи мені останні транзакції по кіпру" });
});

app.post('/api/v1/voice/synthesize', (req, res) => {
  res.setHeader('Content-Type', 'audio/webm');
  res.send(Buffer.from([]));
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
