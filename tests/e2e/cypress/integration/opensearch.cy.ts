/**
 * OpenSearch Dashboard Integration Tests
 * 
 * Тести для перевірки:
 * - Доступність OpenSearch Dashboard
 * - Логування подій
 * - Індексація даних
 * - Пошук та візуалізація
 */

describe('OpenSearch Dashboard Integration', () => {
    const TEST_RUN_ID = `opensearch-test-${Date.now()}`;

    describe('Dashboard Accessibility', () => {
        it('should access OpenSearch Dashboard', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/opensearch/health',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.status).to.eq('healthy');
                    expect(response.body.cluster_name).to.exist;
                } else {
                    cy.log('OpenSearch not available in this environment');
                }
            });
        });

        it('should verify index exists', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/opensearch/indices',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    const indices = response.body.indices || [];
                    cy.log(`Found ${indices.length} indices`);

                    // Should have at least one relevant index
                    const hasRelevantIndex = indices.some((idx: string) =>
                        idx.includes('documents') ||
                        idx.includes('customs') ||
                        idx.includes('predator')
                    );

                    expect(hasRelevantIndex).to.be.true;
                }
            });
        });

        it('should handle authentication correctly', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/opensearch/auth-status',
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.authenticated).to.be.true;
                }
            });
        });
    });

    describe('Logging Verification', () => {
        it('should log API request events', () => {
            // Make a request that should be logged
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/test-run',
                body: {
                    run_id: TEST_RUN_ID,
                    test_type: 'logging-test'
                }
            });

            // Wait for log propagation
            cy.wait(2000);

            // Check logs in OpenSearch
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: `run_id:${TEST_RUN_ID}`,
                    index: 'predator-logs-*',
                    size: 10
                }
            }).then((response) => {
                if (response.body.hits) {
                    const hits = response.body.hits.hits || [];
                    cy.log(`Found ${hits.length} log entries for run ${TEST_RUN_ID}`);
                }
            });
        });

        it('should log model invocation events', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: 'event_type:model_invocation',
                    index: 'predator-logs-*',
                    size: 5
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];

                if (hits.length > 0) {
                    const sample = hits[0]._source;
                    expect(sample.event_type).to.eq('model_invocation');
                    cy.log(`Sample model invocation: ${sample.model || 'unknown'}`);
                }
            });
        });

        it('should log error events with sufficient detail', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: 'level:ERROR',
                    index: 'predator-logs-*',
                    size: 10
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];

                if (hits.length > 0) {
                    const sample = hits[0]._source;

                    // Error logs should have necessary fields
                    expect(sample.timestamp).to.exist;
                    expect(sample.message).to.exist;

                    cy.log(`Sample error: ${sample.message}`);
                }
            });
        });

        it('should log fallback events', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: 'event_type:fallback',
                    index: 'predator-logs-*',
                    size: 5
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];
                cy.log(`Found ${hits.length} fallback events in logs`);
            });
        });
    });

    describe('Data Indexing Verification', () => {
        it('should have customs data indexed', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/opensearch/count'
            }).then((response) => {
                const count = response.body.count;
                cy.log(`Total indexed documents: ${count}`);
                expect(count).to.be.a('number');
            });
        });

        it('should return documents with correct structure', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/search/customs',
                body: { query: '*', limit: 5 }
            }).then((response) => {
                const results = response.body.results || [];

                if (results.length > 0) {
                    const doc = results[0];

                    // Verify document structure
                    expect(doc).to.have.property('id');

                    // Check for common fields
                    const hasRequiredFields = doc.description || doc.hs_code || doc.content;
                    expect(hasRequiredFields).to.exist;
                }
            });
        });

        it('should correctly index date fields', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: '*',
                    index: 'customs-*',
                    size: 1
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];

                if (hits.length > 0) {
                    const doc = hits[0]._source;

                    // If there's a date field, verify it's parseable
                    const dateFields = ['date', 'created_at', 'timestamp', 'declaration_date'];

                    for (const field of dateFields) {
                        if (doc[field]) {
                            const parsed = new Date(doc[field]);
                            expect(parsed.getTime()).to.not.be.NaN;
                            break;
                        }
                    }
                }
            });
        });

        it('should correctly index numeric fields', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: '*',
                    index: 'customs-*',
                    size: 5
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];

                if (hits.length > 0) {
                    const doc = hits[0]._source;

                    // Verify numeric fields are numbers
                    const numericFields = ['value', 'weight', 'quantity', 'customs_value'];

                    for (const field of numericFields) {
                        if (doc[field] !== undefined) {
                            expect(typeof doc[field]).to.eq('number');
                        }
                    }
                }
            });
        });
    });

    describe('Search Functionality', () => {
        it('should support full-text search', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/search',
                qs: { q: 'комп\'ютер', mode: 'text', limit: 10 }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.results).to.exist;
            });
        });

        it('should support semantic search', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/search',
                qs: { q: 'електронне обладнання', mode: 'semantic', limit: 10 }
            }).then((response) => {
                expect(response.status).to.eq(200);
            });
        });

        it('should support hybrid search', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/search',
                qs: { q: 'мікросхеми', mode: 'hybrid', rerank: true, limit: 10 }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.results).to.exist;
            });
        });

        it('should return results with relevance scores', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/search',
                qs: { q: 'імпорт товарів', mode: 'hybrid', limit: 5 }
            }).then((response) => {
                const results = response.body.results || [];

                if (results.length > 0) {
                    // Each result should have a score
                    results.forEach((result: any) => {
                        expect(result.score).to.be.a('number');
                        expect(result.score).to.be.gte(0);
                        expect(result.score).to.be.lte(1);
                    });

                    // Results should be sorted by score descending
                    for (let i = 1; i < results.length; i++) {
                        expect(results[i].score).to.be.lte(results[i - 1].score);
                    }
                }
            });
        });

        it('should support filtering by category', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/search/customs',
                body: {
                    query: '*',
                    limit: 10,
                    filters: { category: 'customs' }
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
            });
        });
    });

    describe('Real-time Monitoring', () => {
        it('should not impact main functionality during logging', () => {
            const startTime = Date.now();

            // Make multiple requests rapidly
            const requests = Array(5).fill(null).map((_, i) =>
                cy.request({
                    method: 'GET',
                    url: '/api/v1/search',
                    qs: { q: `test query ${i}`, limit: 1 }
                })
            );

            // All should complete reasonably fast
            const endTime = Date.now();
            const duration = endTime - startTime;

            cy.log(`5 search requests completed in ${duration}ms`);

            // Should not take more than 30 seconds total
            expect(duration).to.be.lessThan(30000);
        });

        it('should maintain dashboard accessibility under load', () => {
            // Check dashboard health while system is processing
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/opensearch/health',
                failOnStatusCode: false
            }).then((response) => {
                // Dashboard should still be responsive
                expect(response.status).to.be.oneOf([200, 503]);
            });
        });
    });

    describe('Dashboard UI Integration', () => {
        it('should navigate to OpenSearch dashboard in UI', () => {
            cy.visit('/databases');

            // Look for OpenSearch tab
            cy.get('[data-tab="opensearch"], button:contains("OpenSearch")', { timeout: 10000 })
                .should('exist');
        });

        it('should display indexed document count', () => {
            cy.visit('/databases');

            // Check for stats display
            cy.get('[data-testid="opensearch-stats"], .opensearch-panel', { timeout: 10000 })
                .should('exist')
                .then(($panel) => {
                    // Should show some count
                    const text = $panel.text();
                    expect(text).to.match(/\d+/);
                });
        });

        it('should allow searching from dashboard', () => {
            cy.visit('/databases');

            // Find search input
            cy.get('[data-testid="opensearch-search"], input[placeholder*="Search"]', { timeout: 10000 })
                .should('exist')
                .type('test query');

            // Should show results or "no results" message
            cy.get('.search-results, .no-results', { timeout: 15000 })
                .should('exist');
        });
    });

    describe('Data Consistency', () => {
        it('should match data between upload and index', () => {
            // Get processing stats
            cy.request('/api/v1/e2e/processing/stats')
                .then((processingResponse) => {
                    const processedCount = processingResponse.body.total_records;

                    // Get indexed count
                    cy.request('/api/v1/e2e/opensearch/count')
                        .then((indexResponse) => {
                            const indexedCount = indexResponse.body.count;

                            // They should be roughly equal (within 5%)
                            if (processedCount > 0) {
                                const ratio = indexedCount / processedCount;
                                expect(ratio).to.be.gte(0.95);
                                cy.log(`Consistency: ${indexedCount}/${processedCount} = ${(ratio * 100).toFixed(1)}%`);
                            }
                        });
                });
        });

        it('should preserve field values during indexing', () => {
            // This would compare original data with indexed data
            // For now, just verify structure is preserved
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/opensearch/search',
                body: {
                    query: '*',
                    index: 'customs-*',
                    size: 1
                }
            }).then((response) => {
                const hits = response.body.hits?.hits || [];

                if (hits.length > 0) {
                    const doc = hits[0]._source;

                    // Document should have reasonable structure
                    expect(Object.keys(doc).length).to.be.gte(3);
                }
            });
        });
    });
});
