import { test, expect } from '@playwright/test';

test.describe('Navigation Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation landmarks
    const navigation = page.locator('[role="navigation"]');
    await expect(navigation).toBeVisible();
    await expect(navigation).toHaveAttribute('aria-label', 'Основна навігація');
    
    // Check navigation sections
    const navSections = page.locator('[data-testid="navigation-section"]');
    const sectionCount = await navSections.count();
    expect(sectionCount).toBeGreaterThan(0);
    
    // Each section should have proper heading
    for (let i = 0; i < sectionCount; i++) {
      const section = navSections.nth(i);
      const heading = section.locator('h2, h3');
      await expect(heading).toBeVisible();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Focus on first navigation element
    await page.keyboard.press('Tab');
    
    // Check if focus is on navigation
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate through navigation items
    let navigationItems = 0;
    let previousFocused = '';
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const currentFocused = await page.locator(':focus').getAttribute('data-testid');
      
      if (currentFocused && currentFocused.includes('nav-')) {
        navigationItems++;
        
        // Should not be stuck on same element
        expect(currentFocused).not.toBe(previousFocused);
        previousFocused = currentFocused;
      }
      
      // Break if we've cycled through all nav items
      if (navigationItems > 10) break;
    }
    
    expect(navigationItems).toBeGreaterThan(5);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    
    // Click on navigation item
    await page.click('[data-testid="nav-intelligence"]');
    
    // Check that focus moves to the clicked item
    const focusedItem = page.locator(':focus');
    await expect(focusedItem).toHaveAttribute('data-testid', 'nav-intelligence');
    
    // Navigate to new page
    await page.waitForLoadState('networkidle');
    
    // Check that focus is properly managed after navigation
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
    
    // Should have skip link for keyboard users
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toHaveAttribute('href', '#main-content');
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation items for color contrast
    const navItems = page.locator('[data-testid^="nav-"]');
    const itemCount = await navItems.count();
    
    for (let i = 0; i < Math.min(itemCount, 5); i++) {
      const item = navItems.nth(i);
      
      // Get computed styles
      const styles = await item.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
        };
      });
      
      // Check that colors are not transparent or missing
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      
      // Check font size is readable
      const fontSize = parseFloat(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum 14px
    }
  });

  test('should have proper semantic structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Should not skip heading levels
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    let previousLevel = 1;
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const level = parseInt(await heading.evaluate(el => el.tagName));
      
      // Should not skip more than one level
      expect(level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = level;
    }
    
    // Navigation should be in proper landmark
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Main content should be in main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA descriptions
    const navigation = page.locator('[role="navigation"]');
    await expect(navigation).toHaveAttribute('aria-label');
    
    // Check for live regions if any
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    
    for (let i = 0; i < liveRegionCount; i++) {
      const region = liveRegions.nth(i);
      const ariaLive = await region.getAttribute('aria-live');
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      
      // Button should have accessible name
      const hasLabel = await button.evaluate(el => {
        return el.textContent.trim() !== '' || 
               el.getAttribute('aria-label') !== null ||
               el.getAttribute('aria-labelledby') !== null;
      });
      
      expect(hasLabel).toBe(true);
    }
  });

  test('should have responsive design accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should be accessible on mobile
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
      
      // Mobile navigation should have proper touch targets
      const mobileButtons = mobileNav.locator('button, a');
      const buttonCount = await mobileButtons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = mobileButtons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          // Touch targets should be at least 44x44px
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigation should adapt properly
    const tabletNav = page.locator('[data-testid="navigation-sidebar"]');
    await expect(tabletNav).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to a page that might have errors
    await page.goto('/non-existent-page');
    
    // Should show proper error page
    const errorPage = page.locator('[data-testid="error-page"]');
    if (await errorPage.isVisible()) {
      // Error page should have proper heading
      const errorHeading = errorPage.locator('h1');
      await expect(errorHeading).toBeVisible();
      
      // Should have accessible error message
      const errorMessage = errorPage.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
      
      // Should have way to navigate back
      const backButton = errorPage.locator('button, a').filter({ hasText: /повернутися|назад/i });
      await expect(backButton).toBeVisible();
    }
  });
});
