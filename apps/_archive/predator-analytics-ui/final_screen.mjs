import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3030/elite-command');
  
  // Wait longer to ensure models are fully downloaded and the canvas is rendered
  await page.waitForTimeout(12000); 
  
  await page.screenshot({ path: 'final_success.png' });
  await browser.close();
})();
