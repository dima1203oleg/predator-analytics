import { describe, it, expect, beforeAll } from 'vitest';
import { factoryApi } from '../../../services/api/factory';
import { apiClient, v45Client } from '../../../services/api/config';

// Note: These tests assume the mock-api-server is running on http://localhost:9080
// and that the frontend is configured to use it as its API_BASE_URL.

describe('Factory API Integration', () => {
    beforeAll(() => {
        // Explicitly set base URLs for test environment because import.meta.env is not available
        apiClient.defaults.baseURL = 'http://localhost:9080/api/v1';
        v45Client.defaults.baseURL = 'http://localhost:9080/api/v45';
    });
    it('should fetch factory stats', async () => {
        const stats = await factoryApi.getStats();
        expect(stats).toBeDefined();
        expect(stats.total_patterns).toBeGreaterThanOrEqual(0);
        expect(stats.gold_patterns).toBeGreaterThanOrEqual(0);
    });

    it('should fetch all patterns', async () => {
        const patterns = await factoryApi.getPatterns();
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should fetch gold patterns', async () => {
        const goldPatterns = await factoryApi.getGoldPatterns();
        expect(Array.isArray(goldPatterns)).toBe(true);
        goldPatterns.forEach(p => {
            expect(p.gold).toBe(true);
            expect(p.score).toBeGreaterThanOrEqual(92);
        });
    });

    it('should perform test ingestion', async () => {
        const payload = {
            run_id: `test-integration-${Date.now()}`,
            component: 'test-runner',
            metrics: {
                coverage: 100,
                pass_rate: 100,
                performance: 100,
                chaos_resilience: 100,
                business_kpi: 100
            },
            changes: { modified: [], added: [] },
            timestamp: new Date().toISOString()
        };
        
        const result = await factoryApi.ingest(payload);
        expect(result.status).toBe('created');
        expect(result.score).toBe(100);
        expect(result.is_gold).toBe(true);
    });

    it('should fetch neural training status', async () => {
        const status = await factoryApi.getTrainingStatus();
        expect(['IDLE', 'TRAINING', 'COMPLETED']).toContain(status.status);
    });

    it('should fetch neural training stats', async () => {
        const stats = await factoryApi.getTrainingStats();
        expect(Array.isArray(stats)).toBe(true);
        if (stats.length > 0) {
            expect(stats[0]).toHaveProperty('epoch');
            expect(stats[0]).toHaveProperty('loss');
        }
    });
});
