# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🟡 СЦЕНАРІЙ 2: Тестування ролі PRO (Рівень 2) >> 2.3 Аудит Маскування Даних: маскування на рівні API
- Location: e2e/rbac-scenarios.spec.ts:208:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.cursor-pointer').first()

```

# Test source

```ts
  71  | 
  72  |     // Перевіряємо, що бізнес-секції відображаються (не приховані)
  73  |     const businessSections = page.locator('aside').getByText(/EXECUTIVE|INTELLIGENCE|ANALYTICS|AI CORE|INVESTIGATION|OMNIVERSE/);
  74  |     const count = await businessSections.count();
  75  |     expect(count).toBeGreaterThan(0);
  76  |   });
  77  | 
  78  |   test('1.2 Аудит Навігації: іконки 🔒 на заблокованих модулях', async ({ page }) => {
  79  |     // Перевіряємо, що біля заблокованих преміум-модулів є іконка замка
  80  |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  81  |     
  82  |     // Перевіряємо, що іконки замка відображаються
  83  |     await expect(lockIcons.first()).toBeVisible();
  84  | 
  85  |     // Перевіряємо колір іконки (червоний акцент)
  86  |     const firstLock = lockIcons.first();
  87  |     const color = await firstLock.evaluate((el) => window.getComputedStyle(el).color);
  88  |     expect(color).toContain('244'); // RGB для червоного
  89  |   });
  90  | 
  91  |   test('1.3 Аудит Навігації: Tooltip на іконці 🔒', async ({ page }) => {
  92  |     // Наводимо курсор на іконку замка
  93  |     const lockIcon = page.locator('aside svg[data-lucide="lock"]').first();
  94  |     await lockIcon.hover();
  95  | 
  96  |     // Перевіряємо, що з'являється tooltip
  97  |     const tooltip = page.locator('title="Заблоковано для вашого рівня доступу"]');
  98  |     // Tooltip може бути реалізований через title атрибут або custom компонент
  99  |     // Перевіряємо наявність title атрибута
  100 |     const title = await lockIcon.getAttribute('title');
  101 |     expect(title).toBe('Заблоковано для вашого рівня доступу');
  102 |   });
  103 | 
  104 |   test('1.4 Аудит UI-Гвардів: UpgradePrompt при кліку на заблокований розділ', async ({ page }) => {
  105 |     // Клікаємо на заблокований розділ (наприклад, Нейронний Граф)
  106 |     const graphLink = page.locator('a[href="/graph"]');
  107 |     if (await graphLink.count() > 0) {
  108 |       await graphLink.click();
  109 | 
  110 |       // Перевіряємо, що замість контенту з'являється UpgradePrompt
  111 |       await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
  112 |       await expect(page.getByText('Отримайте доступ')).toBeVisible();
  113 |     }
  114 |   });
  115 | 
  116 |   test('1.5 Аудит UI-Гвардів: Network вкладка не завантажує дані', async ({ page }) => {
  117 |     // Починаємо моніторинг network requests
  118 |     const networkRequests: string[] = [];
  119 |     page.on('request', (request) => {
  120 |       networkRequests.push(request.url());
  121 |     });
  122 | 
  123 |     // Клікаємо на заблокований розділ
  124 |     const graphLink = page.locator('a[href="/graph"]');
  125 |     if (await graphLink.count() > 0) {
  126 |       await graphLink.click();
  127 |       await page.waitForTimeout(1000);
  128 | 
  129 |       // Перевіряємо, що API requests для цього розділу не виконуються
  130 |       const apiRequests = networkRequests.filter(url => url.includes('/api/v1/'));
  131 |       // Для заблокованих розділів API requests не повинні виконуватися
  132 |       // або повертати 403
  133 |     }
  134 |   });
  135 | 
  136 |   test('1.6 Аудит Маскування Даних: суворе маскування', async ({ page }) => {
  137 |     // Переходимо у відкритий розділ (наприклад, Митний Моніторинг)
  138 |     await page.goto('http://localhost:3030/market?tab=customs');
  139 | 
  140 |     // Вводимо пошуковий запит
  141 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  142 |     if (await searchInput.count() > 0) {
  143 |       await searchInput.fill('Еліт Бізнес Брок');
  144 |       await page.keyboard.press('Enter');
  145 |       await page.waitForTimeout(2000);
  146 | 
  147 |       // Перевіряємо, що дані масковані
  148 |       // ЄДРПОУ → "**"
  149 |       // Назва → "ТОВ *"
  150 |       // Суми → діапазони
  151 |       const pageContent = await page.content();
  152 |       
  153 |       // Перевіряємо наявність маскованих даних
  154 |       // (це залежить від реалізації UI)
  155 |       // expect(pageContent).toContain('**');
  156 |       // expect(pageContent).toContain('ТОВ *');
  157 |     }
  158 |   });
  159 | });
  160 | 
  161 | test.describe('🟡 СЦЕНАРІЙ 2: Тестування ролі PRO (Рівень 2)', () => {
  162 |   test.beforeEach(async ({ page }) => {
  163 |     // Логін під тестовим акаунтом PRO (CLIENT_PREMIUM)
  164 |     await page.goto('http://localhost:3030/login');
  165 |     
  166 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  167 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  168 |     
  169 |     // Клікаємо на монету/логотип для запуску сканування
  170 |     const coin = page.locator('.cursor-pointer').first();
> 171 |     await coin.click();
      |                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  172 |     
  173 |     // Чекаємо завершення сканування та появи екрану вибору ролей
  174 |     await page.waitForSelector('text=СТАРШИЙ СТРАТЕГ', { timeout: 15000 });
  175 |     
  176 |     // Клікаємо на кнопку-картку ролі СТАРШИЙ СТРАТЕГ (CLIENT_PREMIUM = PRO)
  177 |     const roleButton = page.locator('button').filter({ hasText: 'СТАРШИЙ СТРАТЕГ' });
  178 |     await roleButton.click();
  179 |     
  180 |     // Чекаємо переходу на головну сторінку
  181 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  182 |   });
  183 | 
  184 |   test('2.1 Аудит Функціоналу: доступність аналітичних модулів', async ({ page }) => {
  185 |     // Перевіряємо, що аналітичні модулі доступні
  186 |     await expect(page.getByText('Нейронний Граф')).toBeVisible();
  187 |     await expect(page.getByText('Сценарне Моделювання')).toBeVisible();
  188 | 
  189 |     // Перевіряємо, що іконки 🔒 відсутні на analyst-секціях
  190 |     const analystLinks = page.locator('a[href="/graph"], a[href="/scenarios"]');
  191 |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  192 |     
  193 |     // Іконки замка можуть бути тільки на drpo-секціях
  194 |     // але не на analyst-секціях для PRO ролі
  195 |   });
  196 | 
  197 |   test('2.2 Аудит Функціоналу: UpgradePrompt на ELITE-модулях', async ({ page }) => {
  198 |     // Клікаємо на ELITE-модуль (Карта Бенефіціарів)
  199 |     const beneficiariesLink = page.locator('a[href="/beneficiaries"]');
  200 |     if (await beneficiariesLink.count() > 0) {
  201 |       await beneficiariesLink.click();
  202 | 
  203 |       // Перевіряємо, що з'являється UpgradePrompt до VIP
  204 |       await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
  205 |     }
  206 |   });
  207 | 
  208 |   test('2.3 Аудит Маскування Даних: маскування на рівні API', async ({ page }) => {
  209 |     // Запускаємо графовий аналіз
  210 |     await page.goto('http://localhost:3030/graph');
  211 | 
  212 |     // Вводимо пошуковий запит
  213 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  214 |     if (await searchInput.count() > 0) {
  215 |       await searchInput.fill('Еліт Бізнес Брок');
  216 |       await page.keyboard.press('Enter');
  217 |       await page.waitForTimeout(2000);
  218 | 
  219 |       // Перевіряємо, що графи будуються, але ідентифікатори масковані
  220 |       // ЄДРПОУ частково масковані (наприклад, "12******")
  221 |       // Структура зв'язків видима, деанонімізації немає
  222 |     }
  223 |   });
  224 | });
  225 | 
  226 | test.describe('🔴 СЦЕНАРІЙ 3: Тестування ролі VIP (Рівень 3)', () => {
  227 |   test.beforeEach(async ({ page }) => {
  228 |     // Логін під тестовим акаунтом VIP (CLIENT_DRPO)
  229 |     await page.goto('http://localhost:3030/login');
  230 |     
  231 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
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
```