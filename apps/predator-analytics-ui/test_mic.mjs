import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['microphone'], // Grant microphone access
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:3030/search...');
    await page.goto('http://localhost:3030/search', { waitUntil: 'load' });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'mic_debug_before.png' });
    console.log('Took before screenshot');

    // Find the button by its exact classes or by its wrapper div
    // The wrapper is div.fixed.bottom-8.right-\\[120px\\]
    const micButton = page.locator('.from-rose-600');
    
    const count = await micButton.count();
    console.log(`Found ${count} mic buttons.`);
    
    if (count > 0) {
       await micButton.first().click({ force: true });
       console.log('Clicked!');
       await page.waitForTimeout(2000);
       await page.screenshot({ path: 'mic_debug_after.png' });
       console.log('Took after screenshot');
       
       // Log any toast messages or text
       const toasts = await page.locator('.go3958317564').allInnerTexts(); // typical react-hot-toast class
       console.log('Toasts:', toasts);
       
       const text = await page.locator('text=СЛУХАЮ...').count();
       console.log('СЛУХАЮ... text count:', text);
    } else {
       console.log('Could not find mic button. Dumping html...');
       const html = await page.content();
       fs.writeFileSync('dom_dump.html', html);
    }
  } catch (err) {
    console.error('Test script failed:', err);
  } finally {
    await browser.close();
  }
})();
