import { chromium } from 'playwright';

const UI_URL = 'http://localhost:3030';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', response => {
    if (response.url().includes('/auth/login') || response.status() >= 400) {
      console.log(`[NETWORK] ${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${UI_URL}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem('predator_onboarding_completed', 'true');
    });

    await page.goto(`${UI_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder="IDENTIFIER"]');
    await page.fill('input[placeholder="IDENTIFIER"]', 'admin');
    await page.fill('input[placeholder="PASSPHRASE"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for whatever appears next
    await page.waitForTimeout(5000);
    
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('placeholder="------"')) {
      console.log('MFA INPUT APPEARED');
      await page.fill('input[placeholder="------"]', '123456');
      await page.click('button:has-text("АВТОРИЗАЦІЯ")');
      await page.waitForTimeout(5000);
      const afterAuthHtml = await page.evaluate(() => document.body.innerHTML);
      console.log(afterAuthHtml.substring(0, 1000));
    } else {
      console.log('MFA INPUT DID NOT APPEAR. Current step is probably not MFA.');
      console.log(html.substring(0, 1000));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
