import { test, expect } from '@playwright/test';

test('verify graph DOM', async ({ page }) => {
  await page.goto('http://localhost:3030/graph');
  
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log("HTML length:", html.length);
  
  const text = await page.innerText('body');
  console.log("BODY TEXT EXTRACT:\n", text.substring(0, 1000));
  
  await page.screenshot({ path: '/Users/dima1203/.gemini/antigravity-ide/brain/ab92a668-0fb3-4014-bcf7-f064e146b299/graph_hub_dom.png', fullPage: true });
  console.log("Screenshot saved.");
});
