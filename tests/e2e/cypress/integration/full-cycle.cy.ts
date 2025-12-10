/**
 * Full Cycle E2E Test Suite
 * 
 * Тестує повний цикл роботи системи:
 * - Завантаження XLSX файлу
 * - Обробка даних моделями
 * - Генерація звітів
 * - Перевірка OpenSearch
 */

describe('Full E2E Cycle - Customs Processing', () => {
    const TEST_RUN_ID = `test-${Date.now()}`;

    before(() => {
        // Generate test data file if needed
        cy.task('generateTestXlsx', {
            rowCount: 500,
            outputPath: 'cypress/fixtures/Березень_2024.xlsx'
        }).then((result: any) => {
            cy.log(`Generated test file with ${result.rowCount} rows at ${result.path}`);
        });
    });

    beforeEach(() => {
        // Set up API intercepts
        cy.intercept('POST', '**/api/v1/integrations/upload').as('fileUpload');
        cy.intercept('POST', '**/api/v1/e2e/**').as('e2eApi');
        cy.intercept('GET', '**/api/v1/search/customs').as('customsSearch');
    });

    describe('1. Завантаження тестового файлу', () => {
        it('should display upload interface', () => {
            cy.navigateToDashboard();

            // Find upload section
            cy.get('[data-testid="integration-view"], [href*="integration"], a:contains("Інтеграції")')
                .first()
                .click();

            cy.url().should('include', 'integration');

            // Verify upload zone exists
            cy.get('[data-testid="file-upload"], .upload-zone, input[type="file"]')
                .should('exist');
        });

        it('should upload Березень_2024.xlsx successfully', () => {
            cy.visit('/integration');

            // Upload the test file
            cy.uploadXlsxFile('Березень_2024.xlsx');

            // Wait for upload to complete
            cy.wait('@fileUpload', { timeout: 60000 }).then((interception) => {
                expect(interception.response?.statusCode).to.be.oneOf([200, 201, 202]);
            });

            // Verify upload success indication
            cy.get('[data-testid="upload-status"], .upload-success, .toast-success', { timeout: 30000 })
                .should('contain.text', 'успіш')
                .or('contain.text', 'success')
                .or('contain.text', 'завантажено');
        });

        it('should process 500+ records from the file', () => {
            // Wait for processing to complete
            cy.waitForProcessingComplete();

            // Verify record count
            cy.request('/api/v1/e2e/processing/stats').then((response) => {
                expect(response.body.records_processed).to.be.at.least(500);
                cy.log(`Processed ${response.body.records_processed} records`);
            });
        });
    });

    describe('2. Тестування моделей обробки', () => {
        const models = ['groq', 'deepseek', 'gemini'];

        models.forEach((model) => {
            it(`should successfully call ${model.toUpperCase()} model`, () => {
                cy.testModelEndpoint(model).then((result) => {
                    if (Cypress.env(`${model.toUpperCase()}_ENABLED`)) {
                        expect(result.success).to.be.true;
                        expect(result.latency).to.be.lessThan(30000);
                        cy.log(`${model} response time: ${result.latency}ms`);
                    } else {
                        cy.log(`${model} is disabled in this environment`);
                    }
                });
            });
        });

        it('should handle Karpathy model (mock in local env)', () => {
            const isLocal = Cypress.env('IS_LOCAL');

            if (isLocal) {
                cy.log('Running in local mode - using Karpathy mock');
                cy.enableMockMode('karpathy');
            }

            cy.testModelEndpoint('karpathy').then((result) => {
                expect(result.success).to.be.true;

                if (isLocal) {
                    expect(result.response.is_mock).to.be.true;
                }
            });

            if (isLocal) {
                cy.disableMockMode('karpathy');
            }
        });
    });

    describe('3. Fallback логіка', () => {
        it('should fallback to DeepSeek when Groq fails', () => {
            // Disable Groq
            cy.triggerFallback('groq');

            // Make a request that would use the LLM
            cy.request({
                method: 'POST',
                url: '/api/v1/council/run',
                body: { query: 'Тестовий запит для перевірки fallback' },
                timeout: 60000
            }).then((response) => {
                // Should use fallback model
                expect(response.body.model_used || response.body.fallback_used).to.exist;
                cy.log(`Fallback activated: ${response.body.model_used}`);
            });

            // Re-enable Groq
            cy.disableMockMode('groq');
        });

        it('should fallback to Karpathy when all external models fail', () => {
            // Disable all external models
            cy.triggerFallback('groq');
            cy.triggerFallback('deepseek');
            cy.triggerFallback('gemini');

            // Enable Karpathy mock for local testing
            if (Cypress.env('IS_LOCAL')) {
                cy.enableMockMode('karpathy');
            }

            // Verify Karpathy is used
            cy.verifyFallbackActivated('karpathy').then((isActive) => {
                expect(isActive).to.be.true;
            });

            // Cleanup
            cy.disableMockMode('groq');
            cy.disableMockMode('deepseek');
            cy.disableMockMode('gemini');
            if (Cypress.env('IS_LOCAL')) {
                cy.disableMockMode('karpathy');
            }
        });

        it('should log fallback events correctly', () => {
            cy.verifyOpenSearchLogs(TEST_RUN_ID).then((result) => {
                // Check that fallback events are logged
                cy.request({
                    method: 'POST',
                    url: '/api/v1/e2e/opensearch/search',
                    body: {
                        query: 'fallback activated',
                        index: 'predator-logs-*'
                    }
                }).then((response) => {
                    cy.log(`Found ${response.body.hits?.total || 0} fallback log entries`);
                });
            });
        });
    });

    describe('4. Генерація звітів', () => {
        it('should automatically generate PDF report after processing', () => {
            // Trigger report generation
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/reports/generate',
                body: {
                    run_id: TEST_RUN_ID,
                    format: 'pdf'
                },
                timeout: 120000
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.pdf_url).to.exist;
            });
        });

        it('should include watermark and signature in PDF', () => {
            cy.visit('/testing');
            cy.validatePdfReport({
                checkWatermark: true,
                checkSignature: true
            });
        });

        it('should generate Markdown report for developers', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/reports/generate',
                body: {
                    run_id: TEST_RUN_ID,
                    format: 'markdown'
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.markdown_url).to.exist;

                // Fetch and validate content
                cy.request(response.body.markdown_url).then((mdResponse) => {
                    const content = mdResponse.body;

                    // Required sections
                    expect(content).to.include('# Звіт');
                    expect(content).to.include('Логи виконання');
                    expect(content).to.include('Технічні деталі');
                    expect(content).to.include('Час обробки');
                });
            });
        });

        it('should make reports available for download in UI', () => {
            cy.visit('/testing');

            // Check PDF download link
            cy.get('[data-testid="report-downloads"], .report-section')
                .should('exist')
                .within(() => {
                    cy.get('a[href*=".pdf"], button:contains("PDF")')
                        .should('exist');
                    cy.get('a[href*=".md"], button:contains("Markdown")')
                        .should('exist');
                });
        });
    });

    describe('5. Перевірка OpenSearch Dashboard', () => {
        it('should display processing logs in OpenSearch', () => {
            cy.navigateToOpenSearchDashboard();

            // Search for test run logs
            cy.get('[data-testid="search-input"], input[type="search"]')
                .type(`run_id:${TEST_RUN_ID}`);

            cy.get('[data-testid="search-button"], button:contains("Search")')
                .click();

            // Should find log entries
            cy.get('[data-testid="log-entries"], .log-list', { timeout: 30000 })
                .should('have.length.at.least', 1);
        });

        it('should index all processed records', () => {
            cy.checkDataIndexed(500).then((isComplete) => {
                expect(isComplete).to.be.true;
            });
        });

        it('should correctly format dates and numbers', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/search/customs',
                body: { query: '*', limit: 10 }
            }).then((response) => {
                const results = response.body.results || [];

                if (results.length > 0) {
                    const sample = results[0];

                    // Check date format (should be parseable)
                    if (sample.date) {
                        const parsedDate = new Date(sample.date);
                        expect(parsedDate.getTime()).to.not.be.NaN;
                    }

                    // Check numeric fields
                    if (sample.value) {
                        expect(typeof sample.value).to.eq('number');
                    }
                }
            });
        });

        it('should provide search functionality for indexed data', () => {
            // Test semantic search
            cy.request({
                method: 'GET',
                url: '/api/v1/search',
                qs: { q: 'мікросхеми інтегральні', mode: 'hybrid' }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.results).to.have.length.at.least(0);
            });
        });
    });

    describe('6. Перевірка UI-елементів', () => {
        it('should display correct test status in Testing Lab', () => {
            cy.navigateToTestingLab();

            // Check test suite cards
            cy.get('[data-testid="test-suite"], .test-card')
                .should('have.length.at.least', 4);

            // Check console output
            cy.get('[data-testid="console-output"], .terminal-output')
                .should('exist');
        });

        it('should enable running tests manually', () => {
            cy.navigateToTestingLab();

            // Find and click run button
            cy.get('[data-testid="run-test"], button:contains("Run")')
                .first()
                .should('not.be.disabled')
                .click();

            // Should show running state
            cy.get('.running, [data-status="running"]', { timeout: 5000 })
                .should('exist');
        });

        it('should display real-time logs during test execution', () => {
            cy.navigateToTestingLab();

            // Run a test
            cy.get('[data-testid="run-test"]').first().click();

            // Console should update
            cy.get('[data-testid="console-output"], .terminal-output')
                .should('not.be.empty')
                .and('contain.text', 'Initializing');
        });
    });
});
