/**
 * PREDATOR DOM Audit Script
 * Перевіряє через Playwright, що UI відображає реальні дані з API
 * без симуляцій та заглушок.
 */
import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3030';
const TIMEOUT = 15000;

// Сторінки для перевірки
const PAGES_TO_CHECK = [
  { path: '/', name: 'Головна / Дашборд', checks: ['PREDATOR', 'декларац'] },
  { path: '/intelligence', name: 'Intelligence Hub', checks: ['РОЗВІДК', 'АНАЛІТИК'] },
  { path: '/admin', name: 'Admin Hub', checks: ['АДМІН', 'КОМАНДН'] },
  { path: '/analytics', name: 'Analytics View', checks: ['АНАЛІТИК'] },
  { path: '/risk', name: 'Risk Scoring', checks: ['РИЗИК'] },
  { path: '/graph', name: 'Graph View', checks: ['ГРАФ'] },
  { path: '/factory', name: 'Factory', checks: ['ФАБРИК', 'OODA'] },
  { path: '/wargaming', name: 'Wargaming', checks: ['ВАРГЕЙМІНГ', 'сценар', 'WAR'] },
  { path: '/cases', name: 'Cases', checks: ['КЕЙС', 'РОЗСЛІДУВАНН'] },
];

// Заборонені патерни (заглушки та симуляції)
const STUB_PATTERNS = [
  /lorem ipsum/i,
  /placeholder/i,
  /TODO:/i,
  /FIXME:/i,
  /sample data/i,
  /test data/i,
  /mock data/i,
  /dummy/i,
  /hardcoded/i,
];

async function auditPage(page, pageInfo) {
  const result = {
    name: pageInfo.name,
    path: pageInfo.path,
    status: 'UNKNOWN',
    errors: [],
    warnings: [],
    apiCalls: [],
    contentFound: [],
    stubsFound: [],
    loadTime: 0,
  };

  const startTime = Date.now();

  // Перехоплюємо мережеві запити
  const apiRequests = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let bodyPreview = '';
      try {
        const body = await response.text();
        bodyPreview = body.substring(0, 200);
      } catch (e) {
        bodyPreview = '[не вдалося прочитати]';
      }
      apiRequests.push({ url, status, bodyPreview });
    }
  });

  // Перехоплюємо помилки консолі
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT,
    });

    result.loadTime = Date.now() - startTime;

    // Чекаємо трохи для рендерингу React
    await page.waitForTimeout(2000);

    // Отримуємо весь текстовий контент
    const bodyText = await page.textContent('body');
    const htmlContent = await page.content();

    // Перевірка 1: Чи є основний контент
    for (const check of pageInfo.checks) {
      const regex = new RegExp(check, 'i');
      if (regex.test(bodyText)) {
        result.contentFound.push(check);
      } else {
        result.warnings.push(`Не знайдено очікуваний текст: "${check}"`);
      }
    }

    // Перевірка 2: Чи є заглушки
    for (const pattern of STUB_PATTERNS) {
      if (pattern.test(bodyText)) {
        result.stubsFound.push(pattern.toString());
      }
    }

    // Перевірка 3: Чи є "дані завантажуються" або "помилка"
    const loadingStuck = /завантаження|loading/i.test(bodyText) && 
                         !/завантажено|loaded/i.test(bodyText);
    if (loadingStuck) {
      result.warnings.push('Можливо, дані не завантажились (знайдено "завантаження" без "завантажено")');
    }

    // Перевірка 4: Пошук inline Math.random() чи fake-data генераторів в DOM
    const hasInlineRandom = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.textContent && s.textContent.includes('Math.random()') && s.textContent.includes('faker')) {
          return true;
        }
      }
      return false;
    });
    if (hasInlineRandom) {
      result.warnings.push('Знайдено inline Math.random() або faker в DOM scripts');
    }

    // Перевірка 5: Чи рендериться контент (не порожній root)
    const rootEmpty = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.children.length === 0 : true;
    });
    if (rootEmpty) {
      result.errors.push('React root порожній — SPA не відрендерилася');
    }

    // Перевірка 6: Чи є числові дані в дашборді (не всі нулі)
    const numbersOnPage = await page.evaluate(() => {
      const text = document.body.innerText;
      const numbers = text.match(/[\d,]+[\d]/g) || [];
      return numbers.filter(n => parseInt(n.replace(/,/g, ''), 10) > 0).length;
    });
    if (numbersOnPage < 2 && pageInfo.path === '/') {
      result.warnings.push(`Мало числових даних на дашборді: ${numbersOnPage}`);
    }

    // API запити
    result.apiCalls = apiRequests.map(r => ({
      url: r.url.replace(BASE_URL, ''),
      status: r.status,
      hasData: r.bodyPreview.length > 10 && !r.bodyPreview.includes('"error"'),
    }));

    // Перевірка 7: API помилки
    const failedApis = apiRequests.filter(r => r.status >= 400);
    if (failedApis.length > 0) {
      for (const f of failedApis) {
        result.warnings.push(`API ${f.status}: ${f.url.replace(BASE_URL, '')}`);
      }
    }

    // Перевірка 8: Console errors
    if (consoleErrors.length > 0) {
      // Фільтруємо шум
      const realErrors = consoleErrors.filter(e => 
        !e.includes('React DevTools') && 
        !e.includes('favicon') &&
        !e.includes('Unhandled Promise Rejection: TypeError: Load failed')
      );
      if (realErrors.length > 0) {
        result.warnings.push(`Console errors: ${realErrors.length}`);
      }
    }

    // Визначаємо статус
    if (result.errors.length > 0) {
      result.status = '❌ FAIL';
    } else if (result.stubsFound.length > 0) {
      result.status = '⚠️ STUBS_FOUND';
    } else if (result.contentFound.length === 0) {
      result.status = '⚠️ NO_CONTENT';
    } else if (result.warnings.length > 0) {
      result.status = '⚠️ WARNINGS';
    } else {
      result.status = '✅ OK';
    }

  } catch (e) {
    result.status = '❌ ERROR';
    result.errors.push(e.message);
  }

  return result;
}

