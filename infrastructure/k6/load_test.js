import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Метрики
export let errorRate = new Rate('errors');

// Конфігурація тесту
export let options = {
  stages: [
    { duration: '1m', target: 50 },  // Розігрів
    { duration: '3m', target: 200 }, // Навантаження
    { duration: '1m', target: 0 },   // Охолодження
  ],
  thresholds: {
    errors: ['rate<0.01'], // Менше 1% помилок
    http_req_duration: ['p(95)<500'], // 95% запитів швидше 500мс
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090';

  // Тест API здоров'я
  let res = http.get(`${BASE_URL}/api/v1/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Тест API Конституції (читання)
  res = http.get(`${BASE_URL}/api/v1/constitution/axioms`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
