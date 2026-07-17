import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

test.describe('API Integration Tests', () => {
  test('Health check', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('Risk assessment', async () => {
    const response = await axios.post(`${API_URL}/risk/assess`, { company_id: 'test_123' });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('risk_score');
  });
});