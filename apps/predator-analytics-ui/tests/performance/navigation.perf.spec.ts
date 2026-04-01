import { test, expect } from '@playwright/test';

test.describe('Navigation Performance', () => {
  test('should load main navigation within performance thresholds', async ({ page }) => {
    // Start performance measurement
    const navigationStart = await page.evaluate(() => performance.now());
    
    // Navigate to main page
    await page.goto('/');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalNavigationTime: performance.now() - (performance.timeOrigin || 0),
      };
    });
    
    // Performance assertions
    expect(metrics.domContentLoaded).toBeLessThan(500); // DOM ready in < 500ms
    expect(metrics.loadComplete).toBeLessThan(2000); // Full load in < 2s
    expect(metrics.firstContentfulPaint).toBeLessThan(1000); // First paint in < 1s
    expect(metrics.totalNavigationTime).toBeLessThan(3000); // Total time < 3s
  });

  test('should render navigation items efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Measure render time for navigation
    const renderStart = await page.evaluate(() => performance.now());
    
    // Wait for navigation to be fully rendered
    await page.waitForSelector('[data-testid="navigation-sidebar"]');
    await page.waitForSelector('[data-testid="global-layer"]');
    
    const renderEnd = await page.evaluate(() => performance.now());
    const renderTime = renderEnd - renderStart;
    
    expect(renderTime).toBeLessThan(100); // Navigation should render in < 100ms
  });

  test('should handle navigation transitions smoothly', async ({ page }) => {
    await page.goto('/');
    
    // Measure transition time between sections
    const transitionStart = await page.evaluate(() => performance.now());
    
    // Click on different navigation sections
    await page.click('[data-testid="nav-intelligence"]');
    await page.waitForLoadState('networkidle');
    
    const transitionEnd = await page.evaluate(() => performance.now());
    const transitionTime = transitionEnd - transitionStart;
    
    expect(transitionTime).toBeLessThan(800); // Transitions should be < 800ms
    
    // Check for smooth animations
    const hasSmoothTransitions = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.transition !== 'none' || style.animation !== 'none';
    });
    
    expect(hasSmoothTransitions).toBe(true);
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    await page.goto('/intelligence');
    
    // Simulate large dataset loading
    await page.evaluate(() => {
      // Mock large dataset
      window.mockLargeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        label: `Item ${i}`,
        value: Math.random() * 100,
      }));
    });
    
    const performanceStart = await page.evaluate(() => performance.now());
    
    // Trigger virtual list rendering
    await page.click('[data-testid="load-large-dataset"]');
    
    // Wait for virtual list to be ready
    await page.waitForSelector('[data-testid="virtual-list-ready"]');
    
    const performanceEnd = await page.evaluate(() => performance.now());
    const renderTime = performanceEnd - performanceStart;
    
    expect(renderTime).toBeLessThan(200); // Large dataset should render in < 200ms
    
    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Memory should be reasonable (less than 100MB for demo)
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
  });

  test('should handle concurrent navigation efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Simulate rapid navigation clicks
    const startTime = await page.evaluate(() => performance.now());
    
    // Click multiple navigation items rapidly
    const navItems = [
      '[data-testid="nav-command-center"]',
      '[data-testid="nav-intelligence"]',
      '[data-testid="nav-trade-logistics"]',
      '[data-testid="nav-clients"]',
    ];
    
    for (const selector of navItems) {
      await page.click(selector);
      await page.waitForTimeout(50); // Small delay between clicks
    }
    
    // Wait for final navigation to complete
    await page.waitForLoadState('networkidle');
    
    const endTime = await page.evaluate(() => performance.now());
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(2000); // Concurrent navigation should complete in < 2s
    
    // Check for no memory leaks
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    expect(finalMemory).toBeLessThan(150 * 1024 * 1024); // Should not exceed 150MB
  });
});
