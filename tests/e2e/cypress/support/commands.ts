/**
 * Custom Cypress Commands for Predator Analytics E2E Testing
 * 
 * Includes commands for file upload, model testing, report validation, etc.
 */

declare global {
    namespace Cypress {
        interface Chainable {
            // File operations
            uploadXlsxFile(filePath: string): Chainable<void>;
            waitForFileProcessing(timeout?: number): Chainable<void>;

            // Model testing
            testModelEndpoint(modelName: string): Chainable<{ success: boolean; latency: number; response?: any }>;
            triggerFallback(failModel: string): Chainable<void>;
            verifyFallbackActivated(expectedModel: string): Chainable<boolean>;

            // Report validation
            validatePdfReport(options?: { checkWatermark?: boolean; checkSignature?: boolean }): Chainable<void>;
            validateMarkdownReport(): Chainable<void>;
            downloadReport(type: 'pdf' | 'markdown'): Chainable<string>;

            // OpenSearch validation
            verifyOpenSearchLogs(runId: string): Chainable<{ found: boolean; entries: number }>;
            checkDataIndexed(expectedCount: number): Chainable<boolean>;

            // Navigation helpers
            navigateToDashboard(): Chainable<void>;
            navigateToTestingLab(): Chainable<void>;
            navigateToOpenSearchDashboard(): Chainable<void>;

            // Wait helpers
            waitForApiResponse(alias: string, timeout?: number): Chainable<any>;
            waitForProcessingComplete(): Chainable<void>;

            // Mock helpers
            enableMockMode(model: string): Chainable<void>;
            disableMockMode(model: string): Chainable<void>;
        }
    }
}

// =================
// FILE OPERATIONS
// =================

Cypress.Commands.add('uploadXlsxFile', (filePath: string) => {
    cy.log(`📁 Uploading file: ${filePath}`);

    // Navigate to upload section
    cy.get('[data-testid="file-upload-zone"], .upload-zone, input[type="file"]')
        .should('exist')
        .first()
        .then(($input) => {
            // Use fixture or real file
            cy.fixture(filePath, 'base64').then((fileContent) => {
                const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                const blob = Cypress.Blob.base64StringToBlob(fileContent, mimeType);
                const file = new File([blob], 'Березень_2024.xlsx', { type: mimeType });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                const input = $input[0] as HTMLInputElement;
                input.files = dataTransfer.files;

                cy.wrap($input).trigger('change', { force: true });
            });
        });

    cy.log('✅ File upload initiated');
});

Cypress.Commands.add('waitForFileProcessing', (timeout = 120000) => {
    cy.log('⏳ Waiting for file processing...');

    // Wait for processing indicator to disappear or success message
    cy.get('[data-testid="processing-indicator"], .processing, .loading', { timeout: 5000 })
        .should('not.exist', { timeout });

    // Verify success
    cy.get('[data-testid="upload-success"], .success-message', { timeout })
        .should('be.visible');

    cy.log('✅ File processing complete');
});

// =================
// MODEL TESTING
// =================

Cypress.Commands.add('testModelEndpoint', (modelName: string) => {
    const startTime = Date.now();

    return cy.request({
        method: 'POST',
        url: `/api/v1/e2e/model/${modelName}/test`,
        body: {
            test_prompt: 'Тестовий запит для перевірки моделі',
            timeout: 30000
        },
        failOnStatusCode: false,
        timeout: 60000
    }).then((response) => {
        const latency = Date.now() - startTime;

        return {
            success: response.status === 200 && response.body?.success,
            latency,
            response: response.body
        };
    });
});

Cypress.Commands.add('triggerFallback', (failModel: string) => {
    cy.log(`🔄 Triggering fallback by disabling: ${failModel}`);

    cy.request({
        method: 'POST',
        url: '/api/v1/e2e/mock/enable',
        body: {
            model: failModel,
            mode: 'fail',
            error_type: 'timeout'
        }
    });
});

Cypress.Commands.add('verifyFallbackActivated', (expectedModel: string) => {
    return cy.request('/api/v1/e2e/status').then((response) => {
        const activeModel = response.body?.active_model;
        cy.log(`Active model after fallback: ${activeModel}`);
        return activeModel === expectedModel;
    });
});

// =================
// REPORT VALIDATION
// =================

