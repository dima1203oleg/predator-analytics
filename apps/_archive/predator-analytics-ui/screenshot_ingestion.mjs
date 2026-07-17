import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3030/ingestion', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'ingestion_error.png' });
  await browser.close();
})();
