# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🛡️ СЦЕНАРІЙ 4: Тестування ролі ADMIN (Рівень 4) >> 4.4 Аудит Інфраструктури: DataOps Hub
- Location: e2e/rbac-scenarios.spec.ts:384:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=КОМАНДИР СУВЕРЕНІТЕТУ') to be visible

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
        - generic: 23:19:30 UTC+3
        - generic: 10.06.2026
      - generic:
        - generic:
          - img
          - generic: 1 249 ВУЗЛІВ
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
        - generic: 2 848 115
        - generic: ТРАНЗАКЦІЙ ЗА ДОБУ
      - generic:
        - generic:
          - img
          - text: ЗАГРОЗИ
        - generic: 18 436
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
    - generic [ref=e14]:
      - generic [ref=e15]: 100%
      - generic [ref=e16]: БІОМЕТРИЧНА_СИНХРОНІЗАЦІЯ
      - generic [ref=e17]: ДЕКОДУВАННЯ_СУВЕРЕННОГО_ХЕШУ...
    - generic [ref=e21]:
      - generic [ref=e22]: АВТЕНТИФІКАЦІЯ
      - generic [ref=e23]: ГОТОВИЙ_ДО_УПРАВЛІННЯ
  - generic [ref=e25]:
    - generic [ref=e26]: ОПЕРАТИВНИЙ КАНАЛ
    - generic [ref=e27]:
      - generic [ref=e28]: "[ТРИВОГА] ПЕРЕХОПЛЕННЯ ШИФ ОВАНИХ ТРАНЗАКЦІЙ У СЕКТО І GAMMA-4 — АНАЛІЗ АКТИВНИЙ"
      - generic [ref=e29]: "[КРИТИЧНО] ВИЯВЛЕНО ОФШОРНУ МЕ ЕЖУ $47M ЧЕ ЕЗ SHELL-КОМПАНІЇ У BVI — ДЕАННІМІЗАЦІЯ..."
      - generic [ref=e30]: "[OK] СИНХРОНІЗАЦІЯ З СЕРВЕРАМИ МИТНИЦІ ПІДТВЕРДЖЕНА (NODE: КИЇВ-ЯДРО-03 · ПОЛІГОН-7)"
      - generic [ref=e31]: "[КОНТРОЛЬ] UEID-9472-BX: БЕНЕФІЦІАРА ВИЯВЛЕНО — $12.4M НЕОДЕКЛА РОВАНИХ АКТИВІВ — ЗАМОРОЖЕННЯ ІНІЦІЙОВАНО"
      - generic [ref=e32]: "[УВАГА] ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ: 3 ОБ'ЄКТІВ У СИСТЕМІ — МІСЦЕЗНАХОДЖЕННЯ НЕВІДОМО — МОНІТОРИНГ"
      - generic [ref=e33]: "[СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · 13.4 ГБ/с · ІНТЕ ЦЕПЦІЯ АКТИВНА"
      - generic [ref=e34]: "[ШІ ХАНТЕР] ЦІЛЬ ПІДТВЕРДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕРЕДАНО ДО SBU/NABU — СПРАВА #PRD-28847"
      - generic [ref=e35]: "[СП БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТОРИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT"
    - generic [ref=e36]: PREDATOR v61.0-ELITE