Cypress.Commands.add('validatePdfReport', (options = {}) => {
    const { checkWatermark = true, checkSignature = true } = options;

    cy.log('📄 Validating PDF report...');

    // Check PDF file exists
    cy.get('[data-testid="pdf-download-link"], a[href*=".pdf"]', { timeout: 30000 })
        .should('exist')
        .and('have.attr', 'href')
        .then((href) => {
            // Request the PDF
            cy.request({
                url: href as unknown as string,
                encoding: 'binary'
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.headers['content-type']).to.include('pdf');

                // Check file size (should be reasonable)
                expect(response.body.length).to.be.greaterThan(1000);

                if (checkWatermark) {
                    // PDF should contain watermark text (checking raw bytes for pattern)
                    const pdfString = response.body.toString();
                    // Note: In real implementation, use pdf-parse library
                    cy.log('Watermark validation: Placeholder check');
                }

                if (checkSignature) {
                    cy.log('Signature validation: Placeholder check');
                }
            });
        });

    cy.log('✅ PDF report validated');
});

Cypress.Commands.add('validateMarkdownReport', () => {
    cy.log('📝 Validating Markdown report...');

    cy.get('[data-testid="markdown-report-link"], a[href*=".md"]', { timeout: 30000 })
        .should('exist')
        .and('have.attr', 'href')
        .then((href) => {
            cy.request(href as unknown as string).then((response) => {
                expect(response.status).to.eq(200);

                const content = response.body;

                // Check required sections
                expect(content).to.include('# Звіт про тестування');
                expect(content).to.include('## Статус виконання');
                expect(content).to.include('## Логи');
                expect(content).to.include('## Технічні деталі');
            });
        });

    cy.log('✅ Markdown report validated');
});

Cypress.Commands.add('downloadReport', (type: 'pdf' | 'markdown') => {
    const selector = type === 'pdf'
        ? '[data-testid="pdf-download-link"]'
        : '[data-testid="markdown-report-link"]';

    return cy.get(selector)
        .should('have.attr', 'href')
        .then((href) => href as unknown as string);
});

// =================
// OPENSEARCH VALIDATION
// =================

Cypress.Commands.add('verifyOpenSearchLogs', (runId: string) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/e2e/opensearch/logs',
        body: { run_id: runId }
    }).then((response) => {
        return {
            found: response.body?.found || false,
            entries: response.body?.entries?.length || 0
        };
    });
});

Cypress.Commands.add('checkDataIndexed', (expectedCount: number) => {
    return cy.request('/api/v1/e2e/opensearch/count')
        .then((response) => {
            const count = response.body?.count || 0;
            const threshold = expectedCount * 0.95; // Allow 5% tolerance
            return count >= threshold;
        });
});

// =================
// NAVIGATION HELPERS
// =================

Cypress.Commands.add('navigateToDashboard', () => {
    cy.visit('/');
    cy.get('[data-testid="dashboard"], .dashboard-container', { timeout: 15000 })
        .should('be.visible');
});

Cypress.Commands.add('navigateToTestingLab', () => {
    cy.visit('/testing');
    cy.get('[data-testid="testing-lab"], .testing-view', { timeout: 15000 })
        .should('be.visible');
});

Cypress.Commands.add('navigateToOpenSearchDashboard', () => {
    cy.visit('/databases');
    cy.get('[data-testid="opensearch-tab"], [data-tab="opensearch"]', { timeout: 15000 })
        .click();
});

// =================
// WAIT HELPERS
// =================

Cypress.Commands.add('waitForApiResponse', (alias: string, timeout = 30000) => {
    return cy.wait(`@${alias}`, { timeout });
});

Cypress.Commands.add('waitForProcessingComplete', () => {
    // Poll status endpoint until complete
    const checkStatus = (attempts = 0) => {
        if (attempts > 60) {
            throw new Error('Processing timeout after 60 attempts');
        }

        return cy.request('/api/v1/e2e/processing/status').then((response) => {
            if (response.body?.status === 'complete') {
                return;
            }
            cy.wait(1000);
            checkStatus(attempts + 1);
        });
    };

    checkStatus();
});

// =================
// MOCK HELPERS
// =================

Cypress.Commands.add('enableMockMode', (model: string) => {
    cy.request({
        method: 'POST',
        url: '/api/v1/e2e/mock/enable',
        body: { model, mode: 'mock' }
    });
});

Cypress.Commands.add('disableMockMode', (model: string) => {
    cy.request({
        method: 'POST',
        url: '/api/v1/e2e/mock/disable',
        body: { model }
    });
});

export { };