async function main() {
  console.log('\n🦅 PREDATOR DOM AUDIT v1.0');
  console.log('━'.repeat(60));
  console.log(`Час: ${new Date().toLocaleString('uk-UA')}`);
  console.log(`URL: ${BASE_URL}`);
  console.log('━'.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'uk-UA',
  });

  const results = [];

  for (const pageInfo of PAGES_TO_CHECK) {
    const page = await context.newPage();
    console.log(`\n📄 Перевіряю: ${pageInfo.name} (${pageInfo.path})...`);
    
    const result = await auditPage(page, pageInfo);
    results.push(result);
    
    console.log(`   Статус: ${result.status} | Час: ${result.loadTime}ms`);
    if (result.contentFound.length > 0) {
      console.log(`   ✅ Знайдено: ${result.contentFound.join(', ')}`);
    }
    if (result.apiCalls.length > 0) {
      const successApis = result.apiCalls.filter(a => a.hasData);
      const failApis = result.apiCalls.filter(a => !a.hasData);
      console.log(`   📡 API: ${successApis.length} OK, ${failApis.length} без даних`);
    }
    if (result.stubsFound.length > 0) {
      console.log(`   🚫 Заглушки: ${result.stubsFound.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      for (const w of result.warnings) {
        console.log(`   ⚠️ ${w}`);
      }
    }
    if (result.errors.length > 0) {
      for (const e of result.errors) {
        console.log(`   ❌ ${e}`);
      }
    }

    await page.close();
  }

  await browser.close();

  // Підсумок
  console.log('\n' + '═'.repeat(60));
  console.log('📊 ПІДСУМОК DOM АУДИТУ');
  console.log('═'.repeat(60));
  
  const ok = results.filter(r => r.status.includes('OK')).length;
  const warn = results.filter(r => r.status.includes('⚠️')).length;
  const fail = results.filter(r => r.status.includes('❌')).length;
  
  console.log(`✅ Пройшли: ${ok}/${results.length}`);
  console.log(`⚠️ З попередженнями: ${warn}`);
  console.log(`❌ Провалені: ${fail}`);
  
  // Деталізація API
  const allApis = results.flatMap(r => r.apiCalls);
  const uniqueApis = [...new Set(allApis.map(a => a.url))];
  console.log(`\n📡 Унікальних API-запитів: ${uniqueApis.length}`);
  
  const stubPages = results.filter(r => r.stubsFound.length > 0);
  if (stubPages.length > 0) {
    console.log('\n🚫 СТОРІНКИ ІЗ ЗАГЛУШКАМИ:');
    for (const p of stubPages) {
      console.log(`   ${p.name}: ${p.stubsFound.join(', ')}`);
    }
  } else {
    console.log('\n✅ Заглушок (placeholder/lorem/dummy) НЕ знайдено');
  }

  // Виводимо детальну таблицю
  console.log('\n┌──────────────────────────┬─────────────────┬────────┬──────┐');
  console.log('│ Сторінка                 │ Статус          │ Час(ms)│ API  │');
  console.log('├──────────────────────────┼─────────────────┼────────┼──────┤');
  for (const r of results) {
    const name = r.name.padEnd(24).substring(0, 24);
    const status = r.status.padEnd(15).substring(0, 15);
    const time = String(r.loadTime).padStart(6);
    const apis = String(r.apiCalls.length).padStart(4);
    console.log(`│ ${name} │ ${status} │ ${time} │ ${apis} │`);
  }
  console.log('└──────────────────────────┴─────────────────┴────────┴──────┘');

  // JSON для артифакту
  const jsonPath = '/Users/dima1203/.gemini/antigravity-ide/brain/f874bb4a-19ba-478f-bc6c-dc437a8c6339/scratch/dom-audit-results.json';
  const fs = await import('fs');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Повний звіт: ${jsonPath}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
