import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
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
    await page.waitForTimeout(1500);

    // Check state
    const listeningText = await page.locator('text=СЛУХАЮ').count();
    console.log(`   СЛУХАЮ visible: ${listeningText > 0 ? '✅ YES' : '❌ NO'}`);

    console.log('4. Wait 2s (simulating speech)...');
    await page.waitForTimeout(2000);

    console.log('5. Click STOP...');
    await micButton.first().click({ force: true });
    await page.waitForTimeout(5000);

    // Check for processing/response
    const responseEl = page.locator('.font-medium').first();
    const responseText = await responseEl.innerText().catch(() => 'none');
    console.log(`   AI Response: "${responseText}"`);

    console.log('\n✅ Test complete');
  } catch (err) {
    console.error('Test failed:', err.message || err);
  } finally {
    await browser.close();
  }
})();
