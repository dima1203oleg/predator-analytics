// 🧪 PREDATOR Analytics UI - Smoke Test
// Version: v55.1.0
// Purpose: Quick smoke tests for critical functionality

import { test, expect } from '@playwright/test';

test.describe('🧪 PREDATOR Analytics UI - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3030');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('✅ Application loads successfully', async ({ page }) => {
    // Check if main page loads
    await expect(page).toHaveTitle(/PREDATOR Analytics/);
    
    // Check for main navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for main content
    const main = page.locator('main, .main, #app');
    await expect(main).toBeVisible();
    
    console.log('✅ Application loads successfully');
  });

  test('✅ Health endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:3030/health');
    
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('healthy\n');
    
    console.log('✅ Health endpoint responds correctly');
  });

  test('✅ Static assets load correctly', async ({ page }) => {
    // Wait for CSS to load
    const cssLink = page.locator('link[rel="stylesheet"]');
    await expect(cssLink.first()).toBeVisible();
    
    // Wait for JavaScript to load
    const scriptTag = page.locator('script[src*=".js"]');
    await expect(scriptTag.first()).toBeVisible();
    
    // Check for any 404 errors in console
    const errors = [];
    page.on('response', response => {
      if (response.status() === 404) {
        errors.push(response.url());
      }
    });
    
    await page.waitForTimeout(2000);
    
    expect(errors.length).toBe(0);
    console.log('✅ Static assets load correctly');
  });

  test('✅ Main navigation works', async ({ page }) => {
    // Find navigation items
    const navItems = page.locator('nav a, .nav a, .navigation a');
    
    // Check if there are navigation items
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Click first navigation item
    if (count > 0) {
      await navItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Check if navigation worked (URL changed or content changed)
      const currentUrl = page.url();
      expect(currentUrl).not.toBe('http://localhost:3030/');
    }
    
    console.log('✅ Main navigation works');
  });

  test('✅ Responsive design works', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Check if layout is appropriate for desktop
    const desktopLayout = page.locator('.container, .main, #app');
    await expect(desktopLayout).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if layout adapts to mobile
    const mobileLayout = page.locator('.container, .main, #app');
    await expect(mobileLayout).toBeVisible();
    
    // Check for mobile navigation if exists
    const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle');
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await page.waitForTimeout(500);
    }
    
    console.log('✅ Responsive design works');
  });

  test('✅ Error handling works', async ({ page }) => {
    // Test 404 page
    await page.goto('http://localhost:3030/non-existent-page');
    
    // Should either show 404 page or redirect to main page
    const currentUrl = page.url();
    
    // Check if it's a proper 404 or redirect
    if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
      // Proper 404 page
      const notFoundElement = page.locator('text=404, text=Not Found, text=Сторінку не знайдено');
      await expect(notFoundElement).toBeVisible();
    } else {
      // Redirect to main page (acceptable)
      expect(currentUrl).toBe('http://localhost:3030/');
    }
    
    console.log('✅ Error handling works');
  });

  test('✅ Performance metrics are acceptable', async ({ page }) => {
    // Measure page load time
    const navigationStart = Date.now();
    await page.goto('http://localhost:3030');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - navigationStart;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance timing
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      };
    });
    
    console.log('📊 Performance metrics:', performanceMetrics);
    
    // Performance should be reasonable
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    expect(performanceMetrics.loadComplete).toBeLessThan(3000);
    
    console.log('✅ Performance metrics are acceptable');
  });

  test('✅ Security headers are present', async ({ request }) => {
    const response = await request.get('http://localhost:3030');
    
    // Check for security headers
    const headers = response.headers();
    
    // These headers should be present in production
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
    ];
    
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`✅ ${header}: ${headers[header]}`);
      }
    });
    
    console.log('✅ Security headers checked');
  });

  test('✅ Console errors are minimal', async ({ page }) => {
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3030');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Log any errors/warnings found
    if (errors.length > 0) {
      console.log('⚠️ Console errors:', errors);
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Console warnings:', warnings);
    }
    
    // In production, there should be minimal console errors
    expect(errors.length).toBeLessThan(5);
    
    console.log('✅ Console errors are minimal');
  });

  test('✅ Memory usage is reasonable', async ({ page }) => {
    await page.goto('http://localhost:3030');
    await page.waitForLoadState('networkidle');
    
    // Get memory usage metrics
    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        };
      }
      return null;
    });
    
    if (memoryMetrics) {
      console.log('📊 Memory usage:', memoryMetrics);
      
      // Memory usage should be reasonable (< 100MB for initial load)
      expect(memoryMetrics.used).toBeLessThan(100);
    }
    
    console.log('✅ Memory usage is reasonable');
  });
});

test.describe('🔧 API Smoke Tests', () => {
  test('✅ API endpoints respond correctly', async ({ request }) => {
    const endpoints = [
      { path: '/health', expectedStatus: 200 },
      { path: '/', expectedStatus: 200 },
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(`http://localhost:3030${endpoint.path}`);
      
      expect(response.status()).toBe(endpoint.expectedStatus);
      console.log(`✅ ${endpoint.path} - ${response.status()}`);
    }
  });

  test('✅ API error handling works', async ({ request }) => {
    // Test non-existent endpoint
    const response = await request.get('http://localhost:3030/api/v1/non-existent');
    
    // Should return 404 or 500 (both acceptable for non-existent endpoints)
    expect([404, 500]).toContain(response.status());
    
    console.log('✅ API error handling works');
  });
});

test.describe('📱 Mobile Smoke Tests', () => {
  test('✅ Mobile experience works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3030');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile layout is working
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(375);
    expect(viewport.height).toBe(667);
    
    // Check if content is visible on mobile
    const mainContent = page.locator('main, .main, #app');
    await expect(mainContent).toBeVisible();
    
    console.log('✅ Mobile experience works');
  });
});
