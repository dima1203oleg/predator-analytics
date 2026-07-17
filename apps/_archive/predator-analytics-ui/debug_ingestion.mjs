import { chromium } from 'playwright';

const UI_URL = 'http://localhost:3030';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

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
    
    await page.waitForTimeout(5000); // Wait for scanning
    await page.fill('input[placeholder="------"]', '123456');
    await page.click('button:has-text("АВТОРИЗАЦІЯ")');
    
    await page.waitForURL(`**/admin/command**`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    console.log('Successfully reached /admin/command');
    
    await page.goto(`${UI_URL}/ingestion`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log('Current URL is:', url);
    
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('ЦЕНТР ІМПОРТУ ДОКУМЕНТІВ')) {
        console.log('SUCCESS: Ingestion text found!');
    } else {
        console.log('FAILURE: Ingestion text not found. HTML:');
        console.log(html.substring(0, 5000));
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
