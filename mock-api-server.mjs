/**
 * PREDATOR Analytics - Mock API Server
 * Provides realistic data for UI development and demonstration
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 9080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// System metrics
app.get('/api/v1/system/metrics', (req, res) => {
  res.json({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: {
      in: Math.random() * 1000,
      out: Math.random() * 500
    },
    timestamp: new Date().toISOString()
  });
});

// Real-time metrics
app.get('/api/v1/metrics/realtime', (req, res) => {
  res.json({
    activeUsers: Math.floor(Math.random() * 1000),
    requestsPerSecond: Math.floor(Math.random() * 500),
    avgResponseTime: Math.floor(Math.random() * 100),
    errorRate: Math.random() * 5
  });
});

// AI Agents
app.get('/api/v1/ai/agents', (req, res) => {
  res.json([
    {
      id: 'titan-1',
      name: 'TITAN Analyzer',
      status: 'active',
      tasksCompleted: Math.floor(Math.random() * 1000),
      accuracy: 0.95 + Math.random() * 0.05
    },
    {
      id: 'inquisitor-1',
      name: 'INQUISITOR Scanner',
      status: 'active',
      tasksCompleted: Math.floor(Math.random() * 800),
      accuracy: 0.92 + Math.random() * 0.08
    },
    {
      id: 'sovereign-1',
      name: 'SOVEREIGN Predictor',
      status: 'active',
      tasksCompleted: Math.floor(Math.random() * 600),
      accuracy: 0.88 + Math.random() * 0.12
    }
  ]);
});

// Monitoring logs
app.get('/api/v1/monitoring/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const logs = [];
  const levels = ['info', 'warning', 'error', 'success'];
  const messages = [
    'Декларація оброблена успішно',
    'Виявлено аномалію в митній вартості',
    'Завершено аналіз ризиків',
    'Оновлено базу даних компаній',
    'Запущено AI аналіз'
  ];

  for (let i = 0; i < limit; i++) {
    logs.push({
      id: `log-${Date.now()}-${i}`,
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });
  }

  res.json(logs);
});

// Trinity audit logs
app.get('/api/v1/trinity/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = [];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  const entities = ['Declaration', 'Company', 'User', 'Report'];

  for (let i = 0; i < limit; i++) {
    logs.push({
      id: `audit-${Date.now()}-${i}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      entity: entities[Math.floor(Math.random() * entities.length)],
      user: `user-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    });
  }

  res.json(logs);
});

// Graph search
app.get('/api/v1/graph/search', (req, res) => {
  res.json({
    nodes: [
      { id: '1', label: 'ТОВ "Альфа"', type: 'Organization' },
      { id: '2', label: 'ТОВ "Бета"', type: 'Competitor' },
      { id: '3', label: 'Іван Петренко', type: 'Person' }
    ],
    edges: [
      { from: '1', to: '2', label: 'Конкурент' },
      { from: '1', to: '3', label: 'Директор' }
    ]
  });
});

// Search declarations
app.post('/api/v1/search/declarations', (req, res) => {
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push({
      id: `decl-${Date.now()}-${i}`,
      declarationNumber: `UA${Math.floor(Math.random() * 1000000)}`,
      company: `Компанія ${i + 1}`,
      value: Math.floor(Math.random() * 1000000),
      status: ['approved', 'pending', 'rejected'][Math.floor(Math.random() * 3)],
      date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
    });
  }

  res.json({
    results,
    total: 1000,
    page: 1,
    pageSize: 10
  });
});

// Premium features
app.get('/api/v1/premium/intelligence-alerts', (req, res) => {
  res.json([
    {
      id: 'alert-1',
      severity: 'high',
      title: 'Конкурент "АльфаТрейд" збільшив імпорт на 340%',
      description: 'Виявлено різке зростання обсягів імпорту електроніки з Китаю',
      timestamp: new Date().toISOString()
    },
    {
      id: 'alert-2',
      severity: 'medium',
      title: 'Новий постачальник з Туреччини: ціна -23%',
      description: 'Виявлено нового постачальника сталевих виробів',
      timestamp: new Date().toISOString()
    }
  ]);
});

app.get('/api/v1/premium/commodity-forecast', (req, res) => {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'];
  const data = months.map((month, i) => ({
    month,
    actual: 100 + Math.random() * 50,
    forecast: 120 + Math.random() * 60
  }));

  res.json(data);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 PREDATOR Mock API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');

  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'metrics',
      data: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        timestamp: new Date().toISOString()
      }
    }));
  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('📡 WebSocket client disconnected');
  });
});

export default app;
