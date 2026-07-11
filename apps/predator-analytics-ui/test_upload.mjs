import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log("Starting...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to main page to get past boot screen
  await page.goto('http://localhost:3030/auth/login', { waitUntil: 'networkidle' });
  
  // Click anywhere to play video, then press Escape to skip
  await page.click('body');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  try {
    // Fill login
    await page.fill('input[placeholder="ОПЕРАТИВНИЙ КОД (ЛОГІН)"]', 'admin');
    await page.fill('input[placeholder="КРИПТО-КЛЮЧ (ПАРОЛЬ)"]', 'admin123');
    await page.click('button:has-text("УВІЙТИ В СИСТЕМУ")');
    console.log("Logged in");
    
    // Wait for the scan and transition
    await page.waitForTimeout(5000);
    
    // Now we should be logged in, navigate to ingestion
    await page.goto('http://localhost:3030/ingestion', { waitUntil: 'networkidle' });
    
    console.log("On ingestion page, looking for input file...");
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    
    // Set file
    const testFilePath = '/Users/dima1203/Desktop/Березень_2024_repacked.xlsx';
    await page.setInputFiles('input[type="file"]', testFilePath);
    console.log("File selected");
    
    await page.waitForTimeout(1000);
    
    // Click import
    await page.click('button:has-text("ПОЧАТИ ІМПОРТ")');
    console.log("Clicked import");
    
    // Wait for error or success
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'upload_result.png' });
    console.log("Screenshot saved to upload_result.png");
    
  } catch (e) {
    console.error("Error:", e);
    await page.screenshot({ path: 'upload_error.png' });
  }
  
  await browser.close();
})();
