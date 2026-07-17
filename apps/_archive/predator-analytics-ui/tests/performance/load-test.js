// 📊 PREDATOR Analytics UI - Performance Load Test
// Version: v55.1.0
// Purpose: Comprehensive performance testing with k6

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '10m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 50 },  // Ramp down to 50 users
    { duration: '2m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    http_reqs: ['rate>10'],            // At least 10 requests per second
  },
};

const BASE_URL = 'http://localhost:3030';

export function setup() {
  console.log('🚀 Starting PREDATOR Analytics UI Performance Test');
  console.log(`📊 Target URL: ${BASE_URL}`);
  
  // Verify service is available
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error('Service is not healthy');
  }
  
  console.log('✅ Service is healthy, starting load test');
}

export default function () {
  // Test health endpoint
  let response = http.get(`${BASE_URL}/health`);
  let success = check(response, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!success);
  responseTimeTrend.add(response.timings.duration);
  
  // Test main application
  response = http.get(`${BASE_URL}/`);
  success = check(response, {
    'main page status is 200': (r) => r.status === 200,
    'main page response time < 500ms': (r) => r.timings.duration < 500,
    'main page has content': (r) => r.body.includes('PREDATOR'),
  });
  
  errorRate.add(!success);
  responseTimeTrend.add(response.timings.duration);
  
  // Test static assets (CSS)
  response = http.get(`${BASE_URL}/assets/index.css`);
  check(response, {
    'CSS file status is 200': (r) => r.status === 200,
    'CSS response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Test static assets (JS)
  response = http.get(`${BASE_URL}/assets/index.js`);
  check(response, {
    'JS file status is 200': (r) => r.status === 200,
    'JS response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // Simulate user think time
  sleep(1);
}

export function teardown() {
  console.log('📊 Load test completed');
  console.log(`📈 Error rate: ${errorRate.rate * 100}%`);
  console.log(`⏱️ Average response time: ${responseTimeTrend.avg}ms`);
  console.log(`🎯 95th percentile: ${responseTimeTrend.p(95)}ms`);
}

// Custom functions for specific scenarios
export function testDashboardLoad() {
  const response = http.get(`${BASE_URL}/dashboard`);
  
  check(response, {
    'dashboard loads successfully': (r) => r.status === 200,
    'dashboard contains analytics': (r) => r.body.includes('analytics'),
    'dashboard response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  sleep(2);
}

export function testAPIEndpoints() {
  const endpoints = [
    '/api/v1/system/metrics',
    '/api/v1/database/stats',
    '/api/v1/alerts?status=new',
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`);
    
    check(response, {
      [`API ${endpoint} responds`]: (r) => r.status < 500,
      [`API ${endpoint} response time < 2s`]: (r) => r.timings.duration < 2000,
    });
    
    sleep(0.5);
  });
}

export function testConcurrentUsers() {
  // Simulate multiple concurrent users
  const scenarios = [
    { name: 'Dashboard User', fn: testDashboardLoad },
    { name: 'API User', fn: testAPIEndpoints },
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario.fn();
}
