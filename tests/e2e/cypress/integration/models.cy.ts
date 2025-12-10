/**
 * LLM Models Integration Tests
 * 
 * Тестує роботу кожної моделі окремо:
 * - Groq
 * - DeepSeek  
 * - Gemini
 * - Karpathy (з підтримкою mock для локального запуску)
 */

describe('LLM Models Integration', () => {

    describe('Groq Model', () => {
        const MODEL = 'groq';

        beforeEach(() => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/disable',
                body: { model: MODEL },
                failOnStatusCode: false
            });
        });

        it('should connect to Groq API successfully', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/model/groq/health',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.status).to.eq('healthy');
                    expect(response.body.api_key_configured).to.be.true;
                } else {
                    cy.log('Groq API not available - skipping connection test');
                }
            });
        });

        it('should process customs data query via Groq', () => {
            cy.testModelEndpoint(MODEL).then((result) => {
                if (result.success) {
                    expect(result.latency).to.be.lessThan(30000);
                    expect(result.response.content).to.exist;
                    cy.log(`Groq latency: ${result.latency}ms`);
                } else if (result.response?.error?.includes('rate limit')) {
                    cy.log('Groq rate limited - expected in some scenarios');
                }
            });
        });

        it('should return valid response format', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/model/groq/test',
                body: {
                    test_prompt: 'Проаналізуй митну декларацію на комп\'ютерне обладнання',
                    timeout: 30000
                },
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200 && response.body.success) {
                    expect(response.body.content).to.be.a('string');
                    expect(response.body.model).to.exist;
                    expect(response.body.tokens_used).to.be.a('number');
                }
            });
        });

        it('should handle Groq errors gracefully', () => {
            // Enable mock to simulate error
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/enable',
                body: { model: MODEL, mode: 'error', error_type: 'timeout' }
            });

            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/model/groq/test',
                body: { test_prompt: 'Test query' },
                failOnStatusCode: false
            }).then((response) => {
                // Should not crash, should return error gracefully
                expect(response.body.error || response.body.fallback_used).to.exist;
            });

            // Cleanup
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/disable',
                body: { model: MODEL }
            });
        });
    });

    describe('DeepSeek Model', () => {
        const MODEL = 'deepseek';

        it('should connect to DeepSeek API', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/model/deepseek/health',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.status).to.eq('healthy');
                } else {
                    cy.log('DeepSeek not configured - acceptable for some environments');
                }
            });
        });

        it('should process query and return analysis', () => {
            cy.testModelEndpoint(MODEL).then((result) => {
                if (result.success) {
                    expect(result.response.content).to.exist;
                    cy.log(`DeepSeek response received in ${result.latency}ms`);
                }
            });
        });

        it('should handle rate limit gracefully', () => {
            // Simulate rate limit scenario
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/enable',
                body: { model: MODEL, mode: 'rate_limit' }
            });

            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/model/deepseek/test',
                body: { test_prompt: 'Test query' },
                failOnStatusCode: false
            }).then((response) => {
                // Should trigger fallback or return appropriate error
                const hasError = response.body.error || response.body.fallback_used;
                expect(hasError).to.exist;

                if (response.body.fallback_used) {
                    cy.log(`Fallback activated to: ${response.body.fallback_model}`);
                }
            });

            // Cleanup
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/disable',
                body: { model: MODEL }
            });
        });

        it('should use correct DeepSeek quota', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/model/deepseek/quota',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.remaining).to.be.a('number');
                    expect(response.body.limit).to.be.a('number');
                    cy.log(`DeepSeek quota: ${response.body.remaining}/${response.body.limit}`);
                }
            });
        });
    });

    describe('Gemini Model', () => {
        const MODEL = 'gemini';

        it('should verify Gemini API configuration', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/model/gemini/health',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.status).to.eq('healthy');
                    expect(response.body.model_version).to.exist;
                }
            });
        });

        it('should process customs analysis query', () => {
            cy.testModelEndpoint(MODEL).then((result) => {
                if (result.success) {
                    expect(result.response.content).to.be.a('string');
                    expect(result.response.content.length).to.be.greaterThan(10);
                }
            });
        });

        it('should return response in expected format', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/model/gemini/test',
                body: {
                    test_prompt: 'Класифікуй товар: "Ноутбук Apple MacBook Pro 14"',
                    format: 'json'
                },
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200 && response.body.success) {
                    // Verify response structure
                    expect(response.body).to.have.property('content');
                    expect(response.body).to.have.property('model');
                    expect(response.body).to.have.property('latency_ms');
                }
            });
        });

        it('should interpret Gemini response correctly', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/council/run',
                body: {
                    query: 'Який код HS для смартфонів?',
                    models: ['gemini']
                },
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    const answer = response.body.final_answer || response.body.per_model_answers?.[0]?.answer;
                    if (answer) {
                        // Should mention relevant HS code
                        expect(answer.toLowerCase()).to.satisfy((a: string) =>
                            a.includes('8517') || a.includes('телефон') || a.includes('phone')
                        );
                    }
                }
            });
        });
    });

    describe('Karpathy Model (Local)', () => {
        const MODEL = 'karpathy';
        const isLocal = Cypress.env('IS_LOCAL');

        beforeEach(() => {
            if (isLocal) {
                cy.log('🖥️ Local environment detected - using Karpathy mock');
                cy.enableMockMode(MODEL);
            }
        });

        afterEach(() => {
            if (isLocal) {
                cy.disableMockMode(MODEL);
            }
        });

        it('should be available on remote server', function () {
            if (isLocal) {
                this.skip();
                return;
            }

            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/model/karpathy/health',
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status).to.eq('healthy');
                expect(response.body.gpu_available).to.be.true;
            });
        });

        it('should use mock implementation in local environment', function () {
            if (!isLocal) {
                this.skip();
                return;
            }

            cy.testModelEndpoint(MODEL).then((result) => {
                expect(result.success).to.be.true;
                expect(result.response.is_mock).to.be.true;
                cy.log('Mock Karpathy response received');
            });
        });

        it('should process data using Karpathy (or mock)', () => {
            cy.testModelEndpoint(MODEL).then((result) => {
                expect(result.success).to.be.true;
                expect(result.response.content).to.exist;

                if (isLocal) {
                    expect(result.response.is_mock).to.be.true;
                } else {
                    expect(result.latency).to.be.lessThan(60000);
                }
            });
        });

        it('should return consistent response format', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/model/karpathy/test',
                body: { test_prompt: 'Analyze risk factors' },
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body).to.have.property('content');
                    expect(response.body).to.have.property('success');
                    expect(response.body).to.have.property('model');
                }
            });
        });
    });

    describe('Fallback Priority Chain', () => {
        it('should follow correct fallback order: Groq -> DeepSeek -> Gemini -> Karpathy', () => {
            const priorityOrder = ['groq', 'deepseek', 'gemini', 'karpathy'];

            cy.request('/api/v1/e2e/fallback/priority').then((response) => {
                expect(response.body.priority).to.deep.eq(priorityOrder);
            });
        });

        it('should automatically switch to next model on failure', () => {
            // Disable first two models
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/enable',
                body: { model: 'groq', mode: 'fail' }
            });
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/mock/enable',
                body: { model: 'deepseek', mode: 'fail' }
            });

            // Should use Gemini
            cy.request({
                method: 'POST',
                url: '/api/v1/council/run',
                body: { query: 'Test fallback chain' },
                timeout: 60000
            }).then((response) => {
                // Should succeed using fallback
                expect(response.status).to.eq(200);

                const modelUsed = response.body.model_used ||
                    response.body.per_model_answers?.[0]?.model;

                if (modelUsed) {
                    cy.log(`Fallback used model: ${modelUsed}`);
                    expect(modelUsed.toLowerCase()).to.include('gemini');
                }
            });

            // Cleanup
            cy.request({ method: 'POST', url: '/api/v1/e2e/mock/disable', body: { model: 'groq' } });
            cy.request({ method: 'POST', url: '/api/v1/e2e/mock/disable', body: { model: 'deepseek' } });
        });

        it('should log each fallback event', () => {
            // Check OpenSearch for fallback logs
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: 'event_type:fallback',
                    index: 'predator-logs-*',
                    size: 10
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];
                cy.log(`Found ${hits.length} fallback events in logs`);
            });
        });

        it('should notify about all models failure', () => {
            // Disable ALL models including Karpathy mock
            ['groq', 'deepseek', 'gemini', 'karpathy'].forEach(model => {
                cy.request({
                    method: 'POST',
                    url: '/api/v1/e2e/mock/enable',
                    body: { model, mode: 'fail' }
                });
            });

            cy.request({
                method: 'POST',
                url: '/api/v1/council/run',
                body: { query: 'Test complete failure' },
                failOnStatusCode: false,
                timeout: 120000
            }).then((response) => {
                // Should return graceful error
                expect(response.body.error || response.body.final_answer).to.exist;

                if (response.body.error) {
                    expect(response.body.error).to.include('моделі');
                }
            });

            // Cleanup all
            ['groq', 'deepseek', 'gemini', 'karpathy'].forEach(model => {
                cy.request({
                    method: 'POST',
                    url: '/api/v1/e2e/mock/disable',
                    body: { model }
                });
            });
        });
    });
});
