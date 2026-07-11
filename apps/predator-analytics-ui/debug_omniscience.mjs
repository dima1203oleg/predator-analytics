import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Встановлюємо стейт щоб пропустити Onboarding
    await page.goto(`http://localhost:3030`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem('predator_onboarding_completed', 'true');
        sessionStorage.setItem('predator_access_token', 'mock_admin_token');
        sessionStorage.setItem('predator_current_role', 'admin');
    });

    console.log(`[E2E] Відкриття http://localhost:3030/omniscience...`);
    await page.goto(`http://localhost:3030/omniscience`, { waitUntil: 'networkidle' });
    
    // Take a screenshot
    await page.screenshot({ path: 'omniscience_debug.png' });
    console.log("Screenshot saved to omniscience_debug.png");

    const content = await page.content();
    if (content.includes("Нексус Всезнання") || content.includes("ЯДРО_СИСТЕМИ")) {
      console.log("SUCCESS: Omniscience view rendered.");
    } else {
      console.log("FAILURE: Omniscience view did not render as expected.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
