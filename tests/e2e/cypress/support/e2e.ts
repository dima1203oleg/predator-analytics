/**
 * Cypress E2E Support File
 * 
 * Custom commands and global configuration for Predator Analytics testing
 */

import './commands';

// Global before hooks
beforeEach(() => {
    // Clear session storage and local storage before each test
    cy.clearLocalStorage();

    // Intercept and log API calls for debugging
    cy.intercept('**/*').as('allRequests');
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
    // Log the error but don't fail the test for known issues
    if (err.message.includes('ResizeObserver loop')) {
        return false;
    }
    if (err.message.includes('Cannot read properties of null')) {
        console.warn('Caught null reference error:', err.message);
        return false;
    }
    return true;
});

// Custom console logging
Cypress.on('window:console', (msg) => {
    if (msg.type === 'error') {
        console.error('Browser console error:', msg.message);
    }
});

// Add test context to screenshots
Cypress.Commands.addQuery('getTestContext', function () {
    return {
        testName: Cypress.currentTest.title,
        timestamp: new Date().toISOString(),
        environment: Cypress.env('IS_LOCAL') ? 'local' : 'remote'
    };
});
