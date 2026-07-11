// mock-api-server.mjs
import express from 'express';
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Graph summary endpoint mock (for Omniscience V2)
app.get('/api/v1/graph/summary', (req, res) => {
  res.json({
    nodes: [
      { id: 'TARGET-01', type: 'person', riskScore: 90, label: 'V. Oligarch' },
      { id: 'SHELL-99', type: 'company', riskScore: 85, label: 'Offshore Holdings Ltd' },
      { id: 'CYPRUS', type: 'country', riskScore: 50, label: 'Cyprus' },
      { id: 'BANK-01', type: 'company', riskScore: 20, label: 'Global Bank' },
      { id: 'DOC-123', type: 'document', riskScore: 10, label: 'Transaction 590M' }
    ],
    edges: [
      { source: 'TARGET-01', target: 'SHELL-99', weight: 5 },
      { source: 'SHELL-99', target: 'CYPRUS', weight: 2 },
      { source: 'SHELL-99', target: 'BANK-01', weight: 8 },
      { source: 'DOC-123', target: 'TARGET-01', weight: 1 }
    ]
  });
});

// Explain endpoint mock
app.post('/api/v1/explain', (req, res) => {
  res.json({
    explanation: 'Mocked AI Explanation: Ця сутність має високий ризик через зв\'язки з офшорними юрисдикціями.',
    confidence: 0.98,
    chain: ['Зв\'язок з TARGET-01', 'Реєстрація на Кіпрі']
  });
});

// Generic mock for any API route
app.use('/api', (req, res) => {
  res.json({ message: 'Mock response', path: req.path, method: req.method, body: req.body });
});

// Export a handler compatible with Vite's middleware usage
export default function (req, res, next) {
  app(req, res, next);
}

// If run directly via node, listen on 9080
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = 9080;
  app.listen(PORT, () => {
    console.log(`Mock API Server is running on port ${PORT}`);
  });
}
