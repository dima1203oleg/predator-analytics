import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    consoleLogs.push(`[pageerror] ${err.message}\n${err.stack}`);
  });

  const pendingRequests = new Set();
  page.on('request', request => {
    pendingRequests.add(request.url());
  });
  page.on('requestfinished', request => {
    pendingRequests.delete(request.url());
  });
  page.on('requestfailed', request => {
    pendingRequests.delete(request.url());
    consoleLogs.push(`[requestfailed] ${request.url()} - ${request.failure()?.errorText || 'unknown error'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      consoleLogs.push(`[response-error] ${response.url()} - ${response.status()}`);
    }
  });

  // Log pending requests and loader text periodically
  const interval = setInterval(async () => {
    if (pendingRequests.size > 0) {
      console.log('Pending requests:', Array.from(pendingRequests));
    } else {
      console.log('No pending requests.');
    }
    try {
      const loaderText = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div, span, p'));
        const loaderEl = els.find(el => el.textContent && el.textContent.includes('ЗАВАНТАЖЕННЯ АКТИВІВ PREDATOR') && (!el.children || el.children.length === 0));
        return loaderEl ? loaderEl.textContent.trim() : 'Loader not found';
      });
      console.log('Loader text:', loaderText);
    } catch (e) {
      console.log('Failed to read loader text:', e.message);
    }
  }, 2000);

  try {
    console.log('Navigating to http://localhost:3030/elite-command...');
    await page.goto('http://localhost:3030/elite-command', { waitUntil: 'load', timeout: 20000 });
    
    console.log('Waiting 30 seconds for 3D room, console, skybox, and spaceships to load...');
    await page.waitForTimeout(30000);

    console.log('Current URL after loading:', page.url());

    // Save screenshot
    const screenshotPath = './inspect_command_center.png';
    try {
      await page.screenshot({ path: screenshotPath, timeout: 5000 });
      console.log(`Saved screenshot to ${screenshotPath}`);
    } catch (e) {
      console.warn(`[Warning] Failed to save screenshot: ${e.message}`);
    }

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    clearInterval(interval);
    await browser.close();
    const logsPath = './console_logs.txt';
    fs.writeFileSync(logsPath, consoleLogs.join('\n'));
    console.log(`Saved console logs to ${logsPath}`);
  }
}

main();
