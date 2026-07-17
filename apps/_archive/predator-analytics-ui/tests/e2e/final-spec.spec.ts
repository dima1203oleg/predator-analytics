import { test, expect } from '@playwright/test';

test.describe('Final Spec Elite Views (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AdminHub
    await page.goto('/admin');
  });

  test('should load WhatIfSimulatorView when navigating to its tab', async ({ page }) => {
    // Navigate to the "AI_LAB" category or specific tab
    await page.click('text="WHAT-IF_СИМУЛЯТОР"');
    await expect(page.locator('text="СИМУЛЯТОР WHAT-IF"')).toBeVisible();
    await expect(page.locator('text="ЗАПУСТИТИ MONTE CARLO"')).toBeVisible();
  });

  test('should load DigitalTwinView', async ({ page }) => {
    await page.click('text="ЦИФРОВИЙ_ДВІЙНИК"');
    await expect(page.locator('text="ЦИФРОВИЙ ДВІЙНИК"')).toBeVisible();
    await expect(page.locator('text="3D МАПА ПІДПРИЄМСТВА"')).toBeVisible();
  });

  test('should load RegulatoryRadarView', async ({ page }) => {
    await page.click('text="REGULATORY_RADAR"');
    await expect(page.locator('text="РЕГУЛЯТОРНИЙ РАДАР"')).toBeVisible();
    await expect(page.locator('text="ЗМІНИ В ЗАКОНОДАВСТВІ"')).toBeVisible();
  });

  test('should load ConnectionExplorer3DView', async ({ page }) => {
    await page.click('text="3D_ГРАФ_ЗВ\'ЯЗКІВ"');
    await expect(page.locator('text="3D ПРОСТІР ЗВ\'ЯЗКІВ"')).toBeVisible();
    await expect(page.locator('text="THREE.JS CANVAS VIEW"')).toBeVisible();
  });

  test('should load PanicControlView and trigger Ghost Mode', async ({ page }) => {
    await page.click('text="PANIC_CONTROL"');
    await expect(page.locator('text="ПРЕМІУМ БЕЗПЕКА"')).toBeVisible();
    await expect(page.locator('text="DEAD MAN\'S"')).toBeVisible();
    
    // Simulate clicking Ghost Mode
    const ghostButton = page.locator('text="АКТИВУВАТИ GHOST"');
    await expect(ghostButton).toBeVisible();
    await ghostButton.click();
    
    // Verify Protocol Init
    await expect(page.locator('text="ПРОТОКОЛ [GHOST] ІНІЦІЙОВАНО"')).toBeVisible();
  });

  test('should load PluginEcosystemView', async ({ page }) => {
    await page.click('text="ЕКОСИСТЕМА_ПЛАГІНІВ"');
    await expect(page.locator('text="ЕКОСИСТЕМА ПЛАГІНІВ"')).toBeVisible();
    await expect(page.locator('text="OSINT_TELEGRAM_SCRAPER"')).toBeVisible();
  });
});
