# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 📝 Звітність QA >> UI Review: оцінка коректності відображення компонентів
- Location: e2e/rbac-scenarios.spec.ts:446:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=ОПЕРАТИВНИЙ ОФІЦЕР') to be visible

```

# Page snapshot

```yaml
- generic [ref=e7]:
  - generic:
    - generic:
      - img
  - generic:
    - generic:
      - generic:
        - generic:
          - generic: ЦІЛКОМ ТАЄМНО // SOVEREIGN_v61.0_ELITE
        - generic: │
        - generic: "КАТЕГОРІЯ ДОСТУПУ: СУВЕРЕННИЙ"
      - generic:
        - generic: 23:27:33 UTC+3
        - generic: 10.06.2026
      - generic:
        - generic:
          - img
          - generic: 1 248 ВУЗЛІВ
        - generic: │
        - generic:
          - img
          - generic: 194 КРАЇН
  - generic:
    - generic:
      - generic:
        - generic:
          - img
          - text: ПЕРЕХОПЛЕНО
        - generic: 2 848 073
        - generic: ТРАНЗАКЦІЙ ЗА ДОБУ
      - generic:
        - generic:
          - img
          - text: ЗАГРОЗИ
        - generic: 18 430
        - generic: ВИЯВЛЕНИХ ОБ'ЄКТІВ
      - generic:
        - generic:
          - img
          - text: АКТИВНИХ
        - generic: "342"
        - generic: ОПЕРАЦІЙ У СВІТІ
  - generic:
    - generic:
      - generic:
        - generic:
          - generic: КрИСТАЛИ-КІБЕ -1024
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: ДА КНЕТ / ONION СКАН
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: СУПУТН. ЗВ'ЯЗОК [47]
          - generic: ОНЛАЙН
        - generic:
          - img
      - generic:
        - generic:
          - generic: SWIFT/SEPA ПЕРЕХВАТ
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: БІОМЕТРІЯ / СІТКІВКА
          - generic: ОЧІКУЄ
        - generic:
          - img
    - generic:
      - generic: РІВЕНЬ ЗАГРОЗИ
      - generic: КРИТИЧНИЙ
      - generic: 1.3 TB ОБРОБЛЕНО
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e12]
        - text: ОПЕРАТИВНИЙ ТЕРМІНАЛ ПРИЙНЯТТЯ РІШЕНЬ [v61.0-ELITE]
        - img [ref=e14]
      - generic [ref=e16]: ОБЕРІТЬ РІВЕНЬ СУВЕРЕННОГО ДОПУСКУ ТІР-1
    - generic [ref=e17]:
      - button "ЦІЛКОМ_ТАЄМНО_ЕЛІТА РІВЕНЬ-СУВЕРЕННИЙ КОМАНДИР СУВЕРЕНІТЕТУ Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e18] [cursor=pointer]:
        - generic [ref=e19]:
          - img [ref=e21]
          - generic [ref=e23]:
            - generic [ref=e24]: ЦІЛКОМ_ТАЄМНО_ЕЛІТА
            - generic [ref=e25]: РІВЕНЬ-СУВЕРЕННИЙ
        - generic [ref=e26]:
          - generic [ref=e27]: КОМАНДИР СУВЕРЕНІТЕТУ
          - paragraph [ref=e28]: Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle.
        - generic [ref=e29]:
          - generic [ref=e32]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e33]:
            - text: УВІЙТИ
            - img [ref=e34]
      - 'button "СЕКРЕТНО_ПЛЮС РІВЕНЬ-VIP-DRPO DRPO-ДИРЕКТОР Повний клієнтський доступ: OSINT, фінансові потоки, AI-прогнозування. Без адміністрування. З''ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e36] [cursor=pointer]':
        - generic [ref=e37]:
          - img [ref=e39]
          - generic [ref=e41]:
            - generic [ref=e42]: СЕКРЕТНО_ПЛЮС
            - generic [ref=e43]: РІВЕНЬ-VIP-DRPO
        - generic [ref=e44]:
          - generic [ref=e45]: DRPO-ДИРЕКТОР
          - paragraph [ref=e46]: "Повний клієнтський доступ: OSINT, фінансові потоки, AI-прогнозування. Без адміністрування."
        - generic [ref=e47]:
          - generic [ref=e50]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e51]:
            - text: УВІЙТИ
            - img [ref=e52]
      - button "СЕКРЕТНО_ПЛЮС РІВЕНЬ-ЕЛІТА-IV СТАРШИЙ СТРАТЕГ Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e54] [cursor=pointer]:
        - generic [ref=e55]:
          - img [ref=e57]
          - generic [ref=e59]:
            - generic [ref=e60]: СЕКРЕТНО_ПЛЮС
            - generic [ref=e61]: РІВЕНЬ-ЕЛІТА-IV
        - generic [ref=e62]:
          - generic [ref=e63]: СТАРШИЙ СТРАТЕГ
          - paragraph [ref=e64]: Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування.
        - generic [ref=e65]:
          - generic [ref=e68]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e69]:
            - text: УВІЙТИ
            - img [ref=e70]
      - button "СЕКРЕТНО РІВЕНЬ-ЕЛІТА-III ОПЕРАТИВНИЙ ОФІЦЕР Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e72] [cursor=pointer]:
        - generic [ref=e73]:
          - img [ref=e75]
          - generic [ref=e77]:
            - generic [ref=e78]: СЕКРЕТНО
            - generic [ref=e79]: РІВЕНЬ-ЕЛІТА-III
        - generic [ref=e80]:
          - generic [ref=e81]: ОПЕРАТИВНИЙ ОФІЦЕР
          - paragraph [ref=e82]: Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії.
        - generic [ref=e83]:
          - generic [ref=e86]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e87]:
            - text: УВІЙТИ
            - img [ref=e88]
  - generic [ref=e91]:
    - generic [ref=e92]: ОПЕРАТИВНИЙ КАНАЛ
    - generic [ref=e93]:
      - generic [ref=e94]: "[ТРИВОГА] ПЕРЕХОПЛЕННЯ ШИФ ОВАНИХ ТРАНЗАКЦІЙ У СЕКТО І GAMMA-4 — АНАЛІЗ АКТИВНИЙ"
      - generic [ref=e95]: "[КРИТИЧНО] ВИЯВЛЕНО ОФШОРНУ МЕ ЕЖУ $47M ЧЕ ЕЗ SHELL-КОМПАНІЇ У BVI — ДЕАННІМІЗАЦІЯ..."
      - generic [ref=e96]: "[OK] СИНХРОНІЗАЦІЯ З СЕРВЕРАМИ МИТНИЦІ ПІДТВЕРДЖЕНА (NODE: КИЇВ-ЯДРО-03 · ПОЛІГОН-7)"
      - generic [ref=e97]: "[КОНТРОЛЬ] UEID-9472-BX: БЕНЕФІЦІАРА ВИЯВЛЕНО — $12.4M НЕОДЕКЛА РОВАНИХ АКТИВІВ — ЗАМОРОЖЕННЯ ІНІЦІЙОВАНО"
      - generic [ref=e98]: "[УВАГА] ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ: 3 ОБ'ЄКТІВ У СИСТЕМІ — МІСЦЕЗНАХОДЖЕННЯ НЕВІДОМО — МОНІТОРИНГ"
      - generic [ref=e99]: "[СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · 12.8 ГБ/с · ІНТЕ ЦЕПЦІЯ АКТИВНА"
      - generic [ref=e100]: "[ШІ ХАНТЕР] ЦІЛЬ ПІДТВЕРДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕРЕДАНО ДО SBU/NABU — СПРАВА #PRD-28847"
      - generic [ref=e101]: "[СП БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТОРИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT"
    - generic [ref=e102]: PREDATOR v61.0-ELITE
