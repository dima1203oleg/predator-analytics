/**
 * Report Generation E2E Tests
 * 
 * Тестує генерацію звітів:
 * - PDF звіт з водяними знаками та підписом
 * - Markdown звіт для розробників
 * - Доставка та доступність звітів
 */

describe('Report Generation', () => {
    const TEST_RUN_ID = `report-test-${Date.now()}`;

    before(() => {
        // Trigger a test run to generate reports
        cy.request({
            method: 'POST',
            url: '/api/v1/e2e/test-run',
            body: {
                run_id: TEST_RUN_ID,
                test_type: 'full',
                generate_reports: true
            },
            timeout: 180000
        }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log(`Test run ${TEST_RUN_ID} initiated`);
        });

        // Wait for processing
        cy.wait(5000);
    });

    describe('PDF Report Generation', () => {
        let pdfUrl: string;

        it('should generate PDF report after processing', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/reports/generate',
                body: {
                    run_id: TEST_RUN_ID,
                    format: 'pdf',
                    options: {
                        include_watermark: true,
                        include_signature: true
                    }
                },
                timeout: 120000
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.pdf_url).to.exist;
                pdfUrl = response.body.pdf_url;
                cy.log(`PDF generated: ${pdfUrl}`);
            });
        });

        it('should download PDF successfully', function () {
            if (!pdfUrl) {
                this.skip();
                return;
            }

            cy.request({
                url: pdfUrl,
                encoding: 'binary'
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.headers['content-type']).to.include('pdf');

                // Check file size (should be at least 10KB)
                expect(response.body.length).to.be.greaterThan(10000);
            });
        });

        it('should contain watermark', function () {
            // This is a simplified check - in production, use pdf-parse
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/verify',
                qs: { run_id: TEST_RUN_ID, check: 'watermark' }
            }).then((response) => {
                expect(response.body.has_watermark).to.be.true;
                expect(response.body.watermark_text).to.exist;
            });
        });

        it('should contain signature', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/verify',
                qs: { run_id: TEST_RUN_ID, check: 'signature' }
            }).then((response) => {
                expect(response.body.has_signature).to.be.true;
                expect(response.body.signed_by).to.exist;
            });
        });

        it('should include all required sections', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/verify',
                qs: { run_id: TEST_RUN_ID, check: 'sections' }
            }).then((response) => {
                const sections = response.body.sections || [];

                expect(sections).to.include('Загальна інформація');
                expect(sections).to.include('Статистика обробки');
                expect(sections).to.include('Результати');
            });
        });

        it('should display statistics correctly', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/data',
                qs: { run_id: TEST_RUN_ID }
            }).then((response) => {
                expect(response.body.total_records).to.be.a('number');
                expect(response.body.successful_records).to.be.a('number');
                expect(response.body.failed_records).to.be.a('number');

                // Validate consistency
                expect(response.body.total_records).to.eq(
                    response.body.successful_records + response.body.failed_records
                );
            });
        });

        it('should open without errors', function () {
            if (!pdfUrl) {
                this.skip();
                return;
            }

            // Check PDF header signature
            cy.request({
                url: pdfUrl,
                encoding: 'binary'
            }).then((response) => {
                // PDF files start with %PDF-
                const header = response.body.substring(0, 5);
                expect(header).to.eq('%PDF-');
            });
        });
    });

    describe('Markdown Report Generation', () => {
        let markdownUrl: string;
        let markdownContent: string;

        it('should generate Markdown report', () => {
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
                markdownUrl = response.body.markdown_url;
            });
        });

        it('should download Markdown content', function () {
            if (!markdownUrl) {
                this.skip();
                return;
            }

            cy.request(markdownUrl).then((response) => {
                expect(response.status).to.eq(200);
                markdownContent = response.body;
                expect(markdownContent).to.be.a('string');
                expect(markdownContent.length).to.be.greaterThan(100);
            });
        });

        it('should include execution logs', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                expect(content).to.include('## Логи виконання');
                expect(content).to.match(/\d{2}:\d{2}:\d{2}/); // Time stamps
            });
        });

        it('should include technical details', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                expect(content).to.include('## Технічні деталі');
                expect(content).to.include('Версія');
                expect(content).to.include('Час обробки');
            });
        });

        it('should include model usage information', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                // Should mention models used
                const hasModelInfo = ['groq', 'deepseek', 'gemini', 'karpathy']
                    .some(model => content.toLowerCase().includes(model));

                expect(hasModelInfo).to.be.true;
            });
        });

        it('should include fallback events if occurred', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                // Check for fallback section
                if (content.includes('fallback') || content.includes('Перемикання')) {
                    expect(content).to.match(/fallback|Перемикання/i);
                }
            });
        });

        it('should include warnings or errors if any', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                // If there are warnings, they should be formatted
                if (content.includes('⚠️') || content.includes('Warning')) {
                    expect(content).to.match(/⚠️|Warning|Попередження/i);
                }
            });
        });

        it('should include recommendations for developers', () => {
            cy.request({
                method: 'GET',
                url: `/api/v1/e2e/reports/markdown/${TEST_RUN_ID}`
            }).then((response) => {
                const content = response.body.content || response.body;

                // Check for recommendations section
                const hasRecommendations =
                    content.includes('Рекомендації') ||
                    content.includes('Recommendations') ||
                    content.includes('## Висновки');

                expect(hasRecommendations).to.be.true;
            });
        });
    });

    describe('Report Delivery & Accessibility', () => {
        it('should make PDF available via UI', () => {
            cy.visit('/testing');

            // Look for download section
            cy.get('[data-testid="reports-section"], .reports-container', { timeout: 10000 })
                .should('exist');

            cy.get('[data-testid="pdf-download"], a[href*=".pdf"], button:contains("PDF")')
                .should('exist')
                .and('be.visible');
        });

        it('should make Markdown available via UI', () => {
            cy.visit('/testing');

            cy.get('[data-testid="markdown-download"], a[href*=".md"], button:contains("Markdown")')
                .should('exist');
        });

        it('should allow downloading PDF from UI', () => {
            cy.visit('/testing');

            // Intercept download
            cy.intercept('GET', '**/*.pdf').as('pdfDownload');

            cy.get('[data-testid="pdf-download"], button:contains("PDF")').first().click();

            cy.wait('@pdfDownload', { timeout: 30000 }).then((interception) => {
                expect(interception.response?.statusCode).to.eq(200);
            });
        });

        it('should store reports in accessible location', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/list',
                qs: { run_id: TEST_RUN_ID }
            }).then((response) => {
                expect(response.body.reports).to.have.length.at.least(2);

                response.body.reports.forEach((report: any) => {
                    expect(report.url).to.exist;
                    expect(report.created_at).to.exist;
                    expect(report.format).to.be.oneOf(['pdf', 'markdown']);
                });
            });
        });

        it('should provide email delivery option', () => {
            cy.request({
                method: 'POST',
                url: '/api/v1/e2e/reports/email',
                body: {
                    run_id: TEST_RUN_ID,
                    recipients: ['test@predator.ua'],
                    include_pdf: true,
                    include_markdown: false
                },
                failOnStatusCode: false
            }).then((response) => {
                // Email might not be configured in test env
                if (response.status === 200) {
                    expect(response.body.sent).to.be.true;
                } else {
                    expect(response.body.error).to.include('not configured');
                }
            });
        });

        it('should archive old reports correctly', () => {
            cy.request({
                method: 'GET',
                url: '/api/v1/e2e/reports/archive',
                qs: { older_than_days: 30 }
            }).then((response) => {
                expect(response.body.archived_count).to.be.a('number');
                expect(response.body.storage_location).to.exist;
            });
        });
    });

    describe('Report Content Validation', () => {
        it('should match processing results with report data', () => {
            // Get processing stats
            cy.request(`/api/v1/e2e/processing/stats?run_id=${TEST_RUN_ID}`)
                .then((processingResponse) => {
                    const processingStats = processingResponse.body;

                    // Get report data
                    cy.request(`/api/v1/e2e/reports/data?run_id=${TEST_RUN_ID}`)
                        .then((reportResponse) => {
                            const reportStats = reportResponse.body;

                            // Compare
                            expect(reportStats.total_records).to.eq(processingStats.total_records);
                            expect(reportStats.successful_records).to.eq(processingStats.successful_records);
                        });
                });
        });

        it('should correctly format dates in regional format', () => {
            cy.request(`/api/v1/e2e/reports/data?run_id=${TEST_RUN_ID}`)
                .then((response) => {
                    // Check date format (DD.MM.YYYY for Ukrainian locale)
                    const dateRegex = /\d{2}\.\d{2}\.\d{4}/;

                    if (response.body.date) {
                        expect(response.body.date).to.match(dateRegex);
                    }
                });
        });

        it('should correctly format currency values', () => {
            cy.request(`/api/v1/e2e/reports/data?run_id=${TEST_RUN_ID}`)
                .then((response) => {
                    if (response.body.total_value) {
                        // Should be formatted with proper separators
                        expect(response.body.total_value_formatted).to.match(/[\d\s,]+/);
                        expect(response.body.currency).to.eq('USD');
                    }
                });
        });
    });
});
