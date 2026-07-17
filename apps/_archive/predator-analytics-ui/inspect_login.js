const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3030/login');
  // wait for email input
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    console.log('Email selector: input[type="email"]');
  } catch (e) {
    console.error('Email input not found');
  }
  try {
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    console.log('Password selector: input[type="password"]');
  } catch (e) {
    console.error('Password input not found');
  }
  await browser.close();
})();
