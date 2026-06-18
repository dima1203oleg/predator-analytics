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

// Generic mock for any API route
app.all('/api/*', (req, res) => {
  res.json({ message: 'Mock response', path: req.path, method: req.method, body: req.body });
});

// Export a handler compatible with Vite's middleware usage
export default function (req, res, next) {
  app(req, res, next);
}