```

# Test source

```ts
  232 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  233 |     
  234 |     // Клікаємо на монету/логотип для запуску сканування
  235 |     const coin = page.locator('.cursor-pointer').first();
  236 |     await coin.click();
  237 |     
  238 |     // Чекаємо завершення сканування та появи екрану вибору ролей
  239 |     await page.waitForSelector('text=DRPO-ДИРЕКТОР', { timeout: 15000 });
  240 |     
  241 |     // Клікаємо на кнопку-картку ролі DRPO-ДИРЕКТОР (CLIENT_DRPO = VIP)
  242 |     const roleButton = page.locator('button').filter({ hasText: 'DRPO-ДИРЕКТОР' });
  243 |     await roleButton.click();
  244 |     
  245 |     // Чекаємо переходу на головну сторінку
  246 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  247 |   });
  248 | 
  249 |   test('3.1 Аудит Повного Доступу: всі розділи відкриті', async ({ page }) => {
  250 |     // Перевіряємо, що всі 25+ розділів відкриті
  251 |     await expect(page.getByText('EXECUTIVE')).toBeVisible();
  252 |     await expect(page.getByText('INTELLIGENCE')).toBeVisible();
  253 |     await expect(page.getByText('ANALYTICS')).toBeVisible();
  254 |     await expect(page.getByText('AI CORE')).toBeVisible();
  255 |     await expect(page.getByText('INVESTIGATION')).toBeVisible();
  256 |     await expect(page.getByText('OMNIVERSE')).toBeVisible();
  257 | 
  258 |     // Перевіряємо, що іконки 🔒 відсутні
  259 |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  260 |     expect(await lockIcons.count()).toBe(0);
  261 |   });
  262 | 
  263 |   test('3.2 Аудит ELITE-модулів: завантаження даних', async ({ page }) => {
  264 |     // Відкриваємо ELITE-модуль (Карта Бенефіціарів)
  265 |     await page.goto('http://localhost:3030/beneficiaries');
  266 | 
  267 |     // Перевіряємо, що дані завантажуються
  268 |     await page.waitForTimeout(2000);
  269 |     const pageContent = await page.content();
  270 |     
  271 |     // Перевіряємо наявність контенту (не UpgradePrompt)
  272 |     expect(pageContent).not.toContain('Доступно у VIP плані');
  273 |   });
  274 | 
  275 |   test('3.3 Аудит Сирих Даних: 100% видимість', async ({ page }) => {
  276 |     // Здійснюємо пошук по тестових компаніях
  277 |     await page.goto('http://localhost:3030/search?tab=global');
  278 |     
  279 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  280 |     if (await searchInput.count() > 0) {
  281 |       await searchInput.fill('Еліт Бізнес Брок');
  282 |       await page.keyboard.press('Enter');
  283 |       await page.waitForTimeout(2000);
  284 | 
  285 |       // Перевіряємо, що відображаються реальні дані
  286 |       // ЄДРПОУ, точні суми, ПІБ засновників
  287 |       const pageContent = await page.content();
  288 |       
  289 |       // Перевіряємо відсутність маскування
  290 |       // expect(pageContent).not.toContain('**');
  291 |       // expect(pageContent).not.toContain('ТОВ *');
  292 |     }
  293 |   });
  294 | 
  295 |   test('3.4 Тест Функції Перемикання: canToggleSensitiveData', async ({ page }) => {
  296 |     // Шукаємо тумблер canToggleSensitiveData
  297 |     const toggle = page.locator('[data-testid="sensitive-data-toggle"]');
  298 |     
  299 |     if (await toggle.count() > 0) {
  300 |       // Перевіряємо початковий стан
  301 |       const initialState = await toggle.isChecked();
  302 |       
  303 |       // Перемикаємо в режим "Приховати"
  304 |       await toggle.click();
  305 |       await page.waitForTimeout(500);
  306 |       
  307 |       // Перевіряємо, що дані тимчасово замаскувалися
  308 |       // (це залежить від реалізації UI)
  309 |       
  310 |       // Перемикаємо назад
  311 |       await toggle.click();
  312 |       await page.waitForTimeout(500);
  313 |       
  314 |       // Перевіряємо, що дані знову відображаються
  315 |     }
  316 |   });
  317 | });
  318 | 
  319 | test.describe('🛡️ СЦЕНАРІЙ 4: Тестування ролі ADMIN (Рівень 4)', () => {
  320 |   test.beforeEach(async ({ page }) => {
  321 |     // Логін під тестовим акаунтом ADMIN
  322 |     await page.goto('http://localhost:3030/login');
  323 |     
  324 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  325 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  326 |     
  327 |     // Клікаємо на монету/логотип для запуску сканування
  328 |     const coin = page.locator('.cursor-pointer').first();
  329 |     await coin.click();
  330 |     
  331 |     // Чекаємо завершення сканування та появи екрану вибору ролей
> 332 |     await page.waitForSelector('text=КОМАНДИР СУВЕРЕНІТЕТУ', { timeout: 15000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  333 |     
  334 |     // Клікаємо на кнопку-картку ролі КОМАНДИР СУВЕРЕНІТЕТУ (ADMIN)
  335 |     const roleButton = page.locator('button').filter({ hasText: 'КОМАНДИР СУВЕРЕНІТЕТУ' });
  336 |     await roleButton.click();
  337 |     
  338 |     // Чекаємо переходу на головну сторінку
  339 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  340 |   });
  341 | 
  342 |   test('4.1 Аудит Ізоляції: навігація повністю змінена', async ({ page }) => {
  343 |     // Перевіряємо, що ліва панель навігації повністю змінена
  344 |     const sidebar = page.locator('[data-testid="sidebar"]');
  345 |     await expect(sidebar).toBeVisible();
  346 | 
  347 |     // Адмін НЕ повинен бачити бізнес-секції
  348 |     await expect(page.getByText('EXECUTIVE')).not.toBeVisible();
  349 |     await expect(page.getByText('INTELLIGENCE')).not.toBeVisible();
  350 |     await expect(page.getByText('ANALYTICS')).not.toBeVisible();
  351 |     await expect(page.getByText('INVESTIGATION')).not.toBeVisible();
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
```