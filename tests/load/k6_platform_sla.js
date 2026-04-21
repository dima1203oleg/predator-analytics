import http from 'k6/http';
import { check, sleep } from 'k6';

// SLA Configuration — PREDATOR Analytics v56.5-ELITE
// TZ v5.0 §9.2: API P95 < 2.0s, DB P95 < 1.0s

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Ramp-up: 20 users over 1 min
    { duration: '3m', target: 50 },  // Stress: 50 users for 3 mins
    { duration: '1m', target: 0 },   // Cool-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
    http_req_duration: ['p(95)<2000'], // 95% of requests must be below 2s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // 1. Тест пошуку (Search SLA)
  let searchRes = http.get(`${BASE_URL}/search/companies?query=ТОВ`, params);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search latency < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // 2. Тест скорингу (Scoring SLA)
  let scoreRes = http.get(`${BASE_URL}/risk/score?entities=company-1,company-2`, params);
  check(scoreRes, {
    'scoring status is 200': (r) => r.status === 200,
    'scoring latency < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(2);
}
