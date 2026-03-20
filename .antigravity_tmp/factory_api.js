
const express = require('express');
const router = express.Router();

// Knowledge Map Database (In-Memory)
let DB_PATTERNS = [
  {
    hash: 'h1',
    component: 'backend',
    pattern_description: 'Optimized PostgreSQL connection pooling for high-concurrency requests.',
    pattern_type: 'performance',
    score: 95,
    gold: true,
    timestamp: new Date().toISOString(),
    tags: ['postgres', 'performance'],
    source_run_id: 'run-123'
  },
  {
    hash: 'h2',
    component: 'web_ui',
    pattern_description: 'Framer Motion layout animations for smooth view transitions.',
    pattern_type: 'ux',
    score: 88,
    gold: false,
    timestamp: new Date().toISOString(),
    tags: ['react', 'animation'],
    source_run_id: 'run-124'
  },
  {
    hash: 'h3',
    component: 'api',
    pattern_description: 'Strict JWT validation middleware with sliding expiration.',
    pattern_type: 'security',
    score: 94,
    gold: true,
    timestamp: new Date().toISOString(),
    tags: ['auth', 'security'],
    source_run_id: 'run-125'
  }
];

// Factory Stats
router.get('/stats', (req, res) => {
  const gold = DB_PATTERNS.filter(p => p.gold).length;
  const avg = DB_PATTERNS.length > 0 
    ? DB_PATTERNS.reduce((acc, p) => acc + p.score, 0) / DB_PATTERNS.length 
    : 0;

  res.json({
    total_runs: 42,
    total_patterns: DB_PATTERNS.length,
    gold_patterns: gold,
    avg_score: avg,
    last_run: new Date().toISOString()
  });
});

// All Patterns
router.get('/patterns', (req, res) => {
  res.json(DB_PATTERNS);
});

// Gold Patterns
router.get('/patterns/gold', (req, res) => {
  res.json(DB_PATTERNS.filter(p => p.gold));
});

// Ingest
router.post('/ingest', (req, res) => {
  const { run_id, component, metrics, changes } = req.body;
  
  // Scoring logic
  const score = Math.round(
    (metrics.coverage * 0.2) + 
    (metrics.pass_rate * 0.3) + 
    (metrics.performance * 0.2) + 
    (metrics.chaos_resilience * 0.15) + 
    (metrics.business_kpi * 0.15)
  );

  const hash = 'h' + Math.random().toString(36).substring(7);
  const isGold = score >= 92;

  const newPattern = {
    hash,
    component,
    pattern_description: `Generated from run ${run_id}. Automatic analysis detected optimal ${component} behavior.`,
    pattern_type: score > 90 ? 'performance' : 'other',
    score,
    gold: isGold,
    timestamp: new Date().toISOString(),
    tags: [component, 'automatic'],
    source_run_id: run_id
  };

  DB_PATTERNS.unshift(newPattern);
  
  res.json({
    status: 'created',
    pattern_hash: hash,
    score: score,
    correlation_id: `corr-${Date.now()}`
  });
});

module.exports = router;
