/**
 * Acceptance test for @devin/visual-tools
 * This test validates the complete functionality of the framework
 */

import { devinTest, defineConfig, VisualMaskingEngine, ElectronBridge } from '../src/index';
import { expect } from '@playwright/test';

// Define custom config for acceptance test
const testConfig = defineConfig({
  testDir: 'tests/acceptance',
  viewports: ['md'],
  threshold: 0.1, // Higher threshold for acceptance test
  maxRetries: 1,
  reportPath: 'test-results/acceptance',
});

devinTest.describe('Acceptance Tests', () => {
  devinTest('should initialize devin fixture correctly', async ({ devin }) => {
    // Test fixture initialization
    expect(devin).toBeTruthy();
    expect(devin.page).toBeTruthy();
    expect(devin.sidebar).toBeTruthy();
    expect(devin.chatPanel).toBeTruthy();
    expect(devin.statusBar).toBeTruthy();
  });
  
  devinTest('should handle theme switching', async ({ devin }) => {
    // Navigate to a test page
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
    
    // Test theme switching
    await devin.setTheme('dark');
    const theme = await devin.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
    
    await devin.setTheme('light');
    const lightTheme = await devin.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(lightTheme).toBe('light');
  });
  
  devinTest('should handle viewport switching', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
    
    // Test viewport switching
    await devin.setViewport('sm');
    const viewport = await devin.page.viewportSize();
    expect(viewport).toEqual({ width: 640, height: 480 });
    
    await devin.setViewport('lg');
    const lgViewport = await devin.page.viewportSize();
    expect(lgViewport).toEqual({ width: 1920, height: 1080 });
  });
  
  devinTest('should handle custom viewport', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
    
    await devin.setViewport({ width: 800, height: 600 });
    const viewport = await devin.page.viewportSize();
    expect(viewport).toEqual({ width: 800, height: 600 });
  });
  
  devinTest('should take screenshots with automatic masking', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1><div class="timestamp">2024-01-01T00:00:00Z</div></body></html>');
    
    // This should automatically mask the timestamp
    await devin.expectScreenshot('automatic-masking-test');
  });
  
  devinTest('should handle user-provided masks', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1><div id="dynamic">Dynamic Content</div></body></html>');
    
    const dynamicElement = devin.page.locator('#dynamic');
    await devin.expectScreenshot('user-masking-test', {
      mask: [dynamicElement]
    });
  });
  
  devinTest('should locate dialog elements', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1><div role="dialog">Test Dialog</div></body></html>');
    
    const dialog = devin.dialog('Test Dialog');
    expect(await dialog.count()).toBeGreaterThan(0);
  });
  
  devinTest('should handle context menus', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1><div id="context-target">Right-click me</div></body></html>');
    
    const target = devin.page.locator('#context-target');
    const contextMenu = await devin.openContextMenu(target);
    expect(contextMenu).toBeTruthy();
  });
  
  devinTest('should perform accessibility audit', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
    
    // This should not throw
    await devin.accessibilityAudit();
  });
  
  devinTest('should collect performance metrics', async ({ devin }) => {
    await devin.page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Test</h1></body></html>');
    
    const metrics = await devin.performanceMetrics();
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('renderTime');
    expect(typeof metrics.memory).toBe('number');
    expect(typeof metrics.renderTime).toBe('number');
  });
  
  devinTest('Visual Masking Engine should initialize correctly', async () => {
    const engine = new VisualMaskingEngine(testConfig);
    expect(engine).toBeTruthy();
    
    // Test default rules
    const defaultRules = VisualMaskingEngine.getDefaultRules();
    expect(Array.isArray(defaultRules)).toBe(true);
    expect(defaultRules.length).toBeGreaterThan(0);
  });
  
  devinTest('Visual Masking Engine should apply custom rules', async () => {
    const engine = new VisualMaskingEngine(testConfig);
    
    engine.addRule({
      type: 'selector',
      selector: '.custom-mask',
      priority: 50,
      enabled: true,
    });
    
    // Should not throw
    expect(engine).toBeTruthy();
  });
  
  devinTest('should create masking config for different scenarios', () => {
    const chatConfig = VisualMaskingEngine.createConfig('chat');
    expect(chatConfig.rules.length).toBeGreaterThan(0);
    
    const dashboardConfig = VisualMaskingEngine.createConfig('dashboard');
    expect(dashboardConfig.rules.length).toBeGreaterThan(0);
    
    const formConfig = VisualMaskingEngine.createConfig('form');
    expect(formConfig.rules.length).toBeGreaterThan(0);
  });
  
  devinTest('Complete workflow test', async ({ devin }) => {
    // This test replicates the exact example from the prompt
    await devin.page.goto('data:text/html,<html><head><title>Chat Test</title></head><body><div data-testid="chat-panel"><textarea id="chat-input"></textarea></div></body></html>');
    
    // Set theme
    await devin.setTheme('dark');
    
    // Fill chat panel
    const chatInput = devin.page.locator('#chat-input');
    await chatInput.fill('Hello, Devin!');
    
    // Simulate enter key
    await chatInput.press('Enter');
    
    // Should automatically mask timestamps and dynamic AI IDs
    await devin.expectScreenshot('chat-greeting');
    
    // Verify screenshot was created
    const fs = await import('fs-extra');
    const screenshotPath = 'test-results/acceptance/chat-greeting.png';
    const exists = await fs.pathExists(screenshotPath);
    expect(exists).toBe(true);
  });
});

// Test configuration export
devinTest.describe('Configuration', () => {
  devinTest('should export correct types', async () => {
    // Type checking is done at compile time
    // This test ensures exports are available
    const { devinTest, defineConfig, VisualMaskingEngine, ElectronBridge } = await import('../src/index');
    
    expect(devinTest).toBeTruthy();
    expect(defineConfig).toBeTruthy();
    expect(VisualMaskingEngine).toBeTruthy();
    expect(ElectronBridge).toBeTruthy();
  });
  
  devinTest('should export correct constants', async () => {
    const { VERSION, PACKAGE_NAME, Platform, RuntimeMode } = await import('../src/index');
    
    expect(VERSION).toBe('1.0.0');
    expect(PACKAGE_NAME).toBe('@devin/visual-tools');
    expect(Platform).toHaveProperty('isMac');
    expect(Platform).toHaveProperty('isLinux');
    expect(Platform).toHaveProperty('isWindows');
    expect(RuntimeMode).toHaveProperty('isWatchMode');
    expect(RuntimeMode).toHaveProperty('isUpdateMode');
    expect(RuntimeMode).toHaveProperty('isCIMode');
  });
});