```

# Test source

```ts
  352 | 
  353 |     // Адмін повинен бачити тільки технічні секції
  354 |     await expect(page.getByText('SYSTEM COMMAND CENTER')).toBeVisible();
  355 |     await expect(page.getByText('AUTONOMOUS FACTORY')).toBeVisible();
  356 |   });
  357 | 
  358 |   test('4.2 Аудит Ізоляції: ручний перехід на клієнтський модуль', async ({ page }) => {
  359 |     // Спробуємо вручну вписати URL-адресу клієнтського модуля
  360 |     await page.goto('http://localhost:3030/search?tab=global');
  361 | 
  362 |     // Очікуваний результат: редирект на 403 або на головний дашборд адміна
  363 |     const currentUrl = page.url();
  364 |     
  365 |     // Перевіряємо, що ми не на клієнтському модулі
  366 |     expect(currentUrl).not.toContain('/search?tab=global');
  367 |     
  368 |     // Перевіряємо, що ми на адмін-дашборді або 403
  369 |     expect(currentUrl).toMatch(/\/admin\/|403/);
  370 |   });
  371 | 
  372 |   test('4.3 Аудит Інфраструктури: Телеметрія Кластера', async ({ page }) => {
  373 |     // Відкриваємо SYSTEM COMMAND CENTER
  374 |     await page.goto('http://localhost:3030/admin/command?tab=infra');
  375 | 
  376 |     // Перевіряємо коректність відображення метрик
  377 |     await expect(page.getByText('Телеметрія Кластера')).toBeVisible();
  378 |     
  379 |     // Перевіряємо наявність метрик (CPU, RAM, статус нод, VRAM)
  380 |     await expect(page.getByText(/CPU/i)).toBeVisible();
  381 |     await expect(page.getByText(/RAM/i)).toBeVisible();
  382 |   });
  383 | 
  384 |   test('4.4 Аудит Інфраструктури: DataOps Hub', async ({ page }) => {
  385 |     // Відкриваємо DataOps Hub
  386 |     await page.goto('http://localhost:3030/admin/command?tab=dataops');
  387 | 
  388 |     // Перевіряємо, що відображаються тільки системні логи
  389 |     await expect(page.getByText('DataOps Hub')).toBeVisible();
  390 |     
  391 |     // Перевіряємо відсутність пошукових запитів VIP-клієнтів
  392 |     const pageContent = await page.content();
  393 |     expect(pageContent).not.toContain('Еліт Бізнес Брок');
  394 |   });
  395 | 
  396 |   test('4.5 Аудит Інфраструктури: Оркестрація Агентів', async ({ page }) => {
  397 |     // Відкриваємо Оркестрацію Агентів
  398 |     await page.goto('http://localhost:3030/admin/command?tab=agents-ops');
  399 | 
  400 |     // Перевіряємо, що відображаються статуси виконання процесів
  401 |     await expect(page.getByText('Оркестрація Агентів')).toBeVisible();
  402 |     
  403 |     // Перевіряємо наявність статусів процесів
  404 |     await expect(page.getByText(/status|статус/i)).toBeVisible();
  405 |   });
  406 | });
  407 | 
  408 | test.describe('📝 Звітність QA', () => {
  409 |   test('Збір Network Logs для перевірки витоків даних', async ({ page }) => {
  410 |     // Цей тест демонструє, як збирати network logs
  411 |     const networkRequests: { url: string; status: number }[] = [];
  412 |     
  413 |     page.on('response', (response) => {
  414 |       networkRequests.push({
  415 |         url: response.url(),
  416 |         status: response.status(),
  417 |       });
  418 |     });
  419 | 
  420 |     // Логін як PROMO користувач (CLIENT_BASIC)
  421 |     await page.goto('http://localhost:3030/login');
  422 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  423 |     const coin = page.locator('.cursor-pointer').first();
  424 |     await coin.click();
  425 |     await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
  426 |     const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
  427 |     await roleButton.click();
  428 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  429 | 
  430 |     // Клікаємо на заблокований розділ
  431 |     const graphLink = page.locator('a[href="/graph"]');
  432 |     if (await graphLink.count() > 0) {
  433 |       await graphLink.click();
  434 |       await page.waitForTimeout(1000);
  435 | 
  436 |       // Перевіряємо, що API не "зливає" повні масиви даних
  437 |       const apiRequests = networkRequests.filter(req => req.url.includes('/api/v1/'));
  438 |       
  439 |       // Для заблокованих розділів API requests не повинні виконуватися
  440 |       // або повертати 403
  441 |       const dataLeakRequests = apiRequests.filter(req => req.status === 200);
  442 |       expect(dataLeakRequests.length).toBe(0);
  443 |     }
  444 |   });
  445 | 
  446 |   test('UI Review: оцінка коректності відображення компонентів', async ({ page }) => {
  447 |     // Логін як PROMO користувач (CLIENT_BASIC)
  448 |     await page.goto('http://localhost:3030/login');
  449 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  450 |     const coin = page.locator('.cursor-pointer').first();
  451 |     await coin.click();
> 452 |     await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  453 |     const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
  454 |     await roleButton.click();
  455 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  456 | 
  457 |     // Перевіряємо коректність відображення іконок замка
  458 |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  459 |     if (await lockIcons.count() > 0) {
  460 |       const firstLock = lockIcons.first();
  461 |       
  462 |       // Перевіряємо відсутність "зсувів" верстки
  463 |       const boundingBox = await firstLock.boundingBox();
  464 |       expect(boundingBox).toBeTruthy();
  465 |       
  466 |       // Перевіряємо правильні кольори (червоний акцент)
  467 |       const color = await firstLock.evaluate((el) => window.getComputedStyle(el).color);
  468 |       expect(color).toContain('244'); // RGB для червоного
  469 |     }
  470 | 
  471 |     // Перевіряємо коректність відображення UpgradePrompt
  472 |     const graphLink = page.locator('a[href="/graph"]');
  473 |     if (await graphLink.count() > 0) {
  474 |       await graphLink.click();
  475 |       await page.waitForTimeout(500);
  476 | 
  477 |       // Перевіряємо, що UpgradePrompt відображається коректно
  478 |       const upgradePrompt = page.getByText('Доступно у VIP плані');
  479 |       await expect(upgradePrompt).toBeVisible();
  480 |       
  481 |       // Перевіряємо відсутність "зсувів" верстки
  482 |       const boundingBox = await upgradePrompt.boundingBox();
  483 |       expect(boundingBox).toBeTruthy();
  484 |     }
  485 |   });
  486 | });
  487 | 
```