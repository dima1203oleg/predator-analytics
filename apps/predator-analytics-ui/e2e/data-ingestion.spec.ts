import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Data Ingestion Terminal', () => {
  test('should handle file upload attempt', async ({ page }) => {
    await page.goto('/ingestion');

    // Wait for the main title
    await expect(page.locator('text=ЦЕНТР ІМПОРТУ ДОКУМЕНТІВ')).toBeVisible();

    // Create a dummy Excel file for testing
    const testFilePath = path.join(process.cwd(), 'test_declarations.xlsx');
    fs.writeFileSync(testFilePath, 'dummy content');

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for the file to be recognized in the UI
    await expect(page.locator('text=test_declarations.xlsx')).toBeVisible();
    await expect(page.locator('button', { hasText: 'ПОЧАТИ ІМПОРТ' })).toBeVisible();

    // Click "Start Import"
    await page.click('button:has-text("ПОЧАТИ ІМПОРТ")');

    // Since the backend is unreachable, it should display an error instead of getting stuck
    // Wait for either the error message or the progress bar (in case backend miraculously works)
    await expect(page.locator('text=Не вдалося розпочати імпорт').or(page.locator('text=Network Error')).or(page.locator('text=0%'))).toBeVisible({ timeout: 10000 });
    
    // Clean up
    fs.unlinkSync(testFilePath);
  });
});
