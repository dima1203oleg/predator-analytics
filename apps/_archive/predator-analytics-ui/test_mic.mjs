import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
  const context = await browser.newContext({
    permissions: ['microphone'],
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[STT]') || text.includes('[TTS]') || text.includes('[Chat]')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });
  
  page.on('pageerror', (err) => {
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  try {
    console.log('1. Navigating...');
    await page.goto('http://localhost:3030/search', { waitUntil: 'load' });
    await page.waitForTimeout(4000);

    console.log('2. Looking for mic button...');
    // Use aria-label which we set in our rewrite
    let micButton = page.locator('button[aria-label="Почати запис голосу"]');
    let count = await micButton.count();
    
    if (count === 0) {
      // Fallback: find by gradient class
      micButton = page.locator('button.rounded-full').filter({ has: page.locator('svg') }).last();
      count = await micButton.count();
    }
    
    console.log(`   Found ${count} mic button(s)`);
    
    if (count === 0) {
      // Dump HTML to debug
      const html = await page.content();
      const fs = await import('fs');
      fs.writeFileSync('debug_dom.html', html);
      console.log('   ❌ No mic button found. DOM dumped to debug_dom.html');
      await browser.close();
      process.exit(1);
    }

    await micButton.first().waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✅ Mic button visible');

    console.log('3. Click START...');
    await micButton.first().click({ force: true });
    
    // Wait for the UI to actually show listening state
    try {
      await page.locator('text=СЛУХАЮ').waitFor({ state: 'visible', timeout: 10000 });
      console.log('   СЛУХАЮ visible: ✅ YES');
    } catch (e) {
      console.log('   СЛУХАЮ visible: ❌ NO');
    }

    console.log('4. Wait 2s (simulating speech)...');
    await page.waitForTimeout(2000);

    console.log('5. Click STOP...');
    const stopButton = page.locator('button[aria-label="Зупинити запис"]');
    await stopButton.first().click({ force: true });
    await page.waitForTimeout(5000);

    // Check for processing/response
    try {
      const responseEl = page.locator('.font-medium').first();
      await responseEl.waitFor({ state: 'visible', timeout: 10000 });
      const responseText = await responseEl.innerText();
      console.log(`   AI Response: "${responseText}"`);
    } catch (e) {
      console.log(`   AI Response: none (timeout or empty recording)`);
    }

    console.log('\n✅ Test complete');
  } catch (err) {
    console.error('Test failed:', err.message || err);
  } finally {
    await browser.close();
  }
})();
